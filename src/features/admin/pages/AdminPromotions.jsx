import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calculator,
  Pencil,
  Trash2,
  Search,
  X,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminPromotions() {
  const { adminFetch } = useAdminStore();
  const [coupons, setCoupons] = useState([]);
  const [collections, setCollections] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, DISABLED, EXPIRED, UPCOMING

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    startsAt: '',
    expiresAt: '',
    applicableCollections: [],
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Simulator State
  const [simCode, setSimCode] = useState('');
  const [simSubtotal, setSimSubtotal] = useState('2500');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(Boolean(modalOpen));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen && !submitting) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, submitting]);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/coupons');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load coupons');
      setCoupons(json.coupons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await adminFetch('/api/admin/collections');
      const json = await res.json();
      if (res.ok && json.collections) {
        setCollections(json.collections);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCollections();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormState);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    let appCols = [];
    if (coupon.applicableCollections) {
      try {
        appCols = Array.isArray(coupon.applicableCollections)
          ? coupon.applicableCollections
          : JSON.parse(coupon.applicableCollections);
      } catch {
        appCols = [];
      }
    }

    setFormData({
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount ?? '',
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split('T')[0] : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      applicableCollections: appCols,
      isActive: Boolean(coupon.isActive),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminFetch(`/api/admin/coupons/${id}/toggle`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to toggle coupon');
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (coupon) => {
    const confirmMsg = coupon.usedCount > 0
      ? `This coupon has ${coupon.usedCount} historical redemptions. Deleting it will safely deactivate it to protect order history. Proceed?`
      : `Are you sure you want to delete coupon "${coupon.code}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminFetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete coupon');
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim() || null,
      description: formData.description.trim() || null,
      minOrderAmount: formData.minOrderAmount !== '' ? Number(formData.minOrderAmount) : null,
      maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : null,
      usageLimit: formData.usageLimit !== '' ? parseInt(formData.usageLimit, 10) : null,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      applicableCollections: formData.applicableCollections.length > 0 ? formData.applicableCollections : null,
    };

    try {
      let res;
      if (editingCoupon) {
        res = await adminFetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch('/api/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save coupon');

      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simCode) return;
    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: simCode.trim().toUpperCase(),
          subtotal: Number(simSubtotal),
        }),
      });

      const json = await res.json();
      setSimResult({ ok: res.ok, ...json });
    } catch (err) {
      setSimResult({ ok: false, message: err.message });
    } finally {
      setSimLoading(false);
    }
  };

  const getCouponStatus = (c) => {
    const now = new Date();
    if (!c.isActive) return { label: 'Disabled', badgeClass: 'bg-stone-200 text-stone-700' };
    if (c.usageLimit && c.usedCount >= c.usageLimit) {
      return { label: 'Exhausted', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' };
    }
    if (c.expiresAt && now > new Date(c.expiresAt)) {
      return { label: 'Expired', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200' };
    }
    if (c.startsAt && now < new Date(c.startsAt)) {
      return { label: 'Upcoming', badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200' };
    }
    return { label: 'Active', badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const status = getCouponStatus(c).label;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return status === 'Active';
      if (statusFilter === 'DISABLED') return status === 'Disabled';
      if (statusFilter === 'EXPIRED') return status === 'Expired';
      if (statusFilter === 'UPCOMING') return status === 'Upcoming';
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  const toggleCollectionSelection = (slug) => {
    setFormData((prev) => {
      const exists = prev.applicableCollections.includes(slug);
      return {
        ...prev,
        applicableCollections: exists
          ? prev.applicableCollections.filter((s) => s !== slug)
          : [...prev.applicableCollections, slug],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Promotions & Coupons</h1>
          <p className="text-xs text-[#7A7167]">
            Server-side authoritative promotional discounts, collection restrictions, and checkout incentives
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Simulator Card */}
      <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-[#8C6320]" />
          <h2 className="font-serif text-sm font-bold text-[#1A1817]">
            Authoritative Checkout Validation Simulator
          </h2>
        </div>

        <form onSubmit={handleSimulate} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-1">Coupon Code</label>
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={simCode}
              onChange={(e) => setSimCode(e.target.value.toUpperCase())}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono uppercase text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-1">Cart Subtotal (₹)</label>
            <input
              type="number"
              value={simSubtotal}
              onChange={(e) => setSimSubtotal(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={simLoading}
            className="px-4 py-1.5 bg-[#1E1916] text-white rounded font-medium hover:bg-[#2C2520] transition-colors"
          >
            {simLoading ? 'Validating...' : 'Test Calculation'}
          </button>
        </form>

        {simResult && (
          <div
            className={`mt-3 p-3 rounded text-xs ${
              simResult.ok
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {simResult.ok ? (
              <div className="flex items-center justify-between">
                <span>✓ {simResult.message}</span>
                <span className="font-mono font-bold">
                  Discount: ₹{simResult.discountAmount} (Net Subtotal: ₹{Number(simSubtotal) - simResult.discountAmount})
                </span>
              </div>
            ) : (
              <span>✕ {simResult.message}</span>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7167]" />
          <input
            type="text"
            placeholder="Search by code or promotion name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-lg border border-[#E5E0D5] text-[11px] font-medium overflow-x-auto">
          {['ALL', 'ACTIVE', 'DISABLED', 'EXPIRED', 'UPCOMING'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-white text-[#722F37] font-semibold shadow-xs'
                  : 'text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading coupons...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No coupons match your search or filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Code & Name</th>
                  <th className="px-5 py-3">Benefit</th>
                  <th className="px-5 py-3">Eligibility & Scope</th>
                  <th className="px-5 py-3">Redemptions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {filteredCoupons.slice((page - 1) * 10, page * 10).map((c) => {
                  const status = getCouponStatus(c);
                  let collectionsList = [];
                  if (c.applicableCollections) {
                    try {
                      collectionsList = Array.isArray(c.applicableCollections)
                        ? c.applicableCollections
                        : JSON.parse(c.applicableCollections);
                    } catch {
                      collectionsList = [];
                    }
                  }

                  return (
                    <tr key={c.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-mono font-bold text-[#1A1817] text-sm">{c.code}</div>
                        {c.name && <div className="text-[11px] font-semibold text-[#5C544C]">{c.name}</div>}
                        {c.description && <div className="text-[10px] text-[#7A7167] max-w-xs truncate">{c.description}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-sans font-semibold tabular-nums text-[#722F37] text-xs">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                        </span>
                        {c.maxDiscountAmount && (
                          <span className="text-[10px] font-sans tabular-nums text-[#8C8377] block">
                            Cap: ₹{c.maxDiscountAmount}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#5C544C] font-sans tabular-nums">
                        <div>{c.minOrderAmount ? `Min Order ₹${c.minOrderAmount}` : 'No minimum subtotal'}</div>
                        {c.startsAt && (
                          <div className="text-[10px] text-[#8C8377] font-mono">
                            Starts: {new Date(c.startsAt).toLocaleDateString()}
                          </div>
                        )}
                        {c.expiresAt && (
                          <div className="text-[10px] text-[#8C8377] font-mono">
                            Expires: {new Date(c.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                        {collectionsList.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {collectionsList.map((col) => (
                              <span
                                key={col}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-stone-100 text-stone-700 border border-stone-200"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-sans tabular-nums">
                        <div className="font-medium text-[#1A1817]">
                          {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit} max` : 'used'}
                        </div>
                        {c.usageLimit && (
                          <div className="w-16 h-1.5 bg-stone-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-[#722F37]"
                              style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title="Edit Promotion"
                            className="p-1.5 rounded text-[#5C544C] hover:bg-white hover:text-[#1A1817] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(c.id)}
                            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                              c.isActive
                                ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                                : 'bg-emerald-700 text-white hover:bg-emerald-800'
                            }`}
                          >
                            {c.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            title="Delete Promotion"
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(filteredCoupons.length / 10) || 1}
          totalItems={filteredCoupons.length}
          pageSize={10}
          onPageChange={setPage}
          itemName="coupons"
        />
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#7A7167] hover:text-[#1A1817] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingCoupon)}
                    placeholder="e.g. LUXURY20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono uppercase disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                  {editingCoupon && (
                    <span className="text-[10px] text-[#7A7167] mt-0.5 block">Code cannot be changed once created.</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Promotion Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Festive Offer"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Description / Campaign Note</label>
                <textarea
                  rows={2}
                  placeholder="Optional customer-facing or internal promotional context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Benefit Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Fixed (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Global Usage Limit</label>
                <input
                  type="number"
                  placeholder="Leave empty for unlimited redemptions"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                />
              </div>

              {/* Applicable Collections Scope */}
              <div className="p-3 bg-white rounded border border-[#D5CEC2]">
                <label className="block font-semibold text-[#4A423B] uppercase mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#722F37]" />
                  <span>Applicable Collections Scope (Optional)</span>
                </label>
                <p className="text-[10px] text-[#7A7167] mb-2.5">
                  If selected, discount applies only to items from these collections. Leave unchecked to allow store-wide application.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {collections.map((col) => {
                    const isSelected = formData.applicableCollections.includes(col.slug);
                    return (
                      <button
                        type="button"
                        key={col.id}
                        onClick={() => toggleCollectionSelection(col.slug)}
                        className={`flex items-center gap-2 p-2 rounded text-left border transition-all ${
                          isSelected
                            ? 'bg-[#722F37]/10 border-[#722F37] text-[#722F37] font-semibold'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-[#722F37] border-[#722F37] text-white' : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate text-[11px]">{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#722F37] focus:ring-[#722F37]"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-[#4A423B] cursor-pointer">
                  Activate this promotion immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229] transition-colors"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
