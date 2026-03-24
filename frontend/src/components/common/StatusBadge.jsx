const variants = {
  moving: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  stopped: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  delayed: 'bg-red-500/20 text-red-300 border-red-400/30',
};

export default function StatusBadge({ status = 'moving' }) {
  const safeStatus = variants[status] ? status : 'moving';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${variants[safeStatus]}`}>
      {safeStatus}
    </span>
  );
}
