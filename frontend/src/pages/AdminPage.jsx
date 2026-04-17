import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import DataTable from '../components/admin/DataTable';
import Modal from '../components/common/Modal';
import PaymentVerificationPanel from '../components/admin/PaymentVerificationPanel';
import PassengerFlowPanel from '../components/admin/PassengerFlowPanel';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import useLiveTracking from '../hooks/useLiveTracking';
import { busApi, routeApi, tripApi } from '../services/api';
import useToast from '../hooks/useToast';
import Toast from '../components/common/Toast';
import { useAuthContext } from '../contexts/AuthContextValue';
import PageMotion from '../components/common/PageMotion';

const formatDateTime = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminPage() {
  const { token } = useAuthContext();
  const { buses, routes, retry } = useLiveTracking({ includeIncompleteRoutes: true });
  const [trips, setTrips] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState('bus');
  const [form, setForm] = useState({
    name: '',
    route_name: '',
    start_point: '',
    end_point: '',
    route_id: '',
    capacity: '40',
    status: 'active',
    bus_id: '',
    departure_time: '',
    arrival_time: '',
    fare: '',
    total_seats: '40',
  });
  const toast = useToast();
  const busOverview = useMemo(() => ({
    busesWithTrips: buses.filter((bus) => bus.next_trip_id).length,
    totalAvailableSeats: buses.reduce((sum, bus) => sum + Number(bus.available_seats || 0), 0),
    totalBookedSeats: buses.reduce((sum, bus) => sum + Number(bus.booked_seats || 0), 0),
    totalOnboardPassengers: buses.reduce((sum, bus) => sum + Number(bus.onboard_passengers || 0), 0),
  }), [buses]);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await tripApi.list();
      setTrips(data);
    } catch {
      toast.error('Could not load trips.');
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchTrips]);

  const openModal = (type) => {
    setEditingId(null);
    setFormType(type);
    setForm({
      name: '',
      route_name: '',
      start_point: '',
      end_point: '',
      route_id: '',
      capacity: '40',
      status: 'active',
      bus_id: '',
      departure_time: '',
      arrival_time: '',
      fare: '',
      total_seats: '40',
    });
    setIsOpen(true);
  };

  const openEditModal = (type, row) => {
    setEditingId(row.id);
    setFormType(type);

    if (type === 'bus') {
      setForm((prev) => ({
        ...prev,
        name: row.name || '',
        route_id: row.route_id ? String(row.route_id) : '',
        capacity: row.capacity ? String(row.capacity) : '40',
        status: row.status || 'active',
      }));
    } else if (type === 'route') {
      setForm((prev) => ({
        ...prev,
        route_name: row.route_name || '',
        start_point: row.start_point || '',
        end_point: row.end_point || '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        route_id: row.route_id ? String(row.route_id) : '',
        bus_id: row.bus_id ? String(row.bus_id) : '',
        departure_time: row.departure_time ? row.departure_time.slice(0, 16) : '',
        arrival_time: row.arrival_time ? row.arrival_time.slice(0, 16) : '',
        fare: row.fare ?? '',
        total_seats: row.total_seats ?? '40',
      }));
    }

    setIsOpen(true);
  };

  const submitForm = async () => {
    try {
      // Validation layer
      if (formType === 'bus') {
        if (!form.name?.trim()) {
          toast.error('Bus name is required');
          return;
        }
        if (!form.route_id) {
          toast.error('Route is required');
          return;
        }
        if (Number(form.capacity) < 1 || Number(form.capacity) > 100) {
          toast.error('Capacity must be between 1 and 100');
          return;
        }

        const payload = {
          name: form.name,
          route_id: Number(form.route_id),
          capacity: Number(form.capacity || 40),
          status: form.status || 'active',
        };

        if (editingId) {
          await busApi.update(editingId, payload, token);
          toast.success('Bus updated.');
        } else {
          await busApi.create(payload, token);
          toast.success('Bus added.');
        }
      } else if (formType === 'route') {
        if (!form.route_name?.trim()) {
          toast.error('Route name is required');
          return;
        }
        if (!form.start_point?.trim()) {
          toast.error('Start point is required');
          return;
        }
        if (!form.end_point?.trim()) {
          toast.error('End point is required');
          return;
        }
        if (form.start_point.trim() === form.end_point.trim()) {
          toast.error('Start and end points must be different');
          return;
        }

        if (editingId) {
          await routeApi.update(
            editingId,
            {
              route_name: form.route_name,
              start_point: form.start_point,
              end_point: form.end_point,
            },
            token
          );
          toast.success('Route updated.');
        } else {
          await routeApi.create({
            route_name: form.route_name,
            start_point: form.start_point,
            end_point: form.end_point,
          }, token);
          toast.success('Route added.');
        }
      } else {
        // Trip form validation
        if (!form.route_id) {
          toast.error('Route is required');
          return;
        }
        if (!form.bus_id) {
          toast.error('Bus is required');
          return;
        }
        if (!form.departure_time) {
          toast.error('Departure time is required');
          return;
        }
        if (!form.arrival_time) {
          toast.error('Arrival time is required');
          return;
        }
        if (new Date(form.departure_time) >= new Date(form.arrival_time)) {
          toast.error('Arrival time must be after departure time');
          return;
        }
        if (Number(form.fare) < 0) {
          toast.error('Fare cannot be negative');
          return;
        }
        if (Number(form.total_seats) < 1 || Number(form.total_seats) > 100) {
          toast.error('Total seats must be between 1 and 100');
          return;
        }

        const payload = {
          route_id: Number(form.route_id),
          bus_id: Number(form.bus_id),
          departure_time: form.departure_time,
          arrival_time: form.arrival_time,
          fare: Number(form.fare || 0),
          total_seats: Number(form.total_seats || 40),
        };

        if (editingId) {
          await tripApi.update(editingId, payload, token);
          toast.success('Trip updated.');
        } else {
          await tripApi.create(payload, token);
          toast.success('Trip added.');
        }
      }
      setIsOpen(false);
      retry();
      fetchTrips();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not save changes. Please check your connection and try again.');
    }
  };

  const removeRecord = async (row, type) => {
    try {
      if (type === 'bus') {
        await busApi.remove(row.id, token);
        toast.success('Bus deleted.');
      } else if (type === 'route') {
        await routeApi.remove(row.id, token);
        toast.success('Route deleted.');
      } else {
        await tripApi.remove(row.id, token);
        toast.success('Trip deleted.');
      }
      retry();
      fetchTrips();
    } catch {
      toast.error('Could not delete this item.');
    }
  };

  const renderPanel = (active) => {
    if (active === 'Analytics') {
      return <AnalyticsDashboard trips={trips} buses={buses} routes={routes} />;
    }

    if (active === 'Buses') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Buses</h2>
            <button type="button" onClick={() => openModal('bus')} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Add Bus
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Buses With Trips" value={busOverview.busesWithTrips} />
            <AdminStatCard label="Available Seats" value={busOverview.totalAvailableSeats} />
            <AdminStatCard label="Booked Seats" value={busOverview.totalBookedSeats} />
            <AdminStatCard label="Passengers Onboard" value={busOverview.totalOnboardPassengers} />
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Bus Name' },
              { key: 'route_name', label: 'Route' },
              { key: 'capacity', label: 'Bus Seats' },
              { key: 'next_departure_time', label: 'Next Trip', render: (value) => formatDateTime(value) },
              {
                key: 'available_seats',
                label: 'Available Seats',
                render: (value) => value ?? '-',
              },
              {
                key: 'booked_seats',
                label: 'Booked Seats',
                render: (value) => value ?? 0,
              },
              {
                key: 'passenger_tickets',
                label: 'Passenger Tickets',
                render: (value) => value ?? 0,
              },
              {
                key: 'onboard_passengers',
                label: 'Onboard Now',
                render: (value) => value ?? 0,
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={buses}
            onDelete={(row) => removeRecord(row, 'bus')}
            onEdit={(row) => openEditModal('bus', row)}
          />
        </div>
      );
    }

    if (active === 'Routes') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Routes</h2>
            <button type="button" onClick={() => openModal('route')} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Add Route
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'route_name', label: 'Route Name' },
              { key: 'start_point', label: 'Start' },
              { key: 'end_point', label: 'Destination' },
            ]}
            rows={routes}
            onDelete={(row) => removeRecord(row, 'route')}
            onEdit={(row) => openEditModal('route', row)}
          />
        </div>
      );
    }

    if (active === 'Payments') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Manual Payment Verification</h2>
          <PaymentVerificationPanel />
        </div>
      );
    }

    if (active === 'Passenger Flow') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Passenger Flow</h2>
          <PassengerFlowPanel />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Trips</h2>
          <button type="button" onClick={() => openModal('trip')} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">
            Add Trip
          </button>
        </div>
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'route_name', label: 'Route' },
            { key: 'departure_time', label: 'Departure' },
            { key: 'total_seats', label: 'Total Seats' },
            { key: 'booked_seats', label: 'Booked' },
            { key: 'available_seats', label: 'Available' },
            { key: 'occupancy_percentage', label: 'Occupancy %', render: (value) => `${value}%` },
            { key: 'status', label: 'Status' },
          ]}
          rows={trips}
          onDelete={(row) => removeRecord(row, 'trip')}
          onEdit={(row) => openEditModal('trip', row)}
        />
      </div>
    );
  };

  return (
    <PageMotion>
      <AdminLayout>{renderPanel}</AdminLayout>

      <Modal
        title={formType === 'bus' ? `${editingId ? 'Edit' : 'Add'} Bus` : formType === 'route' ? `${editingId ? 'Edit' : 'Add'} Route` : `${editingId ? 'Edit' : 'Add'} Trip`}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        actions={(
          <>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
              Cancel
            </button>
            <button type="button" onClick={submitForm} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          {formType === 'bus' ? (
            <>
              <input placeholder="Bus name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <select value={form.route_id} onChange={(event) => setForm((prev) => ({ ...prev, route_id: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white">
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>{route.route_name}</option>
                ))}
              </select>
              <input type="number" min="1" placeholder="Seat capacity" value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </>
          ) : formType === 'route' ? (
            <>
              <input placeholder="Route name" value={form.route_name} onChange={(event) => setForm((prev) => ({ ...prev, route_name: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <input placeholder="Start point" value={form.start_point} onChange={(event) => setForm((prev) => ({ ...prev, start_point: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <input placeholder="Destination" value={form.end_point} onChange={(event) => setForm((prev) => ({ ...prev, end_point: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
            </>
          ) : (
            <>
              <select value={form.route_id} onChange={(event) => setForm((prev) => ({ ...prev, route_id: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white">
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>{route.route_name}</option>
                ))}
              </select>
              <select value={form.bus_id} onChange={(event) => setForm((prev) => ({ ...prev, bus_id: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white">
                <option value="">Select bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>{bus.name}</option>
                ))}
              </select>
              <input type="datetime-local" value={form.departure_time} onChange={(event) => setForm((prev) => ({ ...prev, departure_time: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <input type="datetime-local" value={form.arrival_time} onChange={(event) => setForm((prev) => ({ ...prev, arrival_time: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <input type="number" min="0" placeholder="Fare" value={form.fare} onChange={(event) => setForm((prev) => ({ ...prev, fare: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
              <input type="number" min="1" placeholder="Total seats" value={form.total_seats} onChange={(event) => setForm((prev) => ({ ...prev, total_seats: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white" />
            </>
          )}
        </div>
      </Modal>

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </PageMotion>
  );
}

function AdminStatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
