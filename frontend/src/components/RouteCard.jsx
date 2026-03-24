export default function RouteCard({ route, onViewDetails }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-300/30">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Route</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{route.route_name}</h3>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>Stops: {route.coordinates?.length || 0}</span>
        <button type="button" className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-cyan-100 hover:bg-cyan-500/30" onClick={() => onViewDetails(route)}>
          Details
        </button>
      </div>
    </article>
  );
}
