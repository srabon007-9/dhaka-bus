import { useMemo, useState } from 'react';
import BusCard from '../components/BusCard';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import ErrorCard from '../components/common/ErrorCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import useLiveTracking from '../hooks/useLiveTracking';

// Fixed 32-stop route for Dhaka bus system (REAL COORDINATES)
const FIXED_BUS_STOPS = [
  { stop_order: 1, latitude: 23.98938655966166, longitude: 90.3818798546475, stop_name: 'Terminal 1' },
  { stop_order: 2, latitude: 23.95066483463887, longitude: 90.38128847282798, stop_name: 'Stop 2' },
  { stop_order: 3, latitude: 23.92426241836554, longitude: 90.39112019838798, stop_name: 'Stop 3' },
  { stop_order: 4, latitude: 23.90820665012597, longitude: 90.39822728488, stop_name: 'Stop 4' },
  { stop_order: 5, latitude: 23.864369592788783, longitude: 90.39991948098188, stop_name: 'Stop 5' },
  { stop_order: 6, latitude: 23.851748796789437, longitude: 90.40728472294688, stop_name: 'Stop 6' },
  { stop_order: 7, latitude: 23.83589168842585, longitude: 90.41861363348757, stop_name: 'Stop 7' },
  { stop_order: 8, latitude: 23.818249680766108, longitude: 90.42092309823894, stop_name: 'Stop 8' },
  { stop_order: 9, latitude: 23.81192698337956, longitude: 90.42121609002466, stop_name: 'Stop 9' },
  { stop_order: 10, latitude: 23.794739043257984, longitude: 90.4240081294756, stop_name: 'Stop 10' },
  { stop_order: 11, latitude: 23.789282579209125, longitude: 90.42500774852233, stop_name: 'Stop 11' },
  { stop_order: 12, latitude: 23.777722319677522, longitude: 90.42573161058294, stop_name: 'Stop 12' },
  { stop_order: 13, latitude: 23.773085310035285, longitude: 90.42554202767337, stop_name: 'Stop 13' },
  { stop_order: 14, latitude: 23.76519885974831, longitude: 90.42145737738797, stop_name: 'Stop 14' },
  { stop_order: 15, latitude: 23.750197512102233, longitude: 90.4127710324625, stop_name: 'Stop 15' },
  { stop_order: 16, latitude: 23.749850457252247, longitude: 90.41270209317548, stop_name: 'Stop 16' },
  { stop_order: 17, latitude: 23.744123919663114, longitude: 90.41409811295101, stop_name: 'Stop 17' },
  { stop_order: 18, latitude: 23.73771873369362, longitude: 90.40897937401242, stop_name: 'Stop 18' },
  { stop_order: 19, latitude: 23.737387422434946, longitude: 90.40449832303187, stop_name: 'Stop 19' },
  { stop_order: 20, latitude: 23.733774496995064, longitude: 90.40332635593779, stop_name: 'Stop 20' },
  { stop_order: 21, latitude: 23.734831564125905, longitude: 90.40063772532112, stop_name: 'Stop 21' },
  { stop_order: 22, latitude: 23.738097374090664, longitude: 90.39607050031522, stop_name: 'Stop 22' },
  { stop_order: 23, latitude: 23.739059746959317, longitude: 90.38888358406334, stop_name: 'Stop 23' },
  { stop_order: 24, latitude: 23.738933534555322, longitude: 90.38381654956305, stop_name: 'Stop 24' },
  { stop_order: 25, latitude: 23.73844446026129, longitude: 90.37614705845282, stop_name: 'Stop 25' },
  { stop_order: 26, latitude: 23.74292494336979, longitude: 90.37354460205859, stop_name: 'Stop 26' },
  { stop_order: 27, latitude: 23.750907393968806, longitude: 90.36806393204725, stop_name: 'Stop 27' },
  { stop_order: 28, latitude: 23.75698066988753, longitude: 90.361669817067, stop_name: 'Stop 28' },
  { stop_order: 29, latitude: 23.756060030171625, longitude: 90.35658597754784, stop_name: 'Stop 29' },
  { stop_order: 30, latitude: 23.76502959113601, longitude: 90.3472719928998, stop_name: 'Stop 30' },
  { stop_order: 31, latitude: 23.772629269726483, longitude: 90.34450398148928, stop_name: 'Stop 31' },
  { stop_order: 32, latitude: 23.782693025392796, longitude: 90.3393420140131, stop_name: 'Terminal 2' },
];

export default function TrackingPage() {
  const { buses, routes, busLocations, loading, error, retry } = useLiveTracking();
  const [query, setQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);

  const visibleBuses = useMemo(() => {
    if (!query.trim()) return buses;
    const q = query.toLowerCase();
    return buses.filter((bus) => `${bus.name} ${bus.route_name || ''} ${bus.start_point || ''} ${bus.end_point || ''}`.toLowerCase().includes(q));
  }, [buses, query]);

  return (
    <section className="space-y-5">
      <div>
        <MapView routes={routes} buses={visibleBuses} busLocations={busLocations} selectedBus={selectedBus} stops={FIXED_BUS_STOPS} />

        <div className="mt-4 w-full rounded-2xl border border-white/20 bg-slate-950/95 p-4 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Control Center</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Bus Tracking</h2>
          <p className="mt-1 text-xs text-slate-300">Search buses and tap any card to highlight.</p>
          <div className="mt-3">
            <SearchBar placeholder="Search bus or route" onSearch={setQuery} />
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
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
        </div>
      </div>
    </section>
  );
}
