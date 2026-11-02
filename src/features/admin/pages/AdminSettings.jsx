import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Building,
  Receipt,
  FileText,
  Truck,
  Package,
  Calculator,
  Plus,
  Trash2,
  Check,
  Percent,
  Users,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { AdminStaffManagement } from '../components/AdminStaffManagement';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminSettings() {
  const { adminFetch, admin } = useAdminStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'general';

  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Live simulation states
  const [simPieces, setSimPieces] = useState(3);
  const [simSubtotal, setSimSubtotal] = useState(1800);
  const [simPrice, setSimPrice] = useState(1000);
  const [simGstRate, setSimGstRate] = useState(5);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminFetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load store settings');
      setSettings(json.settings);
      setHealth(json.health);
      if (json.settings?.taxPercentage) {
        setSimGstRate(Number(json.settings.taxPercentage));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHealth = async () => {
    setRefreshingHealth(true);
    try {
      const res = await adminFetch('/api/admin/settings');
      const json = await res.json();
      if (res.ok && json.health) {
        setHealth(json.health);
      }
    } catch (err) {
      console.warn('Health refresh error:', err);
    } finally {
      setRefreshingHealth(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleBracketChange = (index, field, value) => {
    const updated = [...(settings?.shippingBrackets || [])];
    const num = Number(value);
    const item = { ...updated[index], [field]: num };
    if (field === 'minPieces' || field === 'minQty') {
      item.minPieces = num;
      item.minQty = num;
    }
    if (field === 'maxPieces' || field === 'maxQty') {
      item.maxPieces = num;
      item.maxQty = num;
    }
    updated[index] = item;
    setSettings({ ...settings, shippingBrackets: updated });
  };

  const handleAddBracket = () => {
    const existing = settings?.shippingBrackets || [];
    const lastBracket = existing[existing.length - 1];
    const nextMin = lastBracket ? Number(lastBracket.maxPieces) + 1 : 1;
    const nextMax = nextMin;
    const nextCharge = lastBracket ? Number(lastBracket.charge) + 50 : 100;
    setSettings({
      ...settings,
      shippingBrackets: [...existing, { minPieces: nextMin, maxPieces: nextMax, charge: nextCharge }],
    });
  };

  const handleRemoveBracket = (index) => {
    const updated = [...(settings?.shippingBrackets || [])].filter((_, idx) => idx !== index);
    setSettings({ ...settings, shippingBrackets: updated });
  };

  const handleResetBrackets = () => {
    setSettings({
      ...settings,
      shippingCarrierName: 'India Post',
      shippingRulesEnabled: true,
      shippingThresholdOperator: 'GTE',
      freeShippingThreshold: 2500,
      shippingBeyondMaxRule: 'PER_PIECE',
      shippingBeyondMaxBaseCharge: 200,
      shippingBeyondMaxChargePerPiece: 50,
      shippingBrackets: [
        { minPieces: 1, maxPieces: 2, charge: 100 },
        { minPieces: 3, maxPieces: 3, charge: 150 },
        { minPieces: 4, maxPieces: 4, charge: 200 },
      ],
    });
  };

  const simulatedShipping = useMemo(() => {
    const pieces = Number(simPieces) || 0;
    const subtotal = Number(simSubtotal) || 0;
    const threshold = Number(settings?.freeShippingThreshold ?? 2500);
    const operator = settings?.shippingThresholdOperator || 'GTE';
    const isFree = operator === 'GT' ? subtotal > threshold : subtotal >= threshold;

    if (isFree && subtotal > 0) {
      return {
        charge: 0,
        isFree: true,
        reason: `Complimentary: Subtotal ₹${subtotal.toLocaleString('en-IN')} is ${operator === 'GT' ? '>' : '≥'} ₹${threshold.toLocaleString('en-IN')}`,
      };
    }
    if (pieces <= 0) {
      return { charge: 0, isFree: false, reason: 'Cart is empty' };
    }
    if (!settings?.shippingRulesEnabled) {
      const std = Number(settings?.shippingStandardRate ?? 100);
      return { charge: std, isFree: false, reason: `Flat standard shipping: ₹${std}` };
    }
    const brackets = settings?.shippingBrackets || [
      { minPieces: 1, maxPieces: 2, charge: 100 },
      { minPieces: 3, maxPieces: 3, charge: 150 },
      { minPieces: 4, maxPieces: 4, charge: 200 },
    ];
    const matched = brackets.find((b) => pieces >= b.minPieces && pieces <= b.maxPieces);
    if (matched) {
      return {
        charge: matched.charge,
        isFree: false,
        reason: `${settings?.shippingCarrierName || 'India Post'} parcel bracket: ${matched.minPieces}–${matched.maxPieces} pcs = ₹${matched.charge}`,
      };
    }
    const sorted = [...brackets].sort((a, b) => b.maxPieces - a.maxPieces);
    const maxBracket = sorted[0];
    const maxLimit = maxBracket ? maxBracket.maxPieces : 4;
    if (pieces > maxLimit) {
      const base = Number(settings?.shippingBeyondMaxBaseCharge ?? 200);
      const perPiece = Number(settings?.shippingBeyondMaxChargePerPiece ?? 50);
      const extra = pieces - maxLimit;
      const total = base + extra * perPiece;
      return {
        charge: total,
        isFree: false,
        reason: `${settings?.shippingCarrierName || 'India Post'} parcel beyond max: Base ₹${base} (${maxLimit} pcs) + ${extra} × ₹${perPiece}/pc = ₹${total}`,
      };
    }
    return { charge: Number(settings?.shippingStandardRate ?? 100), isFree: false, reason: 'Standard fallback' };
  }, [simPieces, simSubtotal, settings]);

  const simulatedTax = useMemo(() => {
    const price = Number(simPrice) || 0;
    const rate = Number(simGstRate) || 0;
    if (price <= 0 || rate <= 0) {
      return { taxable: price, gst: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    const taxable = Math.round((price / (1 + rate / 100)) * 100) / 100;
    const gst = Math.round((price - taxable) * 100) / 100;
    const half = Math.round((gst / 2) * 100) / 100;
    const remaining = Math.round((gst - half) * 100) / 100;
    return { taxable, gst, cgst: half, sgst: remaining, igst: gst };
  }, [simPrice, simGstRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSubmitting(true);
    setMessage(null);

    // Client-side quick checks
    if (!settings.storeName?.trim()) {
      setMessage({ type: 'error', text: 'Store name is required' });
      setSubmitting(false);
      return;
    }

    if (Number(settings.taxPercentage) < 0 || Number(settings.taxPercentage) > 100) {
      setMessage({ type: 'error', text: 'Tax / GST rate must be between 0% and 100%' });
      setSubmitting(false);
      return;
    }

    if (Number(settings.shippingStandardRate) < 0 || Number(settings.freeShippingThreshold) < 0) {
      setMessage({ type: 'error', text: 'Shipping values must be non-negative amounts' });
      setSubmitting(false);
      return;
    }

    if (settings.shippingRulesEnabled && Array.isArray(settings.shippingBrackets)) {
      for (const b of settings.shippingBrackets) {
        if (Number(b.minPieces) < 1 || Number(b.maxPieces) < Number(b.minPieces) || Number(b.charge) < 0) {
          setMessage({
            type: 'error',
            text: `Invalid shipping bracket: min ${b.minPieces}, max ${b.maxPieces}, fee ₹${b.charge}. Min must be >= 1, max >= min, and fee >= 0.`,
          });
          setSubmitting(false);
          return;
        }
      }
    }

    if (settings.fssaiLicenseNumber && !/^[0-9]{14}$/.test(settings.fssaiLicenseNumber)) {
      setMessage({ type: 'error', text: 'FSSAI License Number must be exactly 14 digits.' });
      setSubmitting(false);
      return;
    }

    if (settings.returnWindowDays && (Number(settings.returnWindowDays) < 1 || Number(settings.returnWindowDays) > 90)) {
      setMessage({ type: 'error', text: 'Standard return window must be between 1 and 90 days.' });
      setSubmitting(false);
      return;
    }

    if (settings.foodReturnWindowHours && (Number(settings.foodReturnWindowHours) < 1 || Number(settings.foodReturnWindowHours) > 168)) {
      setMessage({ type: 'error', text: 'Food transit damage reporting window must be between 1 and 168 hours.' });
      setSubmitting(false);
      return;
    }

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update store settings');

      setMessage({ type: 'success', text: 'Store settings persisted and verified in PostgreSQL!' });
      setSettings(json.settings);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const [addStaffTrigger, setAddStaffTrigger] = useState(0);

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#7A7167]">
        <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading authoritative store settings...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 pt-2">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#7A7167]">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'general' })}
            className="hover:text-[#1A1817] transition-colors cursor-pointer"
          >
            Settings
          </button>
          <span>/</span>
          <span className="font-semibold text-[#1A1817]">
            {currentTab === 'staff' ? 'Staff & Roles' : 'Store & Compliance'}
          </span>
        </div>
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="border-b border-[#E5E0D5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1A1817] tracking-tight">
            {currentTab === 'staff' ? 'Staff & Roles' : 'Store & Compliance'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7167] mt-1">
            {currentTab === 'staff'
              ? 'Manage staff accounts, permissions, and assigned stall locations.'
              : 'Configure store parameters, shipping rules, tax compliance, and legal credentials.'}
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-[#EFEAE1]/80 rounded-xl border border-[#D5CEC2] shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'general' })}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentTab !== 'staff'
                  ? 'bg-white text-[#722F37] shadow-xs'
                  : 'text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Store & Compliance</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'staff' })}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'staff'
                  ? 'bg-white text-[#722F37] shadow-xs'
                  : 'text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff & Roles</span>
            </button>
          </div>

          {/* Primary Action Button: Add Staff Member (in Page Header) */}
          {currentTab === 'staff' && isSuperAdmin && (
            <button
              type="button"
              onClick={() => setAddStaffTrigger((c) => c + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs shrink-0 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {currentTab === 'staff' ? (
        <AdminStaffManagement addStaffTrigger={addStaffTrigger} />
      ) : (
        <>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Truthful Infrastructure & Security Health */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E5E0D5] space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
          <div>
            <h2 className="font-serif text-sm font-bold text-[#292820] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#722F37]" />
              <span>Infrastructure & Security Health</span>
            </h2>
            <p className="text-[11px] text-[#746F63] mt-0.5 font-sans">
              Live operational verification across Neon PostgreSQL and Payment Provider
            </p>
          </div>
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
              health?.database?.status === 'CONNECTED'
                ? 'text-[#3F5A35] bg-[#3F5A35]/10 border-[#3F5A35]/20'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}
          >
            {health?.database?.status === 'CONNECTED' ? 'Systems Active' : 'Degraded Connectivity'}
          </span>
        </div>
        <SystemHealthCard
          health={health}
          onRefresh={handleRefreshHealth}
          refreshing={refreshingHealth}
        />
      </div>

      {/* Editable Business Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Storefront Identity & Concierge */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            Storefront Identity & Concierge
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Store Name *</label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={settings?.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 disabled:cursor-not-allowed text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Concierge Email *</label>
              <input
                type="email"
                required
                disabled={!isSuperAdmin}
                value={settings?.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 disabled:cursor-not-allowed font-mono text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Concierge Phone *</label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={settings?.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 disabled:cursor-not-allowed font-mono text-[#1A1817]"
              />
            </div>
          </div>
        </div>

        {/* India Post Shipping Configuration */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-6">
          <div className="border-b border-[#EAE4D9] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#722F37]" />
                <span>India Post Parcel & Shipping Rules</span>
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Configurable quantity-based piece brackets, free-delivery threshold, beyond-bracket incremental rates, and postal serviceability.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#D5CEC2] shadow-2xs">
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={Boolean(settings?.shippingRulesEnabled ?? true)}
                  onChange={(e) => setSettings({ ...settings, shippingRulesEnabled: e.target.checked })}
                  className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
                />
                <span className="text-xs font-semibold text-[#1A1817]">Enable India Post Rules</span>
              </label>
              <button
                type="button"
                disabled={!isSuperAdmin}
                onClick={handleResetBrackets}
                className="px-2.5 py-1.5 text-[11px] font-medium text-[#722F37] bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                title="Reset to default India Post rates (1-2: ₹100, 3: ₹150, 4: ₹200, 5+: +₹50/pc, Free >= ₹2,500)"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Carrier Name, Threshold and Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Logistics Carrier Name *
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={settings?.shippingCarrierName || 'India Post'}
                onChange={(e) => setSettings({ ...settings, shippingCarrierName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Displayed on cart, checkout & invoices.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Free Shipping Threshold (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={!isSuperAdmin}
                value={settings?.freeShippingThreshold ?? 2500}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Evaluated on discounted product subtotal.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Threshold Operator *
              </label>
              <select
                disabled={!isSuperAdmin}
                value={settings?.shippingThresholdOperator || 'GTE'}
                onChange={(e) => setSettings({ ...settings, shippingThresholdOperator: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817] font-medium"
              >
                <option value="GTE">At or above (≥ ₹{settings?.freeShippingThreshold ?? 2500})</option>
                <option value="GT">Strictly greater than (&gt; ₹{settings?.freeShippingThreshold ?? 2500})</option>
              </select>
              <p className="text-[10px] text-[#7A7167] mt-1">Comparison rule for free delivery.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Fallback Standard Fee (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={!isSuperAdmin}
                value={settings?.shippingStandardRate ?? 100}
                onChange={(e) => setSettings({ ...settings, shippingStandardRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Fallback if bracket rules disabled.</p>
            </div>
          </div>

          {/* India Post Piece Brackets Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1A1817] uppercase flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#722F37]" />
                  <span>Configurable Quantity Brackets (India Post Standard Parcels)</span>
                </h3>
                <p className="text-[10px] text-[#7A7167]">
                  Define the shipping fee based on total cart physical pieces.
                </p>
              </div>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleAddBracket}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#722F37] bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bracket</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5E0D5] bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F6F3EC] text-[#4A423B] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E5E0D5]">
                  <tr>
                    <th className="py-2.5 px-4">Bracket Range</th>
                    <th className="py-2.5 px-4">Min Pieces</th>
                    <th className="py-2.5 px-4">Max Pieces</th>
                    <th className="py-2.5 px-4">Shipping Fee (₹)</th>
                    {isSuperAdmin && <th className="py-2.5 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D9]">
                  {(settings?.shippingBrackets || [
                    { minPieces: 1, maxPieces: 2, charge: 100 },
                    { minPieces: 3, maxPieces: 3, charge: 150 },
                    { minPieces: 4, maxPieces: 4, charge: 200 },
                  ]).map((bracket, idx) => (
                    <tr key={idx} className="hover:bg-[#FCFAF7] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#1A1817]">
                        {(bracket.minPieces ?? bracket.minQty) === (bracket.maxPieces ?? bracket.maxQty)
                          ? `${bracket.minPieces ?? bracket.minQty} piece`
                          : `${bracket.minPieces ?? bracket.minQty} – ${bracket.maxPieces ?? bracket.maxQty} pieces`}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          min="1"
                          disabled={!isSuperAdmin}
                          value={bracket.minPieces ?? bracket.minQty ?? 1}
                          onChange={(e) => handleBracketChange(idx, 'minPieces', e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-[#D5CEC2] rounded font-mono text-center disabled:bg-stone-50"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          min={bracket.minPieces ?? bracket.minQty ?? 1}
                          disabled={!isSuperAdmin}
                          value={bracket.maxPieces ?? bracket.maxQty ?? 1}
                          onChange={(e) => handleBracketChange(idx, 'maxPieces', e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-[#D5CEC2] rounded font-mono text-center disabled:bg-stone-50"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-[#7A7167]">₹</span>
                          <input
                            type="number"
                            min="0"
                            disabled={!isSuperAdmin}
                            value={bracket.charge}
                            onChange={(e) => handleBracketChange(idx, 'charge', e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-[#D5CEC2] rounded font-mono text-left font-bold text-[#722F37] disabled:bg-stone-50"
                          />
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveBracket(idx)}
                            className="p-1 text-[#A89F93] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Remove bracket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5+ Pieces Rule (Beyond Max Bracket) */}
          <div className="p-4 bg-white rounded-xl border border-[#E5E0D5] space-y-3">
            <div className="border-b border-[#F0ECE1] pb-2">
              <h3 className="text-xs font-bold text-[#1A1817] uppercase flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#722F37]" />
                <span>Orders With 5 or More Pieces (Beyond Highest Bracket)</span>
              </h3>
              <p className="text-[10px] text-[#7A7167]">
                Configured formula for carts exceeding 4 pieces (e.g. 5 pcs = ₹250, 6 pcs = ₹300).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Calculation Model *
                </label>
                <select
                  disabled={!isSuperAdmin}
                  value={settings?.shippingBeyondMaxRule || 'PER_PIECE'}
                  onChange={(e) => setSettings({ ...settings, shippingBeyondMaxRule: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
                >
                  <option value="PER_PIECE">Incremental per piece (Base + ₹/piece)</option>
                  <option value="FLAT">Flat surcharge</option>
                </select>
                <p className="text-[10px] text-[#7A7167] mt-1">Model applied when cart piece count &gt; 4.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Base 4-Piece Charge (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings?.shippingBeyondMaxBaseCharge ?? 200}
                  onChange={(e) => setSettings({ ...settings, shippingBeyondMaxBaseCharge: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
                />
                <p className="text-[10px] text-[#7A7167] mt-1">Rate up to 4 pieces.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Additional Fee Per Extra Piece (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings?.shippingBeyondMaxChargePerPiece ?? 50}
                  onChange={(e) => setSettings({ ...settings, shippingBeyondMaxChargePerPiece: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
                />
                <p className="text-[10px] text-[#7A7167] mt-1">E.g. +₹50 per piece for pieces 5, 6, 7...</p>
              </div>
            </div>
          </div>

          {/* Interactive Live Shipping Rate Simulator */}
          <div className="p-4 bg-[#F2EDE4]/60 rounded-xl border border-[#D8D0C3] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1A1817] uppercase flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#722F37]" />
                <span>Live India Post Shipping Simulator</span>
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-[#722F37] border border-[#D5CEC2]">
                Instant Rule Verifier
              </span>
            </div>
            <p className="text-[11px] text-[#5A5249]">
              Test cart piece counts and discounted subtotals against currently configured brackets in real time:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">Simulate Cart Pieces</label>
                <input
                  type="number"
                  min="1"
                  value={simPieces}
                  onChange={(e) => setSimPieces(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-center font-bold text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">Simulate Subtotal (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-center font-bold text-[#1A1817]"
                />
              </div>

              <div className="sm:col-span-2 bg-white p-3 rounded-lg border border-[#D5CEC2] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#7A7167]">Calculated India Post Charge</div>
                  <div className="text-sm font-bold text-[#1A1817] flex items-center gap-2 mt-0.5">
                    {simulatedShipping.isFree ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Free Delivery (₹0)
                      </span>
                    ) : (
                      <span className="text-[#722F37] font-extrabold text-base">
                        ₹{simulatedShipping.charge.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#7A7167] mt-0.5">{simulatedShipping.reason}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit trail / Last changed info */}
          {settings?.shippingConfiguredAt && (
            <div className="text-[10px] text-[#7A7167] flex items-center justify-between pt-1 border-t border-[#EAE4D9]">
              <span>
                Last configured by: <strong className="font-mono text-[#4A423B]">{settings.shippingConfiguredBy || 'Admin'}</strong>
              </span>
              <span>Updated: {new Date(settings.shippingConfiguredAt).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* GST-Inclusive Pricing & Taxation Engine */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-6">
          <div className="border-b border-[#EAE4D9] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#722F37]" />
                <span>GST-Inclusive Product Pricing Engine</span>
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Statutory single-rate inclusive pricing: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">Taxable = Price / (1 + Rate / 100)</code>. Tax is never added twice.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              100% Tax Inclusive
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Default Store Tax / GST Rate (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                disabled={!isSuperAdmin}
                value={settings?.taxPercentage ?? 5}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings({ ...settings, taxPercentage: val });
                  setSimGstRate(val);
                }}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Fallback rate when product doesn't define custom rate.</p>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center">
              <div className="bg-white p-3 rounded-xl border border-[#E5E0D5] text-[11px] text-[#4A423B] space-y-1">
                <div className="font-semibold text-[#1A1817] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Statutory Rule: Prices Displayed to Customers Include GST
                </div>
                <p className="text-[#7A7167]">
                  The displayed catalog price is the total customer payable amount. The checkout and invoice show the taxable value and included tax breakdown without adding any tax surcharge.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live GST-Inclusive Simulator */}
          <div className="p-4 bg-[#F2EDE4]/60 rounded-xl border border-[#D8D0C3] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1A1817] uppercase flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#722F37]" />
                <span>Live GST-Inclusive Tax Simulator</span>
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-[#722F37] border border-[#D5CEC2]">
                Reverse Tax Math
              </span>
            </div>
            <p className="text-[11px] text-[#5A5249]">
              Verify how an inclusive selling price decomposes into taxable value and statutory tax components:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">Customer Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={simPrice}
                  onChange={(e) => setSimPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-center font-bold text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">GST Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={simGstRate}
                  onChange={(e) => setSimGstRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-center font-bold text-[#1A1817]"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#D5CEC2]">
                <div className="text-[10px] uppercase font-bold text-[#7A7167]">Taxable Base</div>
                <div className="text-sm font-bold text-[#1A1817] font-mono mt-0.5">
                  ₹{simulatedTax.taxable.toFixed(2)}
                </div>
                <div className="text-[9px] text-[#7A7167]">{simPrice} / (1 + {simGstRate}%)</div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#D5CEC2]">
                <div className="text-[10px] uppercase font-bold text-[#7A7167]">Included GST</div>
                <div className="text-sm font-bold text-[#722F37] font-mono mt-0.5">
                  ₹{simulatedTax.gst.toFixed(2)}
                </div>
                <div className="text-[9px] text-[#7A7167]">Price − Taxable Base</div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#D5CEC2]">
                <div className="text-[10px] uppercase font-bold text-[#7A7167]">Breakdown</div>
                <div className="text-[11px] text-[#1A1817] font-mono mt-0.5">
                  <div>CGST: ₹{simulatedTax.cgst.toFixed(2)}</div>
                  <div>SGST: ₹{simulatedTax.sgst.toFixed(2)}</div>
                </div>
                <div className="text-[9px] text-[#7A7167]">or IGST: ₹{simulatedTax.igst.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap gap-6 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={Boolean(settings?.enableOrderNotifications)}
                onChange={(e) => setSettings({ ...settings, enableOrderNotifications: e.target.checked })}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="font-medium text-[#1A1817]">Enable Automatic Customer Notifications</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={Boolean(settings?.enableInventoryAlerts)}
                onChange={(e) => setSettings({ ...settings, enableInventoryAlerts: e.target.checked })}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="font-medium text-[#1A1817]">Enable Low Inventory Dispatch Alerts</span>
            </label>
          </div>
        </div>

        {/* Statutory Seller Tax & GST Compliance (Rule 46 Invoice Generator) */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-5">
          <div className="border-b border-[#EAE4D9] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#722F37]" />
                <span>Seller Tax & GST Compliance Settings (Rule 46 Invoices)</span>
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Statutory business registration, GSTIN, place of supply, and sequential tax invoice numbering.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFEAE1] text-[#4A423B] border border-[#D5CEC2]">
              CGST / SGST / IGST Engine
            </span>
          </div>

          {/* Legal Business & GSTIN Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Seller Legal Business Name *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.sellerLegalName || ''}
                onChange={(e) => setSettings({ ...settings, sellerLegalName: e.target.value })}
                placeholder="e.g. Amoga Luxury Crafts Private Limited"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Appears as statutory supplier on Tax Invoices.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Trade Name
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.sellerTradeName || ''}
                onChange={(e) => setSettings({ ...settings, sellerTradeName: e.target.value })}
                placeholder="e.g. Amoga"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Seller GSTIN *
              </label>
              <input
                type="text"
                maxLength={15}
                disabled={!isSuperAdmin}
                value={settings?.sellerGstin || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
                  const pan = val.length >= 12 ? val.substring(2, 12) : settings?.sellerPan;
                  const stateCode = val.length >= 2 ? val.substring(0, 2) : settings?.sellerStateCode;
                  setSettings({ ...settings, sellerGstin: val, sellerPan: pan, sellerStateCode: stateCode });
                }}
                placeholder="33AYMPK1833D1ZQ"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">
                {/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(settings?.sellerGstin || '') ? (
                  <span className="text-emerald-700 font-semibold">✓ Valid 15-character GSTIN format</span>
                ) : settings?.sellerGstin ? (
                  <span className="text-amber-700">Format: 2 digits + 10-char PAN + 1 + Z + 1</span>
                ) : (
                  '15-digit GST Identification Number'
                )}
              </p>
            </div>
          </div>

          {/* Registration Details: State, PAN, Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Seller PAN
              </label>
              <input
                type="text"
                maxLength={10}
                disabled={!isSuperAdmin}
                value={settings?.sellerPan || ''}
                onChange={(e) => setSettings({ ...settings, sellerPan: e.target.value.toUpperCase() })}
                placeholder="AAACA1234A"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Seller State *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.sellerState || ''}
                onChange={(e) => setSettings({ ...settings, sellerState: e.target.value })}
                placeholder="e.g. Tamil Nadu"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                State Code (GST) *
              </label>
              <input
                type="text"
                maxLength={2}
                disabled={!isSuperAdmin}
                value={settings?.sellerStateCode || ''}
                onChange={(e) => setSettings({ ...settings, sellerStateCode: e.target.value })}
                placeholder="33"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Used to determine CGST/SGST vs IGST.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Pincode *
              </label>
              <input
                type="text"
                maxLength={6}
                disabled={!isSuperAdmin}
                value={settings?.sellerPincode || ''}
                onChange={(e) => setSettings({ ...settings, sellerPincode: e.target.value })}
                placeholder="600017"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
            </div>
          </div>

          {/* Registered Business Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Registered Address Line 1 *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.sellerAddressLine1 || ''}
                onChange={(e) => setSettings({ ...settings, sellerAddressLine1: e.target.value })}
                placeholder="108, Heritage Walk, Anna Salai"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.sellerAddressLine2 || ''}
                onChange={(e) => setSettings({ ...settings, sellerAddressLine2: e.target.value })}
                placeholder="T. Nagar"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
            </div>
          </div>

          {/* Invoice Numbering & Sequence */}
          <div className="p-4 bg-white rounded-xl border border-[#E5E0D5] space-y-3">
            <div className="border-b border-[#F0ECE1] pb-2">
              <h3 className="text-xs font-bold text-[#1A1817] uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#722F37]" />
                <span>GST Tax Invoice Sequence (Rule 46 Mandatory)</span>
              </h3>
              <p className="text-[10px] text-[#7A7167]">
                Consecutive serial numbers containing only alphabets, numerals, or special characters hyphen and slash.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Invoice Number Prefix *
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings?.invoicePrefix || 'AMOGA/2026-27/'}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  placeholder="AMOGA/2026-27/"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Next Sequence Number *
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!isSuperAdmin}
                  value={settings?.invoiceSequence ?? 1001}
                  onChange={(e) => setSettings({ ...settings, invoiceSequence: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                  Sample Invoice Preview
                </label>
                <div className="px-3 py-2 bg-[#FAF8F5] border border-dashed border-[#D5CEC2] rounded text-xs font-mono font-bold text-[#722F37]">
                  {settings?.invoicePrefix || 'AMOGA/2026-27/'}{String(settings?.invoiceSequence ?? 1001).padStart(4, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FSSAI Food Safety Compliance Card */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-5">
          <div className="border-b border-[#EAE4D9] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#722F37]" />
                <span>Food Safety & Standards Authority of India (FSSAI) Compliance</span>
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Statutory 14-digit FSSAI licence registration for food storefronts, product detail badges, and GST tax invoices.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Food Safety Act 2006
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                FSSAI Licence / Reg Number *
              </label>
              <input
                type="text"
                maxLength={14}
                disabled={!isSuperAdmin}
                value={settings?.fssaiLicenseNumber || ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setSettings({ ...settings, fssaiLicenseNumber: digits });
                }}
                placeholder="22425540000677"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">
                {/^[0-9]{14}$/.test(settings?.fssaiLicenseNumber || '') ? (
                  <span className="text-emerald-700 font-semibold">✓ Valid 14-digit FSSAI number</span>
                ) : settings?.fssaiLicenseNumber ? (
                  <span className="text-amber-700">Must be exactly 14 numeric digits ({settings.fssaiLicenseNumber.length}/14)</span>
                ) : (
                  '14-digit FSSAI registration number'
                )}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Licence Holder Entity Name
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.fssaiLicenseHolder || ''}
                onChange={(e) => setSettings({ ...settings, fssaiLicenseHolder: e.target.value })}
                placeholder="e.g. Amoga Luxury Private Limited"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Matching legal entity on registration document.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Licence Classification / Type
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.fssaiLicenseType || ''}
                onChange={(e) => setSettings({ ...settings, fssaiLicenseType: e.target.value })}
                placeholder="e.g. State License - E-Commerce Retail"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Licence Scope Notice / FBO Category
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.fssaiScopeNotice || ''}
                onChange={(e) => setSettings({ ...settings, fssaiScopeNotice: e.target.value })}
                placeholder="E-Commerce FBO for Packaged Dry Goods, Wellness Teas & Artisanal Infusions"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Disclosed on footer and food category detail pages.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Publishable Certificate Link (optional)
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={settings?.fssaiCertificateUrl || ''}
                onChange={(e) => setSettings({ ...settings, fssaiCertificateUrl: e.target.value })}
                placeholder="https://.../amoga-fssai-certificate.pdf"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Provide link only when verified and authorized for public viewing.</p>
            </div>
          </div>
        </div>

        {/* Return & Refund Policy Parameters */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-5">
          <div className="border-b border-[#EAE4D9] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#722F37]" />
                <span>Return, Replacement & Refund Policy Parameters</span>
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Indian Consumer Protection (E-Commerce) Rules compliant reporting windows and policy versioning.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
              Consumer Protection 2020
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Non-Perishable Return Window (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                disabled={!isSuperAdmin}
                value={settings?.returnWindowDays ?? 7}
                onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Days from delivery for sarees, silver jewellery, and crafts.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Food Damage Reporting Window (Hours) *
              </label>
              <input
                type="number"
                min="1"
                max="168"
                disabled={!isSuperAdmin}
                value={settings?.foodReturnWindowHours ?? 48}
                onChange={(e) => setSettings({ ...settings, foodReturnWindowHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Hours from delivery for transit damage or broken seal claims.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Return Policy Version *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings?.returnPolicyVersion || '2026.1'}
                onChange={(e) => setSettings({ ...settings, returnPolicyVersion: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Recorded on checkout disclosures and customer orders.</p>
            </div>
          </div>
        </div>

        {isSuperAdmin ? (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#722F37] text-white text-xs font-semibold rounded-xl hover:bg-[#5E2229] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Persisting in PostgreSQL...' : 'Save Settings'}</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#7A7167] text-right italic">
            Super Administrator privilege required to modify store business parameters.
          </p>
        )}
      </form>
      </>
      )}
    </div>
  );
}
