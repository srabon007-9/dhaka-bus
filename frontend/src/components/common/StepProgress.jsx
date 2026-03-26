export default function StepProgress({ steps, currentStep }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isDone = index < currentStep;

        return (
          <div
            key={step}
            className={[
              'rounded-[24px] border p-4 transition-all duration-200',
              isDone
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                : isCurrent
                  ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-[0_16px_34px_rgba(34,211,238,0.08)]'
                  : 'border-white/10 bg-white/5 text-slate-400',
            ].join(' ')}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em]">
              Step {index + 1}
            </p>
            <p className="mt-2 text-sm font-semibold">{step}</p>
          </div>
        );
      })}
    </div>
  );
}
