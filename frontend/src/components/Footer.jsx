import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Platform',
    links: [
      { label: 'Book tickets', href: '/booking' },
      { label: 'Track buses', href: '/tracking' },
      { label: 'Browse routes', href: '/routes' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/auth' },
      { label: 'My tickets', href: '/tickets' },
    ],
  },
  {
    title: 'System',
    links: [
      { label: 'Admin', href: '/admin' },
      { label: 'Home', href: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-cyan-400/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="eyebrow">Dhaka Bus</p>
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-100">
            Built for real city riders, not demo screens.
          </h2>
          <p className="max-w-md text-sm leading-7 text-slate-400">
            Plan trips, track buses, and manage verified-ticket journeys with a calmer, more reliable experience.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              {section.title}
            </p>
            <div className="mt-4 space-y-3">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block text-sm font-medium text-slate-300 transition-colors hover:text-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Dhaka Bus. Verified rider accounts and segment-based ticketing enabled.
      </div>
    </footer>
  );
}
