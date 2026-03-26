import { useState, useEffect, useCallback } from 'react';
import { ticketApi } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';
import useToast from '../../hooks/useToast';
import LoadingSkeleton from '../common/LoadingSkeleton';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function PaymentVerificationPanel() {
  const { token } = useAuthContext();
  const { error: showError, success: showSuccess } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      showError('Failed to load pending payments');
      console.error(error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [token, showError]);

  useEffect(() => {
    fetchPendingPayments({ showLoading: true });
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchPendingPayments(), 30000);
    return () => clearInterval(interval);
  }, [fetchPendingPayments]);

  const handleVerify = (payment) => {
    setSelectedPayment(payment);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleReject = (payment) => {
    setSelectedPayment(payment);
    setNotes('');
    setIsModalOpen(true);
  };

  const confirmVerify = async () => {
    if (!selectedPayment) return;

    setVerifying(true);
    try {

      await ticketApi.verifyPayment(selectedPayment.payment_id, notes, token);
      showSuccess('Payment verified successfully!');
      setIsModalOpen(false);
      setSelectedPayment(null);
      setNotes('');
      fetchPendingPayments();
    } catch (error) {
      showError(`Verification failed: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedPayment) return;

    setVerifying(true);
    try {

      await ticketApi.rejectPayment(selectedPayment.payment_id, notes, token);
      showSuccess('Payment rejected successfully!');
      setIsModalOpen(false);
      setSelectedPayment(null);
      setNotes('');
      fetchPendingPayments();
    } catch (error) {
      showError(`Rejection failed: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={5} />;
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No pending payments to verify</p>
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
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
                    {new Date(payment.created_at).toLocaleDateString()} {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 flex">
                    <button
                      onClick={() => handleVerify(payment)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleReject(payment)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${selectedPayment?.status === 'pending' && notes === '' ? 'Verify' : 'Add Notes for'} Payment`}
      >
        <div className="space-y-4">
          {selectedPayment && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm"><span className="font-medium">Payment ID:</span> {selectedPayment.payment_id}</p>
              <p className="text-sm"><span className="font-medium">User:</span> {selectedPayment.user_email}</p>
              <p className="text-sm"><span className="font-medium">Amount:</span> {selectedPayment.amount} {selectedPayment.currency?.toUpperCase()}</p>
              <p className="text-sm"><span className="font-medium">Method:</span> {selectedPayment.payment_method}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> {selectedPayment.status}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (e.g., bKash reference, confirmation details)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter payment confirmation notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={confirmVerify}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {verifying ? 'Verifying...' : 'Verify Payment'}
            </button>
            <button
              onClick={confirmReject}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {verifying ? 'Rejecting...' : 'Reject Payment'}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
