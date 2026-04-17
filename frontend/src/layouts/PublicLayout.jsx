import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div className="app-shell min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
