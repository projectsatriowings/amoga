import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminSettings() {
  const { adminFetch, admin } = useAdminStore();
  const [settings, setSettings] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load settings');
      setSettings(json.settings);
      setEnvironment(json.environment);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
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

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update settings');

      setMessage({ type: 'success', text: 'Store settings updated successfully!' });
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
        <span>Loading store settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-[#E5E0D5] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Business & Store Settings</h1>
        <p className="text-xs text-[#7A7167]">
          Configure concierge details, shipping thresholds, tax percentages, and review active infrastructure
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Infrastructure Card */}
      {environment && (
        <div className="bg-[#1E1916] text-[#E8E2D8] p-5 rounded-lg border border-[#38312B] space-y-3">
          <div className="flex items-center justify-between border-b border-[#38312B] pb-2">
            <span className="font-serif text-sm font-bold text-[#F5F2EB] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A46D]" />
              <span>Production Security & Provider Status</span>
            </span>
            <span className="text-[10px] font-mono text-[#C5A46D] uppercase">Encrypted Server Runtime</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#28211C] rounded border border-[#3D332C]">
              <span className="text-[10px] text-[#A89F93] uppercase font-mono block">Database Storage</span>
              <span className="font-semibold text-emerald-400 mt-1 block">PostgreSQL (Neon Cloud)</span>
              <span className="text-[10px] text-[#A89F93]">SSL / TLS Connected</span>
            </div>

            <div className="p-3 bg-[#28211C] rounded border border-[#3D332C]">
              <span className="text-[10px] text-[#A89F93] uppercase font-mono block">Payment Gateway</span>
              <span className="font-semibold text-[#C5A46D] mt-1 block">
                Razorpay ({environment.paymentMode})
              </span>
              <span className="text-[10px] text-[#A89F93]">Live Credentials Protected</span>
            </div>

            <div className="p-3 bg-[#28211C] rounded border border-[#3D332C]">
              <span className="text-[10px] text-[#A89F93] uppercase font-mono block">Audit Integrity</span>
              <span className="font-semibold text-[#F5F2EB] mt-1 block">Append-Only Logs</span>
              <span className="text-[10px] text-[#A89F93]">Immutable Forensic History</span>
            </div>
          </div>
        </div>
      )}

      {/* Editable Business Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            Storefront Identity & Concierge
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Store Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Contact Email</label>
              <input
                type="email"
                disabled={!isSuperAdmin}
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            Shipping & Taxation Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={settings.freeShippingThreshold || 0}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Orders above this qualify for complimentary delivery.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={settings.shippingStandardRate || 0}
                onChange={(e) => setSettings({ ...settings, shippingStandardRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A423B] uppercase mb-1">Tax / GST Rate (%)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={settings.taxPercentage || 0}
                onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded disabled:bg-stone-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={settings.enableOrderNotifications}
                onChange={(e) => setSettings({ ...settings, enableOrderNotifications: e.target.checked })}
                className="rounded border-[#D5CEC2] text-[#722F37]"
              />
              <span>Enable Automatic Customer Notifications</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={settings.enableInventoryAlerts}
                onChange={(e) => setSettings({ ...settings, enableInventoryAlerts: e.target.checked })}
                className="rounded border-[#D5CEC2] text-[#722F37]"
              />
              <span>Enable Low Inventory Dispatch Alerts</span>
            </label>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229] transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Persisting...' : 'Save Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
