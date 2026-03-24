import { useMemo, useState } from 'react';
import Modal from '../components/common/Modal';
import RouteCard from '../components/RouteCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorCard from '../components/common/ErrorCard';
import useLiveTracking from '../hooks/useLiveTracking';
import PageMotion from '../components/common/PageMotion';

export default function RoutesPage() {
  const { routes, loading, error, retry } = useLiveTracking();
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [selectedRoute, setSelectedRoute] = useState(null);

  const filtered = useMemo(() => {
    return routes.filter((route) => {
      const text = route.route_name?.toLowerCase() || '';
      return text.includes(filters.from.toLowerCase()) && text.includes(filters.to.toLowerCase());
    });
  }, [routes, filters]);

  return (
    <PageMotion>
      <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl font-semibold text-white">All Routes</h2>
        <p className="mt-1 text-sm text-slate-300">Filter routes by start and destination keywords.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Start location"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            className="rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none"
          />
          <input
            placeholder="Destination"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            className="rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none"
          />
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={6} /> : null}
      {error ? <ErrorCard title="Backend not connected" description={error} onRetry={retry} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title="No routes found" description="Try different filter keywords." icon="🛣️" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((route) => (
          <RouteCard key={route.id} route={route} onViewDetails={setSelectedRoute} />
        ))}
      </div>

      <Modal title="Route Details" isOpen={Boolean(selectedRoute)} onClose={() => setSelectedRoute(null)}>
        {selectedRoute ? (
          <div className="space-y-3 text-sm">
            <p><span className="text-slate-400">Route Name:</span> {selectedRoute.route_name}</p>
            <p><span className="text-slate-400">Stops:</span> {selectedRoute.coordinates?.length || 0}</p>
            <p className="text-slate-300">Coordinates are available and ready for map rendering.</p>
          </div>
        ) : null}
      </Modal>
      </section>
    </PageMotion>
  );
}
