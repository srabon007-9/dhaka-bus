import { useMemo, useState } from 'react';
import BusCard from '../components/BusCard';
import FloatingPanel from '../components/FloatingPanel';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import ErrorCard from '../components/common/ErrorCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import useLiveTracking from '../hooks/useLiveTracking';
import PageMotion from '../components/common/PageMotion';

export default function TrackingPage() {
  const { buses, routes, busLocations, loading, error, retry } = useLiveTracking();
  const [query, setQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);

  const visibleBuses = useMemo(() => {
    if (!query.trim()) return buses;
    const q = query.toLowerCase();
    return buses.filter((bus) => `${bus.name} ${bus.route_name} ${bus.start_point} ${bus.end_point}`.toLowerCase().includes(q));
  }, [buses, query]);

  return (
    <PageMotion>
      <section className="space-y-5">
      <div className="relative">
        <MapView routes={routes} buses={visibleBuses} busLocations={busLocations} selectedBus={selectedBus} />
        <FloatingPanel>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Control Center</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Bus Tracking</h2>
          <p className="mt-1 text-xs text-slate-300">Search buses and tap any card to highlight.</p>
          <div className="mt-3">
            <SearchBar placeholder="Search bus or route" onSearch={setQuery} />
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
            {loading ? <LoadingSkeleton rows={3} /> : null}
            {error ? <ErrorCard title="Backend not connected" description={error} onRetry={retry} /> : null}
            {!loading && !error
              ? visibleBuses.map((bus) => (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    location={busLocations.get(bus.id)}
                    onSelect={setSelectedBus}
                  />
                ))
              : null}
          </div>
        </FloatingPanel>
      </div>
      </section>
    </PageMotion>
  );
}
