export default function ErrorCard({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-400/40 bg-red-900/20 p-6 text-left shadow-lg">
      <p className="text-lg font-semibold text-red-200">{title}</p>
      <p className="mt-2 text-sm text-red-100/90">{description || 'Please try again.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">
          Retry
        </button>
      ) : null}
    </div>
  );
}
