import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SeatSelector from '../components/SeatSelector';
import StepProgress from '../components/common/StepProgress';
import EmptyState from '../components/common/EmptyState';
import ErrorCard from '../components/common/ErrorCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import useLiveTracking from '../hooks/useLiveTracking';
import useToast from '../hooks/useToast';
import Toast from '../components/common/Toast';
import { stopApi, ticketApi, tripApi } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import PageMotion from '../components/common/PageMotion';

const steps = ['Journey', 'Bus', 'Seats', 'Passenger', 'Confirm', 'Done'];

const makeSeats = (count) =>
  Array.from({ length: count }).map((_, index) => ({
    id: index + 1,
    booked: false,
  }));

const formatDateTime = (value) =>
  new Date(value).toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const calculateSegmentPrice = (trip, boardingStop, dropoffStop, stops) => {
  if (!trip || !boardingStop || !dropoffStop || stops.length < 2) return 0;

  const minOrder = Math.min(...stops.map((stop) => stop.stop_order));
  const maxOrder = Math.max(...stops.map((stop) => stop.stop_order));
  const totalSegments = Math.max(1, maxOrder - minOrder);
  const segmentLength = dropoffStop.stop_order - boardingStop.stop_order;

  return Number(((Number(trip.fare) * segmentLength) / totalSegments).toFixed(2));
};

