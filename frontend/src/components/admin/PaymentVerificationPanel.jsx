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
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          ✓
        </div>
        <p className="text-white font-semibold text-lg tracking-wide">All caught up!</p>
        <p className="text-sm text-slate-400 max-w-md text-center">
          There are no pending payments to verify right now. New manual checkout requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50">
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment ID</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Requested At</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="transition-colors hover:bg-white/5 group">
                  <td className="px-4 py-4">
                    <span className="block max-w-[130px] truncate font-mono text-sm text-cyan-400" title={payment.payment_id}>{payment.payment_id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 ring-1 ring-white/10">
                        {payment.user_email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="block max-w-[150px] truncate text-sm font-medium text-slate-200" title={payment.user_email}>{payment.user_email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-white">
                      {payment.amount} <span className="text-slate-400 text-xs">{payment.currency?.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize mt-0.5">{payment.method || payment.payment_method}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      payment.status === 'expired' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      payment.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-400">{new Date(payment.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleVerify(payment)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-900 transition-colors text-xs font-bold tracking-wide"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReject(payment)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-xs font-bold tracking-wide"
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
        <div className="space-y-5">
          {selectedPayment && (
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl space-y-3 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment ID</p>
                  <p className="font-mono text-sm text-cyan-400">{selectedPayment.payment_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-sm font-bold text-white">{selectedPayment.amount} {selectedPayment.currency?.toUpperCase()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">User Email</p>
                  <p className="text-sm text-slate-200">{selectedPayment.user_email}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 pl-1">
              {modalAction === 'verify'
                ? 'Verification Notes (e.g., TrxID)'
                : 'Reason for Rejection (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                modalAction === 'verify'
                  ? 'Enter transaction ID or confirmation notes...'
                  : 'Enter reason for rejection...'
              }
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-inner resize-none"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={closeModal}
              disabled={verifying}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 font-semibold transition-colors border border-white/5"
            >
              Cancel
            </button>
            {modalAction === 'verify' ? (
              <button
                onClick={confirmVerify}
                disabled={verifying}
                className="flex-[2] px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 disabled:opacity-50 font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              >
                {verifying ? 'Confirming...' : 'Confirm Payment'}
              </button>
            ) : (
              <button
                onClick={confirmReject}
                disabled={verifying}
                className="flex-[2] px-4 py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500 hover:text-white disabled:opacity-50 font-bold transition-colors"
              >
                {verifying ? 'Rejecting...' : 'Reject Payment'}
              </button>
            )}
          </div>
        </div>
      </Modal>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}
