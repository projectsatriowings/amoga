import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Banknote,
  Users,
  Search,
  AlertCircle,
  X,
  TrendingUp,
  Receipt,
  Building,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';

export function AdminPosStalls() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    venue: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    stateCode: '33',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    openingCashBalance: '0',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await posApi.listEvents(statusFilter);
      if (res?.events) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setErrorMsg(err.message || 'Failed to load stall events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      code: `STALL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      venue: '',
      address: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      openingCashBalance: '5000',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      code: event.code,
      venue: event.venue,
      address: event.address || '',
      city: event.city || 'Chennai',
      state: event.state || 'Tamil Nadu',
      stateCode: event.stateCode || '33',
      startDate: new Date(event.startDate).toISOString().split('T')[0],
      endDate: new Date(event.endDate).toISOString().split('T')[0],
      status: event.status,
      openingCashBalance: String(event.openingCashBalance || 0),
      notes: event.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.venue.trim()) {
      setErrorMsg('Event Name and Venue are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingEvent) {
        await posApi.updateEvent(editingEvent.id, formData);
        setSuccessMsg(`Stall "${formData.name}" updated successfully.`);
      } else {
        await posApi.createEvent(formData);
        setSuccessMsg(`New Stall Event "${formData.name}" registered.`);
      }

      setModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save stall event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#762F39] to-[#5C232B] flex items-center justify-center text-white shadow-md">
            <MapPin className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Stalls & Exhibition Events
            </h1>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Configure temporary exhibition venues, pop-up stores, opening cash floats, and GST place-of-supply rules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#762F39] hover:bg-[#8C3A46] text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Stall Event</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'ACTIVE', 'UPCOMING', 'COMPLETED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {st === 'all' ? 'All Events' : st}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-500">
            <div className="w-6 h-6 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading stall events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-stone-300 p-6">
            <MapPin className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-stone-700 text-sm">No stall events found</p>
            <p className="text-xs text-stone-400 mt-0.5">Click "New Stall Event" to create a venue register.</p>
          </div>
        ) : (
          events.map((ev) => {
            const start = new Date(ev.startDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const end = new Date(ev.endDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between hover:border-stone-300 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-bold">
                      {ev.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        ev.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : ev.status === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#762F39] transition">
                    {ev.name}
                  </h3>

                  <p className="text-xs text-stone-600 mt-1 flex items-start gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{ev.venue}, {ev.city}</span>
                  </p>

                  <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-600">
                    <div>
                      <span className="text-stone-400 text-[10px] block">DATES:</span>
                      <span>{start} - {end}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block">OPENING FLOAT:</span>
                      <span className="font-bold text-[#3F5A35]">₹{Number(ev.openingCashBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-stone-500">
                    <span className="font-bold text-stone-800">{ev._count?.posSales || 0}</span> Bills Billed
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-[#762F39] to-[#5C232B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-amber-200" />
                <h3 className="font-serif font-bold text-lg">
                  {editingEvent ? 'Edit Stall Event' : 'Create New Stall Event'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    Event / Exhibition Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Chennai Trade Fair 2026 or Festive Pop-Up"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Event Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono uppercase focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Chennai Trade Centre, Hall 3, Stall 42"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">State & GST Code</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="col-span-2 px-2.5 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.stateCode}
                      onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                      placeholder="33"
                      className="px-2 py-2 text-xs border border-stone-300 rounded-xl font-mono text-center focus:outline-none"
                      title="2-digit GST state code (33 for Tamil Nadu)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Opening Cash Balance Float (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.openingCashBalance}
                    onChange={(e) => setFormData({ ...formData, openingCashBalance: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#762F39] hover:bg-[#8C3A46] text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
