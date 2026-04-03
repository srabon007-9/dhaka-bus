import { useState, useEffect, useCallback } from 'react';
import { ticketApi } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContextValue';
import useToast from '../../hooks/useToast';
import LoadingSkeleton from '../common/LoadingSkeleton';
import Modal from '../common/Modal';
import Toast from '../common/Toast';

export default function PaymentVerificationPanel() {
  const { token } = useAuthContext();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('verify');
  const [notes, setNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchPendingPayments = useCallback(async ({ showLoading = false } = {}) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await ticketApi.getPendingPayments(token);
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load pending payments');
      console.error(error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [token, toast]);

  useEffect(() => {
    fetchPendingPayments({ showLoading: true });
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchPendingPayments(), 30000);
    return () => clearInterval(interval);
  }, [fetchPendingPayments]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    setNotes('');
    setModalAction('verify');
  };

  const handleVerify = (payment) => {
    setSelectedPayment(payment);
    setNotes('');
    setModalAction('verify');
    setIsModalOpen(true);
  };

  const handleReject = (payment) => {
    setSelectedPayment(payment);
    setNotes('');
    setModalAction('reject');
    setIsModalOpen(true);
  };

  const confirmVerify = async () => {
    if (!selectedPayment) return;

    setVerifying(true);
    try {

      await ticketApi.verifyPayment(selectedPayment.payment_id, notes, token);
      toast.success('Payment confirmed, ticket issued, and email sent to user.');
      closeModal();
      fetchPendingPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Payment confirmation failed');
    } finally {
      setVerifying(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedPayment) return;

    setVerifying(true);
    try {

      await ticketApi.rejectPayment(selectedPayment.payment_id, notes, token);
      toast.success('Payment rejected successfully!');
      closeModal();
      fetchPendingPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Payment rejection failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={5} />;
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 space-y-2">
        <p className="text-gray-700 font-medium">No pending payments to verify</p>
        <p className="text-sm text-gray-500 px-6">
          The Confirm Payment button appears only when a user starts manual checkout and submits a pending payment request.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Payment ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{payment.payment_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{payment.user_email}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.amount} {payment.currency?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{payment.method || payment.payment_method}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'expired' ? 'bg-orange-100 text-orange-800' :
                      payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      {new Date(payment.created_at).toLocaleDateString()} {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleVerify(payment)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                      >
                        Confirm Payment
                      </button>
                      <button
                        onClick={() => handleReject(payment)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalAction === 'verify' ? 'Confirm Ticket Payment' : 'Reject Ticket Payment'}
      >
        <div className="space-y-4">
          {selectedPayment && (
            <div className="bg-white p-4 rounded-lg space-y-2 text-black">
              <p className="text-sm text-black"><span className="font-medium text-black">Payment ID:</span> {selectedPayment.payment_id}</p>
              <p className="text-sm text-black"><span className="font-medium text-black">User:</span> {selectedPayment.user_email}</p>
              <p className="text-sm text-black"><span className="font-medium text-black">Amount:</span> {selectedPayment.amount} {selectedPayment.currency?.toUpperCase()}</p>
              <p className="text-sm text-black"><span className="font-medium text-black">Method:</span> {selectedPayment.payment_method}</p>
              <p className="text-sm text-black"><span className="font-medium text-black">Status:</span> {selectedPayment.status}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              {modalAction === 'verify'
                ? 'Confirmation Notes (e.g., bKash/Nagad transaction reference)'
                : 'Rejection Reason (optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                modalAction === 'verify'
                  ? 'Enter payment confirmation notes...'
                  : 'Enter reason for rejection...'
              }
              className="w-full px-3 py-2 border border-white/30 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows="4"
            />
          </div>

          <div className="flex gap-2 pt-4">
            {modalAction === 'verify' ? (
              <button
                onClick={confirmVerify}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {verifying ? 'Confirming...' : 'Confirm Payment'}
              </button>
            ) : (
              <button
                onClick={confirmReject}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {verifying ? 'Rejecting...' : 'Reject Payment'}
              </button>
            )}
            <button
              onClick={closeModal}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}
