import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import DataTable from '../components/admin/DataTable';
import Modal from '../components/common/Modal';
import useLiveTracking from '../hooks/useLiveTracking';
import { busApi, routeApi, tripApi } from '../services/api';
import useToast from '../hooks/useToast';
import Toast from '../components/common/Toast';
import { useAuthContext } from '../contexts/AuthContext';
import PageMotion from '../components/common/PageMotion';

export default function AdminPage() {
  const { token } = useAuthContext();
  const { buses, routes, retry } = useLiveTracking();
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
      if (formType === 'bus') {
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
    } catch {
      toast.error('Could not save changes. Please check your connection and try again.');
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
    if (active === 'Buses') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Buses</h2>
            <button type="button" onClick={() => openModal('bus')} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Add Bus
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Bus Name' },
              { key: 'route_name', label: 'Route' },
              { key: 'capacity', label: 'Seats' },
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
