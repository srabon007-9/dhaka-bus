export default function TicketCard({ ticket }) {
  const passengerDetails = Array.isArray(ticket.passengerDetails) ? ticket.passengerDetails : [];

  return (
    <article className="rounded-2xl border border-cyan-300/30 bg-slate-900/60 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">E-Ticket</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{ticket.routeName}</h3>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">{ticket.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
        <div>
          <p className="text-xs text-slate-400">Trip</p>
          <p>{ticket.tripTime}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Seats</p>
          <p>{ticket.seats.map((seat) => `S${seat}`).join(', ')}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">From</p>
          <p>{ticket.boardingStop}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">To</p>
          <p>{ticket.dropoffStop}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Passenger</p>
          {passengerDetails.length > 0 ? (
            <div className="space-y-1">
              {passengerDetails.map((item) => (
                <p key={`${ticket.id}-${item.seat_number}`} className="text-xs">
                  S{item.seat_number}: {item.passenger_name}
                </p>
              ))}
            </div>
          ) : (
            <p>{ticket.passengerName}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400">Fare</p>
          <p>৳ {ticket.totalPrice}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Booking ID</p>
          <p>#{ticket.id}</p>
        </div>
      </div>
    </article>
  );
}
