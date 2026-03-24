export default function SeatSelector({ seats, selected, onToggle }) {
  const availableCount = seats.filter(s => !s.booked && !selected.includes(s.id)).length;
  const bookedCount = seats.filter(s => s.booked).length;
  const selectedCount = selected.length;

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Select Your Seats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Available <span className="font-semibold text-emerald-400">({availableCount})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-300">Booked <span className="font-semibold text-red-400">({bookedCount})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Selected <span className="font-semibold text-cyan-400">({selectedCount})</span></span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
        {seats.map((seat) => {
          const isSelected = selected.includes(seat.id);
          let baseClass = 'border ';
          
          if (seat.booked) {
            baseClass += 'bg-red-500/20 border-red-500/50 text-red-400 cursor-not-allowed opacity-60';
          } else if (isSelected) {
            baseClass += 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-500/30 scale-105';
          } else {
            baseClass += 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/20';
          }

          return (
            <button
              key={seat.id}
              type="button"
              disabled={seat.booked}
              onClick={() => onToggle(seat.id)}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 ${baseClass}`}
            >
              {seat.id}
            </button>
          );
        })}
      </div>
      {selectedCount > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <p className="text-sm text-cyan-300">
            ✓ You have selected <span className="font-bold text-cyan-200">{selectedCount}</span> seat{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
