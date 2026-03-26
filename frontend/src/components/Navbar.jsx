import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

const publicLinks = [
  { to: '/', label: 'Overview' },
  { to: '/routes', label: 'Routes' },
  { to: '/tracking', label: 'Live Tracking' },
];

const privateLinks = [
  { to: '/booking', label: 'Book Tickets' },
  { to: '/tickets', label: 'My Tickets' },
];

const linkClassName = ({ isActive }) => [
  'rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200',
  isActive
    ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.18)]'
    : 'border-cyan-400/35 bg-cyan-400/18 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/26 hover:text-white',
].join(' ');

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    ...publicLinks,
    ...(isAuthenticated ? privateLinks : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" onClick={closeMenu} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950 shadow-[0_18px_35px_rgba(34,211,238,0.18)]">
            B
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-300">Dhaka Bus</p>
            <p className="text-sm font-semibold text-white">Transit + ticketing</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-3 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClassName}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right shadow-sm">
                <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-400">
                  {user?.role === 'admin' ? 'Administrator' : 'Verified rider'}
                </p>
              </div>
              <button type="button" onClick={logout} className="btn-secondary">
                Log Out
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="btn-primary">
              Sign In
            </NavLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 lg:hidden"
          aria-label="Toggle navigation"
        >
          <span className="text-lg">{mobileMenuOpen ? '×' : '≡'}</span>
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 lg:hidden sm:px-6">
          <div className="space-y-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu} className={linkClassName}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="btn-secondary w-full"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <NavLink to="/auth" onClick={closeMenu} className="btn-primary w-full">
                Sign In or Create Account
              </NavLink>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
