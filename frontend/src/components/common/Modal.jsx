export default function Modal({ title, isOpen, onClose, children, actions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-slate-900/90 shadow-2xl flex flex-col max-h-[90vh] my-auto">
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur mb-0 flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate-200 hover:bg-white/20 transition-colors flex-shrink-0">
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-6 sm:px-6 text-slate-200">
          {children}
        </div>
        {actions ? <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur mt-6 px-6 py-4 sm:px-6 border-t border-white/10 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
