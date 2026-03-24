import { useEffect, useState } from 'react';

export default function SearchBar({ placeholder = 'Search...', onSearch }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch?.(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/40"
      />
    </div>
  );
}
