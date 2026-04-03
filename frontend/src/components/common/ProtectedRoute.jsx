import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContextValue';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const { isAuthenticated, user, initializing } = useAuthContext();

  if (initializing) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-300 shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
