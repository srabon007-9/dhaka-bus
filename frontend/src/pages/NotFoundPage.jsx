import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-slate-300">The page you requested does not exist.</p>
      <Link to="/" className="mt-5 inline-block rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-900">
        Go Home
      </Link>
    </div>
  );
}
