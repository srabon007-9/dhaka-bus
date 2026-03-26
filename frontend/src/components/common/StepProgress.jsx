export default function StepProgress({ steps, currentStep }) {
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isDone = index < currentStep;

          return (
            <div
              key={step}
              className={[
                'rounded-[24px] border p-4 transition-all duration-300 relative',
                isDone
                  ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100'
                  : isCurrent
                    ? 'border-cyan-300/40 bg-cyan-400/12 text-cyan-100 shadow-[0_16px_38px_rgba(34,211,238,0.12)] scale-105'
                    : 'border-white/10 bg-white/5 text-slate-400',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-emerald-400/30 text-emerald-200' : 
                  isCurrent ? 'bg-cyan-400/30 text-cyan-200' : 'bg-white/10 text-slate-400'
                }`}>
                  {isDone ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-75">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{step}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