export default function BookingPage() {
  const navigate = useNavigate();
  const { routes, loading: routesLoading, error: routesError, retry } = useLiveTracking();
  const { token, user } = useAuthContext();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [stopsError, setStopsError] = useState('');
  const [boardingStopId, setBoardingStopId] = useState('');
  const [dropoffStopId, setDropoffStopId] = useState('');
  const [tripOptions, setTripOptions] = useState([]);
  const [trip, setTrip] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState('');
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerName, setPassengerName] = useState(user?.name || '');
  const [processing, setProcessing] = useState(false);
  const [successState, setSuccessState] = useState(null);

  const boardingStop = useMemo(
    () => stops.find((stop) => stop.id === Number(boardingStopId)) || null,
    [stops, boardingStopId]
  );
  const dropoffStop = useMemo(
    () => stops.find((stop) => stop.id === Number(dropoffStopId)) || null,
    [stops, dropoffStopId]
  );
  const segmentPrice = useMemo(
    () => calculateSegmentPrice(trip, boardingStop, dropoffStop, stops),
    [trip, boardingStop, dropoffStop, stops]
  );
  const seats = useMemo(() => makeSeats(Number(trip?.total_seats) || 40), [trip?.total_seats]);
  const seatsWithStatus = useMemo(
    () => seats.map((seat) => ({ ...seat, booked: bookedSeats.includes(seat.id) })),
    [bookedSeats, seats]
  );

  const totalPrice = (segmentPrice * selectedSeats.length).toFixed(2);
  const selectedSeatLabels = selectedSeats.map((seat) => `S${seat}`).join(', ');

  const resetBooking = () => {
    setStep(0);
    setRoute(null);
    setStops([]);
    setStopsError('');
    setStopsLoading(false);
    setBoardingStopId('');
    setDropoffStopId('');
    setTripOptions([]);
    setTrip(null);
    setTripLoading(false);
    setTripError('');
    setBookedSeats([]);
    setSelectedSeats([]);
    setPassengerName(user?.name || '');
    setProcessing(false);
    setSuccessState(null);
  };

  const handleRouteSelect = async (routeItem) => {
    setRoute(routeItem);
    setStops([]);
    setStopsLoading(true);
    setStopsError('');
    setBoardingStopId('');
    setDropoffStopId('');
    setTripOptions([]);
    setTrip(null);
    setBookedSeats([]);
    setSelectedSeats([]);
    setSuccessState(null);

    try {
      const routeStops = await stopApi.listByRoute(routeItem.id);
      setStops(routeStops);
    } catch {
      setStopsError('Could not load stops for this route right now.');
    } finally {
      setStopsLoading(false);
    }
  };

  useEffect(() => {
    const loadTrips = async () => {
      if (!route || !boardingStop || !dropoffStop) return;

      setTrip(null);
      setTripOptions([]);
      setBookedSeats([]);
      setSelectedSeats([]);
      setTripLoading(true);
      setTripError('');

      try {
        const data = await tripApi.list(route.id);
        setTripOptions(data.filter((item) => item.status !== 'cancelled' && item.status !== 'completed'));
      } catch {
        setTripError('Could not load buses for this journey.');
      } finally {
        setTripLoading(false);
      }
    };

    loadTrips();
  }, [route, boardingStop, dropoffStop]);

  const continueFromJourney = () => {
    if (!route || !boardingStop || !dropoffStop) {
      toast.error('Select a route, boarding stop, and destination stop first.');
      return;
    }
    setStep(1);
  };

  const handleTripSelect = async (tripItem) => {
    setTrip(tripItem);
    setSelectedSeats([]);
    setBookedSeats([]);

    try {
      const reserved = await ticketApi.getBookedSeats(tripItem.id, boardingStop.id, dropoffStop.id);
      setBookedSeats(
        reserved
          .map((seat) => Number(seat))
          .filter((seat) => Number.isInteger(seat) && seat > 0)
      );
      setStep(2);
    } catch {
      toast.error('Could not load seat availability right now.');
    }
  };

  const onToggleSeat = (seatId) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((item) => item !== seatId);
      }

      if (current.length >= 4) {
        toast.error('You can book at most 4 tickets at a time.');
        return current;
      }

      return [...current, seatId];
    });
  };

  const continueFromSeats = () => {
    if (!selectedSeats.length) {
      toast.error('Pick at least one seat to continue.');
      return;
    }
    setStep(3);
  };

  const continueFromPassenger = () => {
    if (!passengerName.trim()) {
      toast.error('Enter the passenger name before continuing.');
      return;
    }
    setStep(4);
  };

  const confirmBooking = async () => {
    if (!trip || !boardingStop || !dropoffStop || !selectedSeats.length || !passengerName.trim()) {
      toast.error('Complete each step before confirming the booking.');
      return;
    }

    setProcessing(true);

    try {
      await ticketApi.create(
        {
          trip_id: trip.id,
          boarding_stop_id: boardingStop.id,
          dropoff_stop_id: dropoffStop.id,
          seat_numbers: selectedSeats,
          passenger_name: passengerName.trim(),
        },
        token
      );

      const confirmation = {
        routeName: route.route_name,
        busName: trip.bus_name || `Bus ${trip.bus_id}`,
        departure: trip.departure_time,
        journeyLabel: `${boardingStop.stop_name} to ${dropoffStop.stop_name}`,
        seatLabels: selectedSeatLabels,
        totalPrice,
        email: user?.email || '',
      };

      setSuccessState(confirmation);
      setStep(5);
      toast.success('Booking confirmed successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageMotion>
      <section className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="hero-card rounded-[36px] p-8 sm:p-10">
            <p className="eyebrow">Ticket Booking</p>
            <h1 className="section-title mt-4">
              Rebuilt as a guided, production-style checkout.
            </h1>
            <p className="section-subtitle mt-5 max-w-2xl">
              Riders choose a route, select where they board and exit, pick a specific bus departure, reserve seats, review the fare, and confirm with clear feedback.
            </p>
            <div className="mt-8">
              <StepProgress steps={steps} currentStep={step} />
            </div>
          </div>

          {step === 0 ? (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Step 1</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                    Choose your route and journey
                  </h2>
                </div>
              </div>

              {routesLoading ? <div className="mt-6"><LoadingSkeleton rows={3} /></div> : null}
              {routesError ? <div className="mt-6"><ErrorCard title="Could not load routes" description={routesError} onRetry={retry} /></div> : null}

              {!routesLoading && !routesError ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {routes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRouteSelect(item)}
                      className={`rounded-[28px] border p-5 text-left transition-all ${
                        route?.id === item.id
                          ? 'border-cyan-300/30 bg-cyan-400/10 shadow-[0_18px_38px_rgba(34,211,238,0.08)]'
                          : 'border-white/10 bg-white/5 hover:border-cyan-300/20 hover:bg-cyan-400/8'
                      }`}
                    >
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Route</p>
                      <p className="mt-3 text-xl font-bold tracking-[-0.02em] text-slate-100">{item.route_name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.start_point} to {item.end_point}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        {item.stops?.length || 0} stops available
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {route ? (
                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-200">Boarding stop</label>
                      <select
                        value={boardingStopId}
                        onChange={(event) => setBoardingStopId(event.target.value)}
                        className="field"
                      >
                        <option value="">Select where you get on</option>
                        {stops.map((stop) => (
                          <option key={stop.id} value={stop.id}>
                            {`${stop.stop_order}. ${stop.stop_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-200">Destination stop</label>
                      <select
                        value={dropoffStopId}
                        onChange={(event) => setDropoffStopId(event.target.value)}
                        className="field"
                      >
                        <option value="">Select where you get off</option>
                        {stops
                          .filter((stop) => !boardingStop || stop.stop_order > boardingStop.stop_order)
                          .map((stop) => (
                            <option key={stop.id} value={stop.id}>
                              {`${stop.stop_order}. ${stop.stop_name}`}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {stopsLoading ? <div className="mt-5"><LoadingSkeleton rows={2} /></div> : null}
                  {stopsError ? <div className="mt-5"><ErrorCard title="Could not load stops" description={stopsError} onRetry={() => handleRouteSelect(route)} /></div> : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={continueFromJourney} className="btn-primary">
                      Continue to bus selection
                    </button>
                    <button type="button" onClick={resetBooking} className="btn-secondary">
                      Reset booking
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Step 2</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                    Select your bus departure
                  </h2>
                </div>
                <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                  Back to journey
                </button>
              </div>

              {tripLoading ? <div className="mt-6"><LoadingSkeleton rows={4} /></div> : null}
              {tripError ? <div className="mt-6"><ErrorCard title="Could not load buses" description={tripError} onRetry={continueFromJourney} /></div> : null}
              {!tripLoading && !tripError && tripOptions.length === 0 ? (
                <div className="mt-6">
                  <EmptyState title="No departures available" description="Try another route or a different journey segment." icon="🕒" />
                </div>
              ) : null}

              {!tripLoading && !tripError && tripOptions.length > 0 ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {tripOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTripSelect(item)}
                      className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-cyan-300/20 hover:bg-cyan-400/8"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Bus</p>
                          <h3 className="mt-3 text-xl font-bold tracking-[-0.02em] text-slate-100">
                            {item.bus_name || `Bus ${item.bus_id}`}
                          </h3>
                        </div>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-300">
                          {item.bus_status || 'scheduled'}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                        <InfoPill label="Departure" value={formatTime(item.departure_time)} />
                        <InfoPill label="Arrival" value={formatTime(item.arrival_time)} />
                        <InfoPill label="Fare / seat" value={`৳ ${calculateSegmentPrice(item, boardingStop, dropoffStop, stops).toFixed(2)}`} />
                        <InfoPill label="Capacity" value={`${item.total_seats} seats`} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <SeatSelector seats={seatsWithStatus} selected={selectedSeats} onToggle={onToggleSeat} />
              <div className="shell-card flex flex-wrap gap-3 rounded-[32px] p-5">
                <button type="button" onClick={continueFromSeats} className="btn-primary">
                  Continue to passenger details
                </button>
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  Back to bus selection
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <p className="eyebrow">Step 4</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                Passenger details
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Confirm who is traveling. The booking account email is used as the verified contact for this purchase.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Passenger full name</label>
                  <input
                    value={passengerName}
                    onChange={(event) => setPassengerName(event.target.value)}
                    placeholder="Passenger full name"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Verified email</label>
                  <input
                    disabled
                    value={user?.email || ''}
                    className="field cursor-not-allowed bg-white/6 text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={continueFromPassenger} className="btn-primary">
                  Review booking
                </button>
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  Back to seats
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <p className="eyebrow">Step 5</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                Review and confirm
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SummaryCard label="Route" value={route?.route_name} />
                <SummaryCard label="Journey" value={`${boardingStop?.stop_name} to ${dropoffStop?.stop_name}`} />
                <SummaryCard label="Bus" value={trip?.bus_name || `Bus ${trip?.bus_id}`} />
                <SummaryCard label="Departure" value={trip ? formatDateTime(trip.departure_time) : 'N/A'} />
                <SummaryCard label="Seats" value={selectedSeatLabels || 'None'} />
                <SummaryCard label="Passenger" value={passengerName || 'N/A'} />
              </div>

              <div className="mt-6 rounded-[28px] bg-slate-950 p-6 text-white">
                <p className="text-sm text-slate-300">Total payable</p>
                <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">৳ {totalPrice}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} × ৳ {segmentPrice.toFixed(2)}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={processing}
                  className="btn-primary"
                >
                  {processing ? 'Confirming booking...' : 'Confirm and pay'}
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                  Back to passenger details
                </button>
              </div>
            </div>
          ) : null}

          {step === 5 && successState ? (
            <div className="hero-card rounded-[36px] p-8 sm:p-10">
              <p className="eyebrow">Booked</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-100">
                Your tickets are confirmed.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                A verified booking was created for {successState.journeyLabel} on {successState.busName}. The account email {successState.email} remains the booking contact.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <SummaryCard label="Route" value={successState.routeName} />
                <SummaryCard label="Journey" value={successState.journeyLabel} />
                <SummaryCard label="Departure" value={formatDateTime(successState.departure)} />
                <SummaryCard label="Seats" value={successState.seatLabels} />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={resetBooking} className="btn-primary">
                  Book another trip
                </button>
                <button type="button" onClick={() => navigate('/tickets')} className="btn-secondary">
                  View my tickets
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="shell-card rounded-[36px] p-6">
            <p className="eyebrow">Booking Summary</p>
            <div className="mt-5 space-y-4">
              <SidebarBlock label="Route" value={route?.route_name || 'Choose a route'} />
              <SidebarBlock label="Boarding" value={boardingStop?.stop_name || 'Select stop'} />
              <SidebarBlock label="Destination" value={dropoffStop?.stop_name || 'Select stop'} />
              <SidebarBlock label="Bus" value={trip?.bus_name || (trip ? `Bus ${trip.bus_id}` : 'Select bus')} />
              <SidebarBlock label="Seats" value={selectedSeatLabels || 'Select seats'} />
            </div>
          </div>

          <div className="rounded-[36px] bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <p className="text-sm text-slate-300">Estimated total</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">৳ {totalPrice}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Segment-based pricing keeps the fare aligned to where the rider actually boards and exits.
            </p>
          </div>
        </aside>
      </section>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </PageMotion>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SidebarBlock({ label, value }) {
  return (
    <div className="rounded-[24px] bg-slate-50 px-4 py-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
