export default function FloatingPanel({ children }) {
  return (
    <div className="absolute left-4 top-4 z-40 w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/75 p-4 shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}
