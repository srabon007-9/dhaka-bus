export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`
        relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
        p-6 transition-all duration-300
        ${hover ? 'hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-105' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
