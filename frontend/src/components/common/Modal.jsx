import { useEffect, useRef } from 'react';

export default function Modal({ title, isOpen, onClose, children, actions, align = 'center', size = 'default' }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const isTopAligned = align === 'top';
  const sizeClass = size === 'wide' ? 'max-w-4xl' : 'max-w-xl';

  return (
    <div className={`fixed inset-0 z-50 flex justify-center bg-black/60 p-3 backdrop-blur-sm overflow-y-auto sm:p-4 ${isTopAligned ? 'items-start pt-6 sm:pt-8' : 'items-center'}`}>
      <div className={`w-full ${sizeClass} rounded-2xl border border-white/20 bg-slate-900/90 shadow-2xl flex flex-col max-h-[90vh] ${isTopAligned ? 'my-0' : 'my-auto'}`}>
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur mb-0 flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
          <h3 className="pr-2 text-base font-semibold leading-tight text-white sm:text-xl">{title}</h3>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:bg-white/20 sm:text-sm">
            Close
          </button>
        </div>
        <div ref={bodyRef} className="overflow-y-auto flex-1 px-4 py-5 text-slate-200 sm:px-6 sm:py-6">
          {children}
        </div>
        {actions ? <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur mt-6 px-6 py-4 sm:px-6 border-t border-white/10 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
