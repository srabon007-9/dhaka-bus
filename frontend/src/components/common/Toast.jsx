const tone = {
  success: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100',
  error: 'border-red-400/40 bg-red-500/20 text-red-100',
  info: 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100',
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto min-w-72 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${tone[toast.type] || tone.info}`}>
          <div className="flex items-start justify-between gap-4">
            <p>{toast.message}</p>
            <button type="button" onClick={() => removeToast(toast.id)} className="text-xs opacity-80 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
