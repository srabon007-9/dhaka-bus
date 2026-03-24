import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
