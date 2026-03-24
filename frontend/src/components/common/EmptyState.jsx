export default function EmptyState({ title, description, icon = '🗂️' }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}
