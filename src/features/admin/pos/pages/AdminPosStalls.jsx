import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Star,
  Check,
  Boxes,
  ArrowRightLeft,
  Trash2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';

export function AdminPosStalls() {
  const navigate = useNavigate();
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
    city: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    openingCashBalance: '5000',
    notes: '',
    setAsDefault: false,
    autoInitInventory: true,
  });

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      city: '',
      state: 'Tamil Nadu',
      stateCode: '33',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      openingCashBalance: '5000',
      notes: '',
      setAsDefault: events.length === 0,
      autoInitInventory: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name || '',
      code: event.code || '',
      venue: event.venue || '',
      address: event.address || '',
      city: event.city || '',
      state: event.state || 'Tamil Nadu',
      stateCode: event.stateCode || '33',
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      status: event.status || 'ACTIVE',
      openingCashBalance: String(event.openingCashBalance ?? 0),
      notes: event.notes || '',
      setAsDefault: Boolean(event.isDefaultStall),
      autoInitInventory: true,
    });
    setModalOpen(true);
  };

  const handleSetDefaultStall = async (event) => {
    try {
      await posApi.setDefaultStall(event.id);
      setSuccessMsg(`Stall "${event.name}" is now the active default POS register.`);
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set default stall.');
    }
  };

  const handleOpenDelete = (event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      const res = await posApi.deleteEvent(eventToDelete.id);
      setSuccessMsg(res.message || `Stall "${eventToDelete.name}" removed successfully.`);
      setDeleteModalOpen(false);
      setEventToDelete(null);
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete stall event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.venue.trim()) {
      setErrorMsg('Event Name and Venue Name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingEvent) {
        await posApi.updateEvent(editingEvent.id, formData);
        setSuccessMsg(`Stall "${formData.name}" and stock location updated successfully.`);
      } else {
        await posApi.createEvent(formData);
        setSuccessMsg(`New Stall Event "${formData.name}" registered with dedicated stock location.`);
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#762F39] hover:bg-[#8C3A46] text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Stall Event</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in">
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
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'ARCHIVED'].map((st) => (
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
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between transition group relative ${
                  ev.isDefaultStall
                    ? 'border-[#762F39] ring-1 ring-[#762F39]/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-bold">
                        {ev.code}
                      </span>
                      {ev.isDefaultStall && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>ACTIVE POS REGISTER</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        ev.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : ev.status === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : ev.status === 'ARCHIVED'
                          ? 'bg-red-50 text-red-700 border-red-300'
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
                    <span>
                      {ev.venue}
                      {ev.city ? `, ${ev.city}` : ''}
                      {ev.state ? ` (${ev.state}${ev.stateCode ? ` - ${ev.stateCode}` : ''})` : ''}
                    </span>
                  </p>

                  {ev.address && (
                    <p className="text-[11px] text-stone-500 mt-1 pl-5">
                      {ev.address}
                    </p>
                  )}

                  {ev.notes && (
                    <p className="text-[11px] italic text-stone-400 mt-1 pl-5 border-l border-stone-200">
                      "{ev.notes}"
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                    <div>
                      <span className="text-stone-400 text-[10px] block font-mono">DATES:</span>
                      <span className="font-sans font-medium">{start} - {end}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block font-mono">OPENING FLOAT:</span>
                      <span className="font-bold text-[#3F5A35] font-sans tabular-nums">
                        ₹{Number(ev.openingCashBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {ev.stockLocation && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <div className="flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-stone-400" />
                        <span>Stock Pool:</span>
                        <code className="text-[10px] font-mono bg-stone-50 px-1 py-0.5 rounded border border-stone-200">
                          {ev.stockLocation.code}
                        </code>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {ev.stockLocation._count?.inventories || 0} SKUs
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <div>
                      <span className="font-bold text-stone-800 tabular-nums">{ev._count?.posSales || 0}</span> Bills Finalized
                    </div>
                    {ev.status === 'ACTIVE' && !ev.isDefaultStall && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultStall(ev)}
                        className="text-[11px] font-semibold text-[#762F39] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Set this stall as the active POS counter register"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>Make Active POS</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                        title="Edit stall details, venue, dates, opening float, or notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {ev.stockLocation?.id && (
                        <>
                          <Link
                            to={`/admin/stall/inventory?locationId=${ev.stockLocation.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
                            title="View and adjust live on-hand stock for this stall"
                          >
                            <Boxes className="w-3.5 h-3.5 text-stone-500" />
                            <span>Stock</span>
                          </Link>

                          <Link
                            to={`/admin/stall/transfers?toLocationId=${ev.stockLocation.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
                            title="Transfer inventory from Central Warehouse into this stall"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
                            <span>Transfer</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(ev)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete or Archive stall event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-[#762F39] to-[#5C232B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-amber-200" />
                <h3 className="font-serif font-bold text-lg">
                  {editingEvent ? 'Edit Stall Event & Register' : 'Create New Stall Event & Register'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
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
                  <label className="block font-semibold text-stone-700 mb-1">Event Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. STALL-2026-7435"
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
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Chennai Trade Centre or Kanchipuram Exhibition Hall"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Detailed Address / Stall Number</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Hall 3, Stall #42, Nandambakkam"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Kanchipuram or Chennai"
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
                      placeholder="Tamil Nadu"
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
                  <label className="block font-semibold text-stone-700 mb-1">
                    Opening Cash Balance Float (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.openingCashBalance}
                    onChange={(e) => setFormData({ ...formData, openingCashBalance: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-sans tabular-nums focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Initial cash drawer float for cashier change on opening day.
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    Operating Notes & Cash Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Authorized staff names, cash handover time, thermal printer ID..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none resize-none"
                  />
                </div>

                {/* Configuration Toggles */}
                <div className="col-span-2 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.setAsDefault}
                      onChange={(e) => setFormData({ ...formData, setAsDefault: e.target.checked })}
                      className="mt-0.5 rounded text-[#762F39] focus:ring-[#762F39]"
                    />
                    <div>
                      <span className="font-semibold text-stone-800 block text-xs">
                        Set as Active Default Stall for Dedicated POS Billing
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        The Dedicated POS terminal at <code>/stall</code> will automatically bill against this venue register.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoInitInventory}
                      onChange={(e) => setFormData({ ...formData, autoInitInventory: e.target.checked })}
                      className="mt-0.5 rounded text-[#762F39] focus:ring-[#762F39]"
                    />
                    <div>
                      <span className="font-semibold text-stone-800 block text-xs">
                        Auto-initialize Stock Tracking for All Catalog SKUs
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Creates dedicated location inventory rows so you can immediately perform transfers and stock counts.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#762F39] hover:bg-[#8C3A46] text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteModalOpen && eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 p-5">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Confirm Stall Removal
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Are you sure you want to remove stall <strong className="text-stone-900">"{eventToDelete.name}"</strong> ({eventToDelete.code})?
            </p>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-500 space-y-1 mb-4">
              <p>• If this stall has existing bills or transfers, it will be safely <strong>ARCHIVED</strong> to protect tax audit trails.</p>
              <p>• If no bills exist, its stock location records and register will be completely deleted.</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEventToDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
