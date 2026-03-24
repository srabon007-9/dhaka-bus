import BusCard from './BusCard';
import EmptyState from './common/EmptyState';

function BusList({ buses, onSelectBus, getBusLocation }) {
  if (!buses || buses.length === 0) {
    return <EmptyState title="No buses found" description="Try another search term." icon="🚌" />;
  }

  return (
    <div className="space-y-3">
      {buses.map((bus) => (
        <BusCard key={bus.id} bus={bus} location={getBusLocation(bus.id)} onSelect={onSelectBus} />
      ))}
    </div>
  );
}

export default BusList;
