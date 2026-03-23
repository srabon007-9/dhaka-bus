// Bus List Component - Displays list of buses with their current status and location

function BusList({ buses, selectedBus, onSelectBus, getBusLocation }) {
  if (!buses || buses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8 text-center">
        <p className="text-gray-500 text-lg">📭 No buses found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-green-500">
      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
        <h2 className="text-xl font-bold text-gray-900">
          🚌 Buses ({buses.length})
        </h2>
      </div>

      {/* Bus list - scrollable */}
      <div className="max-h-96 overflow-y-auto">
        {buses.map((bus) => {
          const location = getBusLocation(bus.id);
          const isSelected = selectedBus?.id === bus.id;

          return (
            <div
              key={bus.id}
              onClick={() => onSelectBus(bus)}
              className={`p-4 border-b cursor-pointer transition-all hover:bg-blue-50 ${
                isSelected
                  ? 'bg-blue-100 border-l-4 border-l-blue-600 shadow-md'
                  : 'border-l-4 border-l-transparent'
              }`}
            >
              {/* Bus Name and Number */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-700 text-lg">
                  {bus.name}
                </span>
                {location && (
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
                )}
              </div>

              {/* Route Information */}
              <div className="text-sm mb-2">
                <p className="font-semibold text-gray-800">{bus.route_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  📍 {bus.start_point} → {bus.end_point}
                </p>
              </div>

              {/* Location Status */}
              {location ? (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                  <p>Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}</p>
                  <p className="mt-1">🕐 {new Date(location.timestamp).toLocaleTimeString()}</p>
                </div>
              ) : (
                <p className="text-xs text-red-500 mt-2">⚠️ No location data</p>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-3 text-blue-600 text-sm font-semibold bg-blue-50 p-2 rounded">
                  ✓ Selected on map
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with count */}
      <div className="bg-gray-50 p-3 text-center text-sm text-gray-600 border-t">
        Showing {buses.length} bus{buses.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
}

export default BusList;
