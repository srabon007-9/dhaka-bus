// Bus Search Component - Allows users to search for buses by name, route, or location

import { useState } from 'react';

function BusSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle search input change
  const handleChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term); // Call parent's search function
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border-t-4 border-blue-500">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🔍</span> Search Buses
      </h2>

      <div className="relative">
        <input
          type="text"
          placeholder="Search by bus name, route, or location..."
          value={searchTerm}
          onChange={handleChange}
          className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
        />

        {/* Clear button - only show if there's search text */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 text-gray-400 hover:text-red-500 text-2xl transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search tips */}
      <div className="mt-5 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-400">
        <p className="font-bold text-gray-900 mb-2">💡 Tip:</p>
        <ul className="space-y-1 text-gray-600">
          <li>Search by bus number (e.g., "25A")</li>
          <li>Search by route name (e.g., "Gulshan")</li>
          <li>Search by start/end point</li>
        </ul>
      </div>
    </div>
  );
}

export default BusSearch;
