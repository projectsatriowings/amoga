import React, { useState, useEffect } from 'react';
import { Plus, Calculator } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminPromotions() {
  const { adminFetch } = useAdminStore();
  const [coupons, setCoupons] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });

  // Simulator State
  const [simCode, setSimCode] = useState('');
  const [simSubtotal, setSimSubtotal] = useState('2500');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/coupons');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load coupons');
      setCoupons(json.coupons);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await adminFetch(`/api/admin/coupons/${id}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle coupon');
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
          maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create coupon');

      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      alert(err.message);
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
          code: simCode,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Promotions & Coupons</h1>
          <p className="text-xs text-[#7A7167]">
            Server-side validated promotional discounts, usage caps, and checkout incentives
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
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

      {/* Coupons Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading coupons...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No coupons registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Benefit</th>
                  <th className="px-5 py-3">Eligibility Rules</th>
                  <th className="px-5 py-3">Redemptions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {coupons.slice((page - 1) * 10, page * 10).map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#1A1817]">
                      {c.code}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-sans font-semibold tabular-nums text-[#722F37]">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </span>
                      {c.maxDiscountAmount && (
                        <span className="text-[10px] font-sans tabular-nums text-[#8C8377] block">
                          Cap: ₹{c.maxDiscountAmount}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#5C544C] font-sans tabular-nums">
                      {c.minOrderAmount ? `Min Order ₹${c.minOrderAmount}` : 'No minimum'}
                      {c.expiresAt && (
                        <span className="text-[10px] text-[#8C8377] block font-mono">
                          Expires: {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-sans tabular-nums">
                      {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit} max` : 'used'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                          c.isActive
                            ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(coupons.length / 10) || 1}
          totalItems={coupons.length}
          pageSize={10}
          onPageChange={setPage}
          itemName="coupons"
        />
      </div>

      {/* Create Coupon Modal */}
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
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">Create Promotional Coupon</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LUXURY20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Type *</label>
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
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Value *</label>
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
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Min Order (₹)</label>
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
                  <label className="block font-semibold text-[#4A423B] uppercase mb-1">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
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

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
                >
                  {submitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
