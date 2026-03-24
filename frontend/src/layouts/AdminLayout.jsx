import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const sections = ['Buses', 'Routes', 'Trips'];

export default function AdminLayout({ children }) {
  const [active, setActive] = useState('Buses');

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar sections={sections} active={active} onSelect={setActive} />
      <div>{children(active)}</div>
    </div>
  );
}
