import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useState } from 'react';
import PageMotion from '../components/common/PageMotion';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const features = [
  {
    icon: '📍',
    title: 'Real-Time Tracking',
    description: 'See live bus locations on an interactive map. Know exactly where your bus is at any moment.',
  },
  {
    icon: '🎫',
    title: 'Smart Booking',
    description: 'Intuitive 4-step booking flow. Select seats, check availability, and book instantly.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Optimized for speed. Get results in milliseconds, not seconds.',
  },
  {
    icon: '🛡️',
    title: 'Secure & Safe',
    description: 'JWT authentication, encrypted passwords, and role-based access control.',
  },
  {
    icon: '📱',
    title: 'Mobile Friendly',
    description: 'Perfect experience on desktop, tablet, and mobile devices.',
  },
  {
    icon: '🌍',
    title: 'Always Available',
    description: '24/7 access. Track buses and book tickets anytime, anywhere.',
  },
];

export default function HomePage() {
  const [query, setQuery] = useState('');

  return (
    <PageMotion>
      <div className="space-y-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
          {/* Gradient Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-sky-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
          </div>

          <div className="relative">
            {/* Main Headline */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                <span className="bg-linear-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
                  Move Smarter
                </span>
                <br />
                <span className="text-slate-100">Across Dhaka</span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-12">
              Real-time bus tracking meets intelligent booking. See where buses are right now, book your seat instantly, and experience transportation reimagined.
            </p>

            {/* Search Bar */}
            <div className="mb-12 max-w-md">
              <SearchBar placeholder="Search route, bus, or destination..." onSearch={setQuery} />
              {query && (
                <p className="mt-3 text-sm text-slate-400">
                  Searching for: <span className="text-cyan-400 font-semibold">{query}</span>
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/tracking" className="inline-block">
                <Button size="lg">
                  <span>📍</span>
                  Track Bus Live
                </Button>
              </Link>
              <Link to="/booking" className="inline-block">
                <Button size="lg" variant="secondary">
                  <span>🎫</span>
                  Book Ticket Now
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-16 grid grid-cols-3 gap-6 md:gap-12">
              {[
                { label: 'Active Buses', value: '42' },
                { label: 'Daily Routes', value: '156' },
                { label: 'Happy Users', value: '10K+' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-cyan-400">{stat.value}</p>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12">
          <div className="mb-12">
            <p className="text-sm text-cyan-400 font-semibold uppercase tracking-widest mb-3">Why Choose Us</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100">
              Built for modern commuters
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-cyan-300 transition">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 to-sky-500/10" />
          <div className="relative z-10 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
              Ready to experience the future?
            </h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of users who already use Dhaka Bus Service for faster, smarter commuting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tracking">
                <Button size="lg">Get Started</Button>
              </Link>
              <button type="button" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                Learn more →
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageMotion>
  );
}
