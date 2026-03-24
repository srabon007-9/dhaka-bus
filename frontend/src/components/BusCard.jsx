import StatusBadge from './common/StatusBadge';

export default function BusCard({ bus, location, onSelect }) {
  const speed = (bus.id * 7 + new Date().getSeconds()) % 60;
  const status = speed < 5 ? 'stopped' : speed > 45 ? 'delayed' : 'moving';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(bus)}
      className="card w-full p-5 text-left transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">🚌 Bus</p>
          <h4 className="mt-2 text-base font-bold text-white">{bus.name}</h4>
          <p className="mt-1 text-sm text-slate-400">{bus.route_name}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-2 border-t border-white/5 pt-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">⏱️ ETA</span>
          <span className="font-semibold text-cyan-300">{8 + (bus.id % 6)} min</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">⚡ Speed</span>
          <span className="font-semibold text-yellow-300">{speed} km/h</span>
        </div>
        {location && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">📍 Location</span>
            <span className="font-mono text-xs text-slate-500 truncate">{location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
