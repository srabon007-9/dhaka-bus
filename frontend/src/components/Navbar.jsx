import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContextValue';

const publicLinks = [
  { to: '/', label: 'Overview' },
  { to: '/routes', label: 'Routes' },
  { to: '/tracking', label: 'Live Tracking' },
];

const desktopLinkClassName = ({ isActive }) => [
  'group relative inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold tracking-wide transition-all duration-300',
  isActive
    ? 'bg-white/10 !text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] ring-1 ring-white/20'
    : '!text-white hover:bg-white/10',
].join(' ');

const mobileLinkClassName = ({ isActive }) => [
  'block rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ease-out',
  isActive
    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 !text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-cyan-500/30'
    : '!text-white hover:bg-white/10',
].join(' ');

function UserMenu({ user, userInitial, userMenuOpen, onToggle, onClose, onLogout }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="group flex items-center gap-2 rounded-full bg-slate-800/50 p-1.5 pr-3 shadow-sm ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:ring-white/20"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white shadow-inner">
          {userInitial}
        </span>
        <span className="hidden sm:block max-w-[100px] truncate text-sm font-semibold text-slate-200">
          {user?.name}
        </span>
        <span className="text-xs text-slate-400 transition-colors group-hover:text-white">▼</span>
      </button>

      {userMenuOpen ? (
        <div className="absolute right-0 top-12 w-56 rounded-2xl bg-slate-900/95 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl z-[10000] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-cyan-400 font-medium mt-0.5">{user?.role === 'admin' ? 'Administrator' : 'Verified Rider'}</p>
          </div>
          <div className="my-1 h-px bg-white/10" />
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            Profile
          </button>
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            Settings
          </button>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors mt-1"
          >
            Sign out
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        // Close menus when hiding
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const privateLinks = [
    { to: '/booking', label: 'Book Tickets' },
    { to: '/tickets', label: user?.role === 'admin' ? 'All Tickets' : 'My Tickets' },
  ];

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
    <header className={`sticky top-0 z-[9999] w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/60 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <NavLink
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <span className="text-sm font-black text-white tracking-wider">DB</span>
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              DHAKA BUS
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90 -mt-1">
              Transit Platform
            </p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 rounded-full bg-slate-900/50 p-1.5 ring-1 ring-white/10 shadow-inner">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClassName}>
              {({ isActive }) => (
                <span className="relative z-10">
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-4">
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
            <NavLink 
              to="/auth" 
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] ring-1 ring-white/20"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
            </NavLink>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/50 text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300 absolute w-full shadow-2xl">
          <div className="p-4 space-y-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu} className={mobileLinkClassName}>
                {link.label}
              </NavLink>
            ))}
            
            <div className="my-4 h-px bg-white/10" />
            
            {isAuthenticated ? (
              <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl ring-1 ring-white/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white shadow-inner">
                    {userInitial}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{user?.name}</p>
                    <p className="text-xs font-medium text-cyan-400">{user?.role === 'admin' ? 'Administrator' : 'Verified Rider'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10 transition-colors hover:bg-rose-500/20 hover:text-rose-300 hover:ring-rose-500/30"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <NavLink 
                to="/auth" 
                onClick={closeMenu} 
                className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg ring-1 ring-white/20 transition-all hover:brightness-110"
              >
                Sign In / Create Account
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
