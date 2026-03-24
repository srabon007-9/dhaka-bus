import { useMemo, useState } from 'react';
import SeatSelector from '../components/SeatSelector';
import StepProgress from '../components/common/StepProgress';
import EmptyState from '../components/common/EmptyState';
import useLiveTracking from '../hooks/useLiveTracking';
import useToast from '../hooks/useToast';
import Toast from '../components/common/Toast';
import { ticketApi, tripApi } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import PageMotion from '../components/common/PageMotion';

const steps = ['Route', 'Trip', 'Seat', 'Confirm'];

const makeSeats = () =>
  Array.from({ length: 40 }).map((_, index) => ({
    id: `S${index + 1}`,
    booked: Math.random() > 0.78,
  }));

export default function BookingPage() {
  const { routes } = useLiveTracking();
  const { token, user } = useAuthContext();
  const [step, setStep] = useState(0);
  const [route, setRoute] = useState(null);
  const [trip, setTrip] = useState(null);
  const [seats] = useState(makeSeats);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [tripOptions, setTripOptions] = useState([]);
  const [passengerName, setPassengerName] = useState(user?.name || '');
  const toast = useToast();

  const trips = useMemo(() => tripOptions, [tripOptions]);

  const seatsWithStatus = useMemo(
    () => seats.map((seat) => ({ ...seat, booked: bookedSeats.includes(seat.id) })),
    [seats, bookedSeats]
  );

  const handleRouteSelect = async (routeItem) => {
    setRoute(routeItem);
    setTrip(null);
    setBookedSeats([]);
    setSelectedSeats([]);
    setStep(1);
    try {
      const data = await tripApi.list(routeItem.id);
      setTripOptions(data);
    } catch {
      toast.error('Failed to load trips for this route.');
    }
  };

  const handleTripSelect = async (tripItem) => {
    setTrip(tripItem);
    setStep(2);
    try {
      const reserved = await ticketApi.getBookedSeats(tripItem.id);
      setBookedSeats(reserved);
    } catch {
      toast.error('Could not load seat availability.');
    }
  };

  const onToggleSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((item) => item !== seatId) : [...prev, seatId]
    );
  };

  const confirmBooking = async () => {
    if (!route || !trip || !selectedSeats.length || !passengerName.trim()) {
      toast.error('Please complete all booking steps.');
      return;
    }

    try {
      await ticketApi.create(
        {
          trip_id: trip.id,
          seat_numbers: selectedSeats,
          passenger_name: passengerName,
        },
        token
      );

      toast.success('Booking confirmed successfully.');
      setStep(0);
      setRoute(null);
      setTrip(null);
      setSelectedSeats([]);
      setPassengerName(user?.name || '');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Booking failed. Please retry.');
    }
  };

  return (
    <PageMotion>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      <h2 className="text-2xl font-semibold text-white">Book Your Seat</h2>
      <p className="mt-1 text-sm text-slate-300">Follow the step-by-step booking flow.</p>

      <StepProgress steps={steps} currentStep={step} />

      {step === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRouteSelect(item)}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left hover:border-cyan-300/40"
            >
              <p className="text-white font-semibold">{item.route_name}</p>
              <p className="mt-1 text-sm text-slate-300">Stops: {item.coordinates?.length || 0}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {trips.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTripSelect(item)}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left hover:border-cyan-300/40"
            >
              <p className="text-lg font-semibold text-white">
                {new Date(item.departure_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="mt-1 text-sm text-slate-300">Fare: ৳ {item.fare}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <SeatSelector seats={seatsWithStatus} selected={selectedSeats} onToggle={onToggleSeat} />
          <button
            type="button"
            onClick={() => setStep(3)}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
          >
            Continue to Confirmation
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h3 className="text-xl font-semibold text-white">Confirm Booking</h3>
          <div className="space-y-2 text-sm text-slate-200">
            <p>Route: {route?.route_name}</p>
            <p>
              Trip:{' '}
              {trip
                ? new Date(trip.departure_time).toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
            <p>Seats: {selectedSeats.join(', ') || 'None selected'}</p>
            <p>Total Fare: ৳ {(Number(trip?.fare || 0) * selectedSeats.length).toFixed(2)}</p>
          </div>
          <input
            placeholder="Passenger full name"
            value={passengerName}
            onChange={(event) => setPassengerName(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white outline-none"
          />
          <div className="flex gap-3">
            <button type="button" onClick={confirmBooking} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
              Confirm Booking
            </button>
            <button type="button" onClick={() => setStep(2)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/20">
              Back
            </button>
          </div>
        </div>
      ) : null}

      {!routes.length ? <EmptyState title="No routes available" description="Please add routes from admin panel first." icon="🧭" /> : null}

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
      </section>
    </PageMotion>
  );
}
