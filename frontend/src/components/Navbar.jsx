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

const desktopLinkClassName = ({ isActive }) => [
  'group relative inline-flex items-center rounded-lg border px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium tracking-[0.01em] transition-all duration-200',
  isActive
    ? 'border-cyan-300/60 bg-cyan-300/18 text-white'
    : 'border-white/14 bg-white/8 text-white hover:border-white/30 hover:bg-white/14',
].join(' ');

const mobileLinkClassName = ({ isActive }) => [
  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
  isActive
    ? 'bg-white/12 text-white'
    : 'text-white hover:bg-white/8 hover:text-white',
].join(' ');

function UserMenu({ user, userInitial, userMenuOpen, onToggle, onClose, onLogout }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/12 bg-white/6 px-1.5 sm:px-2 py-1.5 text-left transition-colors hover:border-white/24 hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
      >
        <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-cyan-300/18 text-xs font-semibold text-cyan-100 flex-shrink-0">
          {userInitial}
        </span>
        <span className="hidden xs:inline max-w-24 sm:max-w-35 truncate text-xs sm:text-sm font-medium text-slate-100">{user?.name}</span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {userMenuOpen ? (
        <div className="absolute right-0 sm:right-2 top-[calc(100%+0.55rem)] min-w-48 sm:min-w-50 rounded-xl border border-white/12 bg-slate-900/96 p-1.5 shadow-[0_16px_38px_rgba(2,6,23,0.42)] backdrop-blur z-50">
          <div className="rounded-lg px-3 py-2">
            <p className="truncate text-xs sm:text-sm font-semibold text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Verified rider'}</p>
          </div>
          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            className="w-full cursor-default rounded-lg px-3 py-2 text-left text-sm text-slate-400"
            aria-disabled="true"
          >
            Profile
          </button>
          <button
            type="button"
            className="w-full cursor-default rounded-lg px-3 py-2 text-left text-sm text-slate-400"
            aria-disabled="true"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-200 transition-colors hover:bg-rose-400/14"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = [
    ...publicLinks,
    ...(isAuthenticated ? privateLinks : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const userInitial = String(user?.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 sm:h-15 max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-1.5 sm:gap-2 rounded-md px-1 sm:px-1.5 py-1 transition-opacity hover:opacity-95 flex-shrink-0"
        >
          <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-md bg-cyan-300/16 text-xs font-semibold text-cyan-100">
            DB
          </div>
          <p className="hidden xs:inline text-xs sm:text-sm font-semibold tracking-[0.01em] text-white whitespace-nowrap">
            Dhaka Bus
          </p>
        </NavLink>

        <nav className="mx-auto hidden items-center gap-2 sm:gap-3 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClassName}>
              {({ isActive }) => (
                <span className="relative text-white">
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-0.5 w-full origin-left rounded-full bg-cyan-300 transition-transform duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <UserMenu
              user={user}
              userInitial={userInitial}
              userMenuOpen={userMenuOpen}
              onToggle={() => setUserMenuOpen((value) => !value)}
              onClose={closeMenu}
              onLogout={logout}
            />
          ) : (
            <NavLink to="/auth" className="rounded-full border border-cyan-300/35 bg-cyan-300/12 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:border-cyan-300/55 hover:bg-cyan-300/22 whitespace-nowrap">
              Sign In
            </NavLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="ml-auto inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-white md:hidden transition-colors hover:bg-white/10"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
        >
          <span className="text-base leading-none">{mobileMenuOpen ? '×' : '☰'}</span>
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/96 px-3 sm:px-6 py-3 sm:py-4 md:hidden sm:px-6 text-white animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-xl border border-white/10 bg-white/3 p-2 text-white">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu} className={mobileLinkClassName}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 sm:mt-4 border-t border-white/10 pt-3 sm:pt-4">
            {isAuthenticated ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/12 bg-white/5 px-2 sm:px-3 py-2 sm:py-2.5">
                  <span className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full bg-cyan-300/18 text-xs font-semibold text-cyan-100 flex-shrink-0">
                    {userInitial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Verified rider'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <NavLink to="/auth" onClick={closeMenu} className="block rounded-xl border border-cyan-300/30 bg-cyan-300/12 px-3 py-2 sm:py-2.5 text-center text-xs sm:text-sm font-medium text-white transition-colors hover:border-cyan-300/55 hover:bg-cyan-300/20">
                Sign In or Create Account
              </NavLink>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
