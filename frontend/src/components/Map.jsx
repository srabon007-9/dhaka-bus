import MapView from './MapView';

function Map({ buses = [], routes = [], selectedBus, getBusLocation = () => null }) {
  const busLocations = new Map();
  buses.forEach((bus) => {
    const location = getBusLocation(bus.id);
    if (location) {
      busLocations.set(bus.id, location);
    }
  });

  return <MapView routes={routes} buses={buses} busLocations={busLocations} selectedBus={selectedBus} />;
}

export default Map;
