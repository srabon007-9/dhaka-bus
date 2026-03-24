import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketCard from '../components/TicketCard';
import EmptyState from '../components/common/EmptyState';
import ErrorCard from '../components/common/ErrorCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Toast from '../components/common/Toast';
import useToast from '../hooks/useToast';
import { ticketApi } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import PageMotion from '../components/common/PageMotion';

const parseSeatNumbers = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function TicketsPage() {
  const { token } = useAuthContext();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketApi.list(token);
      setTickets(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load tickets right now.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const data = useMemo(
    () => tickets.filter((ticket) => (activeTab === 'active' ? ticket.status === 'active' : ticket.status !== 'active')),
    [tickets, activeTab]
  );

  const cancelTicket = async (id) => {
    try {
      await ticketApi.cancel(id, token);
      toast.success('Ticket cancelled.');
      fetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel ticket.');
    }
  };

  return (
    <PageMotion>
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl font-semibold text-white">Ticket Management</h2>
        <p className="mt-1 text-sm text-slate-300">View active bookings and ticket history.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'active' ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 text-slate-200'}`}
          >
            Active Bookings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'history' ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 text-slate-200'}`}
          >
            History
          </button>
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={4} /> : null}
      {error ? <ErrorCard title="Could not load tickets" description={error} onRetry={fetchTickets} /> : null}

      {!loading && !error && data.length === 0 ? (
        <EmptyState
          title={activeTab === 'active' ? 'No active bookings' : 'No ticket history'}
          description="Tickets will appear here after booking."
          icon="🎫"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((ticket) => (
            <div key={ticket.id} className="space-y-3">
              <TicketCard
                ticket={{
                  id: ticket.id,
                  routeName: ticket.route_name,
                  tripTime: new Date(ticket.departure_time).toLocaleString(),
                  seats: parseSeatNumbers(ticket.seat_numbers),
                  passengerName: ticket.passenger_name,
                  status: ticket.status,
                }}
              />
              {ticket.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => cancelTicket(ticket.id)}
                  className="rounded-xl bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30"
                >
                  Cancel Ticket
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </section>
    </PageMotion>
  );
}
