import SearchBar from './SearchBar';

function BusSearch({ onSearch }) {
  return <SearchBar placeholder="Search by bus name, route, or location..." onSearch={onSearch} />;
}

export default BusSearch;
