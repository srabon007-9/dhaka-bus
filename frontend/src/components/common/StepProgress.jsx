export default function StepProgress({ steps, currentStep }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div key={step} className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide ${isDone ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100' : isCurrent ? 'border-cyan-300/50 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-300'}`}>
            {idx + 1}. {step}
          </div>
        );
      })}
    </div>
  );
}
