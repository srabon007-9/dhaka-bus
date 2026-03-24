import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busIcon = new L.DivIcon({
  className: '',
  html: '<div style="font-size:20px;filter:drop-shadow(0 0 8px rgba(34,211,238,.6));">🚌</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapView({ routes = [], buses = [], busLocations = new Map(), selectedBus }) {
  return (
    <MapContainer center={[23.8103, 90.4125]} zoom={12} className="h-[72vh] w-full rounded-2xl border border-white/10">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates || []}
          pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.7 }}
        />
      ))}

      {buses.map((bus) => {
        const loc = busLocations.get(bus.id);
        if (!loc) return null;
        const highlighted = selectedBus?.id === bus.id;

        return (
          <Marker key={bus.id} position={[loc.latitude, loc.longitude]} icon={busIcon}>
            <Popup>
              <div className="min-w-40">
                <p className="font-semibold">{bus.name}</p>
                <p className="text-xs">{bus.route_name}</p>
                <p className="text-xs">ETA: {8 + (bus.id % 6)} min</p>
                {highlighted ? <p className="text-xs font-semibold text-cyan-600">Selected bus</p> : null}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
