export default function SeatSelector({ seats, selected, onToggle }) {
  const availableCount = seats.filter((seat) => !seat.booked && !selected.includes(seat.id)).length;
  const bookedCount = seats.filter((seat) => seat.booked).length;
  const selectedCount = selected.length;
  const seatRows = chunkSeats(seats, 4);

  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,31,0.96),rgba(4,10,22,0.98))] p-4 shadow-[0_30px_80px_rgba(2,6,23,0.32)] sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-[1.65rem] font-black tracking-[-0.04em] text-slate-50 sm:text-[2rem]">
            Select your seat
          </p>
          <p className="mt-2 text-sm font-medium text-slate-400 sm:text-base">
            {availableCount} seats available
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <LegendPill tone="available" label="Available" count={availableCount} />
          <LegendPill tone="selected" label="Selected" count={selectedCount} />
          <LegendPill tone="locked" label="Booked" count={bookedCount} />
        </div>

        <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.03] px-3 py-5 sm:px-5 sm:py-6">
          <div className="mx-auto mb-5 w-fit rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-slate-500">
              Driver Area
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
              Front of bus
            </p>
          </div>

          <div className="mx-auto max-w-[680px] space-y-3 sm:space-y-4">
            {seatRows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex + 1}`}
                className="grid grid-cols-[1rem_minmax(0,1fr)_minmax(0,1fr)_0.8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.8rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-4"
              >
                <div className="text-center text-[0.72rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {getRowLabel(rowIndex)}
                </div>
                <SeatTile seat={row[0]} selected={selected} onToggle={onToggle} />
                <SeatTile seat={row[1]} selected={selected} onToggle={onToggle} />
                <div
                  aria-hidden="true"
                  className="h-full min-h-[74px] rounded-full bg-white/[0.04]"
                />
                <SeatTile seat={row[2]} selected={selected} onToggle={onToggle} />
                <SeatTile seat={row[3]} selected={selected} onToggle={onToggle} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Selected seats</p>
              <p className="mt-1 text-sm text-slate-400">
                {selectedCount === 0 ? 'Pick up to 4 seats from the layout above.' : selected.map((seatId) => `S${seatId}`).join(', ')}
              </p>
            </div>
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-sm font-bold text-cyan-100">
              {selectedCount} / 4 chosen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatTile({ seat, selected, onToggle }) {
  if (!seat) {
    return <div aria-hidden="true" className="h-[74px] sm:h-[88px]" />;
  }

  const isSelected = selected.includes(seat.id);
  const isBooked = seat.booked;
  const shellClass = isBooked
    ? 'border-white/8 bg-slate-800/55 text-slate-500 opacity-55'
    : isSelected
      ? 'border-cyan-300 bg-cyan-400/14 text-cyan-100 shadow-[0_18px_38px_rgba(34,211,238,0.14)]'
      : 'border-emerald-400/20 bg-slate-950/70 text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-400/8';
  const iconClass = isBooked
    ? 'bg-slate-600/35 border-slate-500/20'
    : isSelected
      ? 'bg-cyan-300/18 border-cyan-300/45'
      : 'bg-white/[0.03] border-emerald-400/15';
  const numberClass = isBooked ? 'text-slate-500' : isSelected ? 'text-cyan-100' : 'text-slate-100';
  const statusText = isBooked ? 'Booked' : isSelected ? 'Selected' : 'Open';

  return (
    <button
      type="button"
      disabled={isBooked}
      onClick={() => onToggle(seat.id)}
      className={`flex min-h-[74px] w-full flex-col items-center justify-center rounded-[22px] border px-1 py-2 text-center transition-all duration-200 sm:min-h-[88px] sm:rounded-[24px] sm:px-2 sm:py-3 ${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'} ${shellClass}`}
      title={isBooked ? 'This seat is booked' : `Seat ${seat.id}`}
    >
      <div className={`relative flex h-8 w-8 items-end justify-center rounded-t-[10px] border sm:h-10 sm:w-10 sm:rounded-t-[12px] ${iconClass}`}>
        <span className={`absolute -bottom-1.5 h-1.5 w-10 rounded-full border sm:w-12 ${iconClass}`} />
        <span className={`absolute left-0 top-2 h-4 w-1 rounded-full sm:top-3 sm:h-5 ${iconClass}`} />
        <span className={`absolute right-0 top-2 h-4 w-1 rounded-full sm:top-3 sm:h-5 ${iconClass}`} />
      </div>
      <div className={`mt-3 text-sm font-black leading-none tracking-[-0.03em] sm:text-base ${numberClass}`}>
        S{seat.id}
      </div>
      <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-current/65 sm:text-[0.64rem]">
        {statusText}
      </div>
    </button>
  );
}

function LegendPill({ tone, label, count }) {
  const styles = {
    available: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    selected: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
    locked: 'border-white/10 bg-white/[0.05] text-slate-300',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${styles[tone]}`}>
      <span className="font-medium">{label}</span>
      <span className="font-black">{count}</span>
    </div>
  );
}

function chunkSeats(seats, size) {
  const rows = [];

  for (let index = 0; index < seats.length; index += size) {
    rows.push(seats.slice(index, index + size));
  }

  return rows;
}

function getRowLabel(index) {
  return String.fromCharCode(65 + index);
}
