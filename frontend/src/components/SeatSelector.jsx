export default function SeatSelector({ seats, selected, onToggle }) {
  const availableCount = seats.filter((seat) => !seat.booked && !selected.includes(seat.id)).length;
  const bookedCount = seats.filter((seat) => seat.booked).length;
  const selectedCount = selected.length;

  return (
    <div className="rounded-[32px] border border-cyan-400/10 bg-slate-950/70 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Seat Selection</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-100">
            Choose your seats
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Click to select available seats. Locked seats are already booked for your journey.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
          <LegendDot tone="bg-emerald-500" label={`Available (${availableCount})`} />
          <LegendDot tone="bg-amber-500" label={`Selected (${selectedCount})`} />
          <LegendDot tone="bg-slate-500" label={`Locked (${bookedCount})`} />
        </div>
      </div>

      <div className="mt-6 rounded-[28px] bg-slate-900/70 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-center rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
            🚌 Front of Bus (Driver)
          </span>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:gap-3 lg:grid-cols-6">
            {seats.map((seat) => {
              const isSelected = selected.includes(seat.id);
              const stateClass = seat.booked
                ? 'border-white/10 bg-white/8 text-slate-500 cursor-not-allowed opacity-50'
                : isSelected
                  ? 'border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_18px_30px_rgba(251,191,36,0.15)] scale-105'
                  : 'border-emerald-400/30 bg-slate-950 text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-400/10 hover:scale-105 cursor-pointer';

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={seat.booked}
                  onClick={() => onToggle(seat.id)}
                  className={`relative rounded-xl border px-2.5 py-3 text-xs font-bold transition-all duration-150 ${stateClass}`}
                  title={seat.booked ? 'This seat is booked' : `Seat ${seat.id}`}
                >
                  {seat.booked ? '✕' : `S${seat.id}`}
                  {isSelected && <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-amber-400"></span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[18px] bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">📍 Selected seats:</span>
            <span className="font-bold text-amber-300">{selected.length === 0 ? 'None' : `${selected.length} seat${selected.length > 1 ? 's' : ''}`}</span>
          </div>
          {selected.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {selected.map((id) => `S${id}`).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ tone, label }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/6 px-3 py-2">
      <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
      <span>{label}</span>
    </div>
  );
}
