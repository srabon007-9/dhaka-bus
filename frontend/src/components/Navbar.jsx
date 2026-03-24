import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useState } from 'react';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/routes', label: 'Routes' },
  { to: '/tracking', label: 'Tracking' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    ...publicLinks,
    ...(isAuthenticated ? [{ to: '/booking', label: 'Booking' }, { to: '/tickets', label: 'Tickets' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink 
            to="/" 
            onClick={closeMobileMenu}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-sky-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <div className="relative bg-slate-950 px-3 py-2 rounded-lg">
                <span className="text-xl font-black bg-linear-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">🚌</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Dhaka Bus</p>
              <p className="text-xs text-cyan-400 font-medium">Tracking System</p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                    {user?.role === 'admin' && (
                      <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Admin</p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-400">{user?.name?.[0]?.toUpperCase()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-medium text-sm transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-linear-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  }`
                }
              >
                Sign In
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Mobile Auth */}
            <div className="pt-2 border-t border-white/5 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                    <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                    {user?.role === 'admin' && (
                      <p className="text-xs text-amber-400 font-bold uppercase tracking-wide mt-1">Admin</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/auth"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 rounded-lg bg-linear-to-r from-cyan-500 to-sky-500 text-slate-950 font-semibold text-sm text-center"
                >
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
