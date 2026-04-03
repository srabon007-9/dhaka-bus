import { useCallback, useEffect, useMemo, useState } from 'react';
import { stopApi, ticketApi, tripApi } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContextValue';
import useToast from '../../hooks/useToast';
import Toast from '../common/Toast';

const parseSeatList = (value) => {
  if (typeof value !== 'string') return [];
  return [...new Set(
    value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((seat) => Number.isInteger(seat) && seat > 0)
  )];
};

export default function PassengerFlowPanel() {
  const { token } = useAuthContext();
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tripRouteByTripId, setTripRouteByTripId] = useState({});
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopOptions, setStopOptions] = useState([]);

  const [tripId, setTripId] = useState('');
  const [flowLoading, setFlowLoading] = useState(false);
  const [flow, setFlow] = useState(null);

  const [ticketId, setTicketId] = useState('');
  const [eventStopId, setEventStopId] = useState('');
  const [eventSeats, setEventSeats] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventLoading, setEventLoading] = useState(false);

  const [ticketEventsLoading, setTicketEventsLoading] = useState(false);
  const [ticketEvents, setTicketEvents] = useState([]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'active'),
    [tickets]
  );

  const trips = useMemo(() => {
    const seen = new Map();
    tickets.forEach((ticket) => {
      if (!seen.has(ticket.trip_id)) {
        seen.set(ticket.trip_id, {
          trip_id: ticket.trip_id,
          route_name: ticket.route_name,
          departure_time: ticket.departure_time,
        });
      }
    });
    return Array.from(seen.values()).sort((a, b) => Number(a.trip_id) - Number(b.trip_id));
  }, [tickets]);

  const selectedTicket = useMemo(
    () => activeTickets.find((ticket) => Number(ticket.id) === Number(ticketId)) || null,
    [activeTickets, ticketId]
  );

  const selectedStopLabel = useMemo(() => {
    const selected = stopOptions.find((stop) => Number(stop.id) === Number(eventStopId));
    return selected ? `${selected.stop_order}. ${selected.stop_name}` : '';
  }, [stopOptions, eventStopId]);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await ticketApi.list(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load tickets for passenger flow.');
    } finally {
      setLoadingTickets(false);
    }
  }, [token, toast]);

  const loadTripsMeta = useCallback(async () => {
    try {
      const tripRows = await tripApi.list();
      const mapped = {};
      (Array.isArray(tripRows) ? tripRows : []).forEach((trip) => {
        mapped[trip.id] = Number(trip.route_id);
      });
      setTripRouteByTripId(mapped);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load trip metadata for stop selector.');
    }
  }, [toast]);

  const loadTripFlow = async () => {
    if (!tripId) {
      toast.error('Select a trip first.');
      return;
    }

    setFlowLoading(true);
    try {
      const data = await ticketApi.getTripPassengerFlow(tripId, token);
      setFlow(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load trip passenger flow.');
    } finally {
      setFlowLoading(false);
    }
  };

  const loadTicketEvents = useCallback(async (nextTicketId = ticketId) => {
    if (!nextTicketId) {
      setTicketEvents([]);
      return;
    }

    setTicketEventsLoading(true);
    try {
      const data = await ticketApi.getTicketEvents(nextTicketId, token);
      setTicketEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load ticket passenger events.');
    } finally {
      setTicketEventsLoading(false);
    }
  }, [ticketId, token, toast]);

  const submitEvent = async (type) => {
    if (!ticketId || !eventStopId) {
      toast.error('Ticket and stop are required.');
      return;
    }

    const payload = {
      stop_id: Number(eventStopId),
      notes: eventNotes.trim() || undefined,
    };

    const seats = parseSeatList(eventSeats);
    if (seats.length) {
      payload.seat_numbers = seats;
    }

    setEventLoading(true);
    try {
      if (type === 'board') {
        await ticketApi.recordBoardEvent(ticketId, payload, token);
        toast.success('Boarding event recorded.');
      } else {
        await ticketApi.recordAlightEvent(ticketId, payload, token);
        toast.success('Alighting event recorded.');
      }
      setEventSeats('');
      setEventNotes('');
      await loadTicketEvents(ticketId);
      if (tripId) {
        await loadTripFlow();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Could not record ${type} event.`);
    } finally {
      setEventLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadTripsMeta();
  }, [loadTickets, loadTripsMeta]);

  useEffect(() => {
    loadTicketEvents();
  }, [loadTicketEvents]);

  useEffect(() => {
    const loadStopsForTicket = async () => {
      if (!selectedTicket) {
        setStopOptions([]);
        setEventStopId('');
        return;
      }

      const routeId = tripRouteByTripId[selectedTicket.trip_id];
      if (!routeId) {
        setStopOptions([]);
        setEventStopId(String(selectedTicket.boarding_stop_id || ''));
        return;
      }

      setLoadingStops(true);
      try {
        const stops = await stopApi.listByRoute(routeId);
        const boardingOrder = Number(selectedTicket.boarding_stop_order);
        const dropoffOrder = Number(selectedTicket.dropoff_stop_order);

        const segmentStops = (Array.isArray(stops) ? stops : []).filter((stop) => {
          const order = Number(stop.stop_order);
          return Number.isFinite(order) && order >= boardingOrder && order <= dropoffOrder;
        });

        setStopOptions(segmentStops);

        const currentStopExists = segmentStops.some((stop) => Number(stop.id) === Number(eventStopId));
        if (!currentStopExists) {
          setEventStopId(String(selectedTicket.boarding_stop_id));
        }
      } catch (error) {
        setStopOptions([]);
        toast.error(error?.response?.data?.message || 'Could not load stops for selected ticket.');
      } finally {
        setLoadingStops(false);
      }
    };

    loadStopsForTicket();
  }, [selectedTicket, tripRouteByTripId, eventStopId, toast]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Trip Passenger Flow</h3>
        <p className="mt-1 text-sm text-slate-300">Boarded, alighted, and onboard counts by stop.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={tripId}
            onChange={(event) => setTripId(event.target.value)}
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="">Select trip</option>
            {trips.map((trip) => (
              <option key={trip.trip_id} value={trip.trip_id}>
                #{trip.trip_id} - {trip.route_name} ({new Date(trip.departure_time).toLocaleString()})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadTripFlow}
            disabled={flowLoading}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-70"
          >
            {flowLoading ? 'Loading...' : 'Load Flow'}
          </button>
        </div>

        {flow ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-300">
                  <th className="py-2 pr-4">Stop</th>
                  <th className="py-2 pr-4">Boarded</th>
                  <th className="py-2 pr-4">Alighted</th>
                  <th className="py-2">Onboard After Stop</th>
                </tr>
              </thead>
              <tbody>
                {flow.stops?.map((stop) => (
                  <tr key={stop.stop_id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{stop.stop_order}. {stop.stop_name}</td>
                    <td className="py-2 pr-4">{stop.boarded}</td>
                    <td className="py-2 pr-4">{stop.alighted}</td>
                    <td className="py-2">{stop.onboard_after_stop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
              <p>Total Boarded: <strong>{flow.totals?.boarded ?? 0}</strong></p>
              <p>Total Alighted: <strong>{flow.totals?.alighted ?? 0}</strong></p>
              <p>Latest Onboard: <strong>{flow.totals?.onboard_latest ?? 0}</strong></p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Record Boarding/Alighting</h3>
        <p className="mt-1 text-sm text-slate-300">Record events for all seats in a ticket or specific seats.</p>

        {loadingTickets ? <p className="mt-3 text-sm text-slate-400">Loading active tickets...</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            value={ticketId}
            onChange={(event) => {
              const nextTicketId = event.target.value;
              setTicketId(nextTicketId);
              const selected = activeTickets.find((item) => Number(item.id) === Number(nextTicketId));
              setEventStopId(selected ? String(selected.boarding_stop_id) : '');
            }}
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="">Select active ticket</option>
            {activeTickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                #{ticket.id} - {ticket.route_name} ({ticket.boarding_stop_name} to {ticket.dropoff_stop_name})
              </option>
            ))}
          </select>

          <select
            value={eventStopId}
            onChange={(event) => setEventStopId(event.target.value)}
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
            disabled={!ticketId || loadingStops || stopOptions.length === 0}
          >
            {!ticketId ? <option value="">Select ticket first</option> : null}
            {ticketId && loadingStops ? <option value="">Loading stops...</option> : null}
            {ticketId && !loadingStops && stopOptions.length === 0 ? <option value="">No segment stops found</option> : null}
            {stopOptions.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.stop_order}. {stop.stop_name} (#{stop.id})
              </option>
            ))}
          </select>

          <input
            value={eventSeats}
            onChange={(event) => setEventSeats(event.target.value)}
            placeholder="Seat numbers (optional), e.g. 12,13"
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
          />

          <input
            value={eventNotes}
            onChange={(event) => setEventNotes(event.target.value)}
            placeholder="Notes (optional)"
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>

        {selectedTicket ? (
          <p className="mt-3 text-xs text-slate-300">
            Ticket #{selectedTicket.id}: seats {Array.isArray(selectedTicket.seat_numbers) ? selectedTicket.seat_numbers.join(', ') : '-'} | selected stop {selectedStopLabel || '-'}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => submitEvent('board')}
            disabled={eventLoading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-70"
          >
            {eventLoading ? 'Saving...' : 'Record Board'}
          </button>
          <button
            type="button"
            onClick={() => submitEvent('alight')}
            disabled={eventLoading}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-70"
          >
            {eventLoading ? 'Saving...' : 'Record Alight'}
          </button>
          <button
            type="button"
            onClick={() => loadTicketEvents(ticketId)}
            disabled={!ticketId || ticketEventsLoading}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-70"
          >
            Refresh Events
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Ticket Event History</h3>
        <p className="mt-1 text-sm text-slate-300">Chronological board/alight log for selected ticket.</p>

        {ticketEventsLoading ? <p className="mt-3 text-sm text-slate-400">Loading events...</p> : null}

        {!ticketEventsLoading && ticketEvents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No events recorded for this ticket yet.</p>
        ) : null}

        {!ticketEventsLoading && ticketEvents.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-300">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Stop</th>
                  <th className="py-2 pr-4">Seat</th>
                  <th className="py-2 pr-4">Passenger</th>
                  <th className="py-2">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {ticketEvents.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{new Date(item.event_time).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{item.event_type}</td>
                    <td className="py-2 pr-4">{item.stop_name} (#{item.stop_id})</td>
                    <td className="py-2 pr-4">S{item.seat_number}</td>
                    <td className="py-2 pr-4">{item.passenger_name}</td>
                    <td className="py-2">{item.recorded_by_name || item.recorded_by_user_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </section>
  );
}
