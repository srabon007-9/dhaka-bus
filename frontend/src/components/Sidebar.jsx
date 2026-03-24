export default function Sidebar({ sections, active, onSelect }) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Admin Menu</p>
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${active === section ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            {section}
          </button>
        ))}
      </div>
    </aside>
  );
}
