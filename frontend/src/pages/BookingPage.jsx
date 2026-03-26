import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SeatSelector from '../components/SeatSelector';
import StepProgress from '../components/common/StepProgress';
import EmptyState from '../components/common/EmptyState';
import ErrorCard from '../components/common/ErrorCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Modal from '../components/common/Modal';
import useLiveTracking from '../hooks/useLiveTracking';
import useToast from '../hooks/useToast';
import Toast from '../components/common/Toast';
import { stopApi, ticketApi, tripApi } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import PageMotion from '../components/common/PageMotion';

const steps = ['Choose Journey', 'Select Bus & Seats', 'Confirm Booking'];

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
  const [seatModalOpen, setSeatModalOpen] = useState(false);
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

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const paymentStatus = search.get('payment');
    const paymentRef = search.get('payment_ref');

    if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled. You can try again.');
      navigate('/booking', { replace: true });
      return;
    }

    if (paymentStatus === 'success' && paymentRef && token) {
      const finalizePayment = async () => {
        setProcessing(true);
        try {
          const result = await ticketApi.completePayment(paymentRef, token);
          const ticket = result?.ticket;

          if (!ticket) {
            throw new Error('Ticket confirmation response is incomplete.');
          }

          setSuccessState({
            routeName: ticket.route_name,
            busName: ticket.bus_name,
            departure: ticket.departure_time,
            journeyLabel: `${ticket.boarding_stop_name} to ${ticket.dropoff_stop_name}`,
            seatLabels: (ticket.seat_numbers || []).map((seat) => `S${seat}`).join(', '),
            totalPrice: Number(ticket.total_price).toFixed(2),
            email: user?.email || '',
          });
          setStep(3);
          toast.success('✓ Payment verified and booking confirmed!');
        } catch (error) {
          toast.error(error?.response?.data?.message || error.message || 'Payment verification failed.');
        } finally {
          setProcessing(false);
          navigate('/booking', { replace: true });
        }
      };

      finalizePayment();
    }
  }, [navigate, toast, token, user?.email]);

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
    setSeatModalOpen(false);
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
      setStopsError('Could not load stops for this route.');
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

  const handleBusSelect = async (tripItem) => {
    setTrip(tripItem);
    setSelectedSeats([]);
    try {
      const reserved = await ticketApi.getBookedSeats(tripItem.id, boardingStop.id, dropoffStop.id);
      setBookedSeats(
        reserved
          .map((seat) => Number(seat))
          .filter((seat) => Number.isInteger(seat) && seat > 0)
      );
      setSeatModalOpen(true);
    } catch {
      toast.error('Could not load seat availability.');
    }
  };

  const onToggleSeat = (seatId) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((item) => item !== seatId);
      }
      if (current.length >= 4) {
        toast.error('You can book up to 4 tickets at a time.');
        return current;
      }
      return [...current, seatId];
    });
  };

  const confirmSeatsAndContinue = () => {
    if (!selectedSeats.length) {
      toast.error('Please select at least one seat.');
      return;
    }
    setSeatModalOpen(false);
    setStep(2);
  };

  const confirmBooking = async () => {
    if (!trip || !boardingStop || !dropoffStop || !selectedSeats.length || !passengerName.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setProcessing(true);
    try {
      const checkout = await ticketApi.createCheckoutSession(
        {
          trip_id: trip.id,
          boarding_stop_id: boardingStop.id,
          dropoff_stop_id: dropoffStop.id,
          seat_numbers: selectedSeats,
          passenger_name: passengerName.trim(),
        },
        token
      );

      // Manual Payment Mode (shows bKash/Nagad account details)
      if (checkout?.paymentMethods) {
        setSuccessState({
          isManualPayment: true,
          paymentId: checkout.payment_id,
          amount: checkout.amount,
          currency: checkout.currency,
          paymentMethods: checkout.paymentMethods,
          routeName: stopApi.listByRoute ? 'Route Info' : '',
          busName: 'Bus',
          expiresIn: checkout.expiresIn,
        });
        setStep(3);
        toast.info('📱 Send money to complete your booking');
        setProcessing(false);
        return;
      }

      // Nagad Gateway Payment Mode
      if (!checkout?.nagad_payload) {
        throw new Error('Payment gateway did not return checkout details.');
      }

      // Submit Nagad payment form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkout.nagad_payload.apiURL || 'https://api.nagadpay.com/api/dfs/check-out';
      form.style.display = 'none';

      Object.entries(checkout.nagad_payload).forEach(([key, value]) => {
        if (key !== 'apiURL') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to start payment. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <PageMotion>
      <section className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          {/* Header */}
          <div className="hero-card rounded-[36px] p-8 sm:p-10">
            <p className="eyebrow">Fast Bus Booking</p>
            <h1 className="section-title mt-4">Book your ticket in 3 easy steps</h1>
            <p className="section-subtitle mt-5 max-w-2xl">
              Select routes, pick your bus, choose seats, and confirm your booking. Simple, fast, secure.
            </p>
            <div className="mt-8">
              <StepProgress steps={steps} currentStep={step} />
            </div>
          </div>

          {/* STEP 0: Choose Journey */}
          {step === 0 && (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <div>
                <p className="eyebrow">Step 1 of 3</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                  Where are you traveling?
                </h2>
                <p className="mt-2 text-sm text-slate-400">Select route and your stops</p>
              </div>

              {routesLoading && <div className="mt-6"><LoadingSkeleton rows={3} /></div>}
              {routesError && <div className="mt-6"><ErrorCard title="Could not load routes" description={routesError} onRetry={retry} /></div>}

              {!routesLoading && !routesError && (
                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  {routes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRouteSelect(item)}
                      className={`group rounded-3xl border p-5 text-left transition-all ${
                        route?.id === item.id
                          ? 'border-cyan-400/40 bg-cyan-500/12 shadow-[0_18px_38px_rgba(34,211,238,0.12)]'
                          : 'border-white/8 bg-white/3 hover:border-cyan-300/25 hover:bg-cyan-500/8'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Route</p>
                          <p className="mt-2 font-bold text-slate-100">{item.route_name}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.start_point} → {item.end_point}</p>
                        </div>
                        <svg className="h-5 w-5 text-cyan-300 opacity-0 transition-opacity group-hover:opacity-100">
                          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {route && (
                <div className="mt-8 rounded-[28px] border border-white/8 bg-white/3 p-5">
                  <p className="mb-4 text-sm font-semibold text-slate-200">Select your journey</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="boarding" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Boarding Stop
                      </label>
                      <select
                        id="boarding"
                        value={boardingStopId}
                        onChange={(e) => setBoardingStopId(e.target.value)}
                        className="field w-full bg-slate-900/50"
                      >
                        <option value="">Choose stop</option>
                        {stops.map((stop) => (
                          <option key={stop.id} value={stop.id}>
                            {`${stop.stop_order}. ${stop.stop_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dropoff" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Destination Stop
                      </label>
                      <select
                        id="dropoff"
                        value={dropoffStopId}
                        onChange={(e) => setDropoffStopId(e.target.value)}
                        className="field w-full bg-slate-900/50"
                      >
                        <option value="">Choose stop</option>
                        {stops
                          .filter((s) => !boardingStop || s.stop_order > boardingStop.stop_order)
                          .map((stop) => (
                            <option key={stop.id} value={stop.id}>
                              {`${stop.stop_order}. ${stop.stop_name}`}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {stopsLoading && <p className="mt-4 text-sm text-slate-400">Loading stops...</p>}
                  {stopsError && <div className="mt-4"><ErrorCard title="Error loading stops" description={stopsError} /></div>}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={!route || !boardingStop || !dropoffStop || stopsLoading}
                      className="btn-primary"
                    >
                      Next: Select Bus →
                    </button>
                    <button type="button" onClick={resetBooking} className="btn-secondary">
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Select Bus & Seats */}
          {step === 1 && (
            <div className="shell-card rounded-[36px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Step 2 of 3</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                    Pick your bus
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {boardingStop?.stop_name} to {dropoffStop?.stop_name}
                  </p>
                </div>
                <button onClick={() => setStep(0)} className="btn-secondary text-sm">
                  ← Back
                </button>
              </div>

              {tripLoading && <div className="mt-6"><LoadingSkeleton rows={4} /></div>}
              {tripError && <div className="mt-6"><ErrorCard title="Error loading buses" description={tripError} /></div>}
              {!tripLoading && !tripError && tripOptions.length === 0 && (
                <div className="mt-6"><EmptyState title="No buses available" description="Try different stops." icon="🚌" /></div>
              )}

              {!tripLoading && !tripError && tripOptions.length > 0 && (
                <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {tripOptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleBusSelect(item)}
                      type="button"
                      className="group rounded-3xl border border-white/8 bg-white/3 p-4 text-left transition-all hover:border-emerald-300/30 hover:bg-emerald-500/8"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Bus</p>
                          <p className="mt-1 font-bold text-slate-100">{item.bus_name || `Bus ${item.bus_id}`}</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-200">
                          {item.total_seats} seats
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-400">
                        <div className="flex justify-between">
                          <span>Departs</span>
                          <span className="font-semibold text-slate-200">{formatTime(item.departure_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price/seat</span>
                          <span className="font-semibold text-emerald-300">৳{calculateSegmentPrice(item, boardingStop, dropoffStop, stops)}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-center text-xs font-semibold text-emerald-200 opacity-0 transition-opacity group-hover:opacity-100">
                        Click to select seats
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Seat Selection Modal */}
              {seatModalOpen && trip && (
                <Modal isOpen={seatModalOpen} onClose={() => setSeatModalOpen(false)} title={`Select Seats - ${trip.bus_name || `Bus ${trip.bus_id}`}`}>
                  <div className="space-y-6">
                    <SeatSelector seats={seatsWithStatus} selected={selectedSeats} onToggle={onToggleSeat} />
                    <div className="border-t border-white/10 pt-6">
                      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-300">Selected seats: {selectedSeats.length}</span>
                        <span className="text-lg font-bold text-emerald-300">৳{(segmentPrice * selectedSeats.length).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmSeatsAndContinue}
                          disabled={selectedSeats.length === 0}
                          className="btn-primary flex-1"
                        >
                          Confirm Seats
                        </button>
                        <button onClick={() => setSeatModalOpen(false)} className="btn-secondary flex-1">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* STEP 2: Confirm Booking */}
          {step === 2 && !successState && (
            <div className="space-y-6">
              <div className="shell-card rounded-[36px] p-6 sm:p-8">
                <p className="eyebrow">Step 3 of 3</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                  Complete your booking
                </h2>
                <p className="mt-2 text-sm text-slate-400">Enter passenger details and confirm</p>

                <div className="mt-6">
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-200">
                    Passenger Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Full name"
                    className="field w-full"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">
                    Confirmation Email
                  </label>
                  <input
                    id="email"
                    disabled
                    value={user?.email || 'No email'}
                    className="field w-full cursor-not-allowed bg-white/6 text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">Ticket will be sent here</p>
                </div>
              </div>

              <div className="shell-card rounded-[36px] p-6 sm:p-8">
                <p className="eyebrow">Order Review</p>
                <div className="mt-5 space-y-4">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-slate-400">Route</span>
                    <span className="font-semibold text-slate-200">{route?.route_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-slate-400">Journey</span>
                    <span className="font-semibold text-slate-200">{boardingStop?.stop_name} → {dropoffStop?.stop_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-slate-400">Bus</span>
                    <span className="font-semibold text-slate-200">{trip?.bus_name || `Bus ${trip?.bus_id}`}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-slate-400">Seats</span>
                    <span className="font-semibold text-slate-200">{selectedSeatLabels}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-white/10 pt-4">
                    <span className="font-semibold text-slate-300">Total Price</span>
                    <span className="text-2xl font-extrabold text-emerald-300">৳{totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmBooking}
                  disabled={processing || !passengerName.trim()}
                  className="btn-primary flex-1"
                >
                  {processing ? 'Redirecting to payment...' : `Continue to Payment ৳${totalPrice}`}
                </button>
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {step === 3 && successState && (
            <div className="space-y-6">
              {successState.isManualPayment ? (
                // Manual Payment Display
                <div className="hero-card rounded-[36px] p-8 sm:p-10">
                  <div className="text-6xl mb-4 text-center">💳</div>
                  <h2 className="text-3xl font-extrabold text-center text-amber-300">Complete Your Payment</h2>
                  <p className="mt-4 text-center text-slate-300">
                    Send <strong className="text-white">৳{successState.amount}</strong> to complete your booking
                  </p>

                  <div className="mt-8 space-y-4">
                    {successState.paymentMethods.map((method) => (
                      <div key={method.method} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                        <h3 className="font-bold text-lg capitalize text-white">{method.method}</h3>
                        <div className="mt-3 space-y-2 text-sm">
                          <p><span className="text-slate-400">Account Name:</span> <strong>{method.accountName}</strong></p>
                          <p><span className="text-slate-400">Account Number:</span> <strong className="font-mono text-base">{method.accountNumber}</strong></p>
                          <p className="text-xs text-slate-400 mt-2">Reference: <code className="bg-black/30 px-2 py-1 rounded">{successState.paymentId}</code></p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl text-amber-100 text-sm">
                    <strong>⏱️ Payment expires in {successState.expiresIn}</strong>
                    <p className="mt-2">After sending money, click "I've Sent the Payment" below.</p>
                  </div>

                  <button
                    onClick={() => ticketApi.completeManualPayment(successState.paymentId, token).then(() => {
                      toast.success('Booking confirmed!');
                      setTimeout(() => navigate('/tickets'), 2000);
                    }).catch(() => toast.error('Payment not yet verified by admin'))}
                    className="btn-primary w-full mt-6"
                  >
                    I've Sent the Payment ✓
                  </button>

                  <button onClick={resetBooking} className="btn-secondary w-full mt-3">
                    Cancel
                  </button>
                </div>
              ) : (
                // Regular Booking Success
                <div className="hero-card rounded-[36px] p-8 sm:p-10 text-center">
                  <div className="text-6xl mb-4">✓</div>
                  <h2 className="text-4xl font-extrabold text-emerald-300">Booking Confirmed!</h2>
                  <p className="mt-4 text-base text-slate-400">
                    Your tickets are booked for <strong>{successState.journeyLabel}</strong> on <strong>{successState.busName}</strong>. Confirmation sent to {successState.email}.
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <SummaryCard label="Route" value={successState.routeName} />
                    <SummaryCard label="Journey" value={successState.journeyLabel} />
                    <SummaryCard label="Departure" value={formatDateTime(successState.departure)} />
                    <SummaryCard label="Seats" value={successState.seatLabels} />
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button onClick={resetBooking} className="btn-primary">
                      Book Another Trip
                    </button>
                    <button onClick={() => navigate('/tickets')} className="btn-secondary">
                      View My Tickets
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="shell-card rounded-[36px] p-6">
            <p className="eyebrow">Booking Summary</p>
            <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
              <SidebarBlock label="Route" value={route?.route_name || 'Select route'} />
              <SidebarBlock label="From" value={boardingStop?.stop_name || 'Select stop'} />
              <SidebarBlock label="To" value={dropoffStop?.stop_name || 'Select stop'} />
              <SidebarBlock label="Bus" value={trip?.bus_name || (trip ? `Bus ${trip.bus_id}` : 'Select bus')} />
              <SidebarBlock label="Seats" value={selectedSeatLabels || 'Not selected'} />
            </div>
          </div>

          <div className="rounded-[36px] bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <p className="text-sm text-slate-300">Estimated Total</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">৳{totalPrice}</p>
            <p className="mt-3 text-xs leading-6 text-slate-400">
              {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} at ৳{segmentPrice.toFixed(2)}/seat
            </p>
          </div>
        </aside>
      </section>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </PageMotion>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function SidebarBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-200">{value}</p>
    </div>
  );
}
