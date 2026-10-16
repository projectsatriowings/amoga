import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, Building, Receipt, FileText } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminSettings() {
  const { adminFetch, admin } = useAdminStore();
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminFetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load store settings');
      setSettings(json.settings);
      setHealth(json.health);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="border-b border-[#E5E0D5] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Business & Store Settings</h1>
        <p className="text-xs text-[#7A7167]">
          Configure concierge details, shipping thresholds, tax percentages, and review truthful infrastructure health
        </p>
      </div>

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

        {/* Shipping & Taxation Rules */}
        <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            Shipping & Taxation Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Free Shipping Threshold (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={!isSuperAdmin}
                value={settings?.freeShippingThreshold ?? 2000}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Orders at or above this qualify for complimentary delivery.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Standard Shipping Fee (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={!isSuperAdmin}
                value={settings?.shippingStandardRate ?? 0}
                onChange={(e) => setSettings({ ...settings, shippingStandardRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Applied when cart is below free threshold.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Tax / GST Rate (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                disabled={!isSuperAdmin}
                value={settings?.taxPercentage ?? 5}
                onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono text-[#1A1817]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Inclusive GST applied across craft products.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 text-xs">
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
                placeholder="33AAACA1234A1Z5"
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
    </div>
  );
}
