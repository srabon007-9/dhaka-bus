export default function SeatSelector({ seats, selected, onToggle }) {
  const availableCount = seats.filter((seat) => !seat.booked && !selected.includes(seat.id)).length;
  const bookedCount = seats.filter((seat) => seat.booked).length;
  const selectedCount = selected.length;

  return (
    <div className="rounded-[32px] border border-cyan-400/10 bg-slate-950/70 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Seat Map</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-100">
            Pick seats for this bus
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Seats are locked only when another active booking overlaps your journey segment.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
          <LegendDot tone="bg-emerald-500" label={`Available (${availableCount})`} />
          <LegendDot tone="bg-amber-500" label={`Selected (${selectedCount})`} />
          <LegendDot tone="bg-slate-400" label={`Unavailable (${bookedCount})`} />
        </div>
      </div>

      <div className="mt-6 rounded-[28px] bg-slate-900/70 p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
            Driver
          </span>
          <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
            Front
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {seats.map((seat) => {
            const isSelected = selected.includes(seat.id);
            const stateClass = seat.booked
              ? 'border-white/10 bg-white/8 text-slate-500 cursor-not-allowed'
              : isSelected
                ? 'border-amber-300 bg-amber-300/15 text-amber-200 shadow-[0_18px_30px_rgba(245,158,11,0.12)]'
                : 'border-emerald-400/20 bg-slate-950 text-emerald-300 hover:border-cyan-300 hover:bg-cyan-400/10';

            return (
              <button
                key={seat.id}
                type="button"
                disabled={seat.booked}
                onClick={() => onToggle(seat.id)}
                className={`rounded-2xl border px-2 py-3 text-sm font-bold transition-all duration-150 ${stateClass}`}
              >
                {`S${seat.id}`}
              </button>
            );
          })}
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
