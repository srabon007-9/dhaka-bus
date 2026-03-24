export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950';
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const variants = {
    primary: 'bg-linear-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    secondary: 'bg-white/10 text-slate-200 border border-white/20 hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'border-2 border-cyan-500/40 text-cyan-300 hover:border-cyan-500/70 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-slate-300 hover:text-slate-100 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
