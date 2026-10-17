import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Printer,
  Share2,
  Barcode,
  Percent,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Info,
  ExternalLink,
  MapPin,
  Lock,
  Smartphone,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';

export function AdminPosSettings() {
  const [settings, setSettings] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    posPrefix: '',
    defaultStallId: '',
    enableBarcodeScanner: true,
    enableThermalPrint: true,
    receiptPrinterWidth: '80mm',
    enableWhatsAppReceipt: true,
    whatsAppChannel: 'MANUAL',
    maxDiscountPercentWithoutApproval: 15,
    requireCustomerPhone: false,
  });

  const [isCloudApiConfigured, setIsCloudApiConfigured] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [settRes, evRes] = await Promise.all([
          posApi.getSettings(),
          posApi.listEvents('ACTIVE'),
        ]);

        if (settRes?.settings) {
          setSettings(settRes.settings);
          setIsCloudApiConfigured(settRes.settings.isCloudApiConfigured || false);
          setFormData({
            posPrefix: settRes.settings.posPrefix || `AMOGA-POS-${new Date().getFullYear()}/`,
            defaultStallId: settRes.settings.defaultStallId || '',
            enableBarcodeScanner: settRes.settings.enableBarcodeScanner ?? true,
            enableThermalPrint: settRes.settings.enableThermalPrint ?? true,
            receiptPrinterWidth: settRes.settings.receiptPrinterWidth || '80mm',
            enableWhatsAppReceipt: settRes.settings.enableWhatsAppReceipt ?? true,
            whatsAppChannel: settRes.settings.whatsAppChannel || 'MANUAL',
            maxDiscountPercentWithoutApproval: settRes.settings.maxDiscountPercentWithoutApproval || 15,
            requireCustomerPhone: settRes.settings.requireCustomerPhone ?? false,
          });
        }

        if (evRes?.events) {
          setEvents(evRes.events);
        }
      } catch (err) {
        console.error('Failed to load POS settings:', err);
        setErrorMsg('Failed to load POS settings.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await posApi.updateSettings(formData);
      if (res?.settings) {
        setSettings(res.settings);
        setSuccessMsg('POS Atelier settings updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Update error:', err);
      setErrorMsg(err.message || 'Failed to update settings. Super Admin access required.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-500">
        <div className="w-8 h-8 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading POS Settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#762F39] to-[#5C232B] flex items-center justify-center text-white shadow-md">
            <Sliders className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              POS Settings & Permissions
            </h1>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Receipt layouts, barcode scanners, statutory numbering, discount approval thresholds, and WhatsApp channel.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Numbering & Stalls */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-stone-900 font-serif font-bold text-base">
            <ShieldCheck className="w-4 h-4 text-[#762F39]" />
            <span>Sequential Bill Numbering & Stall Venue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Bill Number Prefix
              </label>
              <input
                type="text"
                value={formData.posPrefix}
                onChange={(e) => setFormData({ ...formData, posPrefix: e.target.value })}
                placeholder="e.g. AMOGA-POS-2026/"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:ring-1 focus:ring-[#762F39] focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Generated bills will increment atomically: <code>{formData.posPrefix}0001</code>, <code>{formData.posPrefix}0002</code>.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Default Stall / Event
              </label>
              <select
                value={formData.defaultStallId}
                onChange={(e) => setFormData({ ...formData, defaultStallId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="">Direct Stall (Default)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.city})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Determines the default place of supply and intra vs inter-state GST calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Printer & Barcode Scanning */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-stone-900 font-serif font-bold text-base">
            <Printer className="w-4 h-4 text-[#762F39]" />
            <span>Hardware & Hardware Receipt Preferences</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Receipt Printer Width Format
              </label>
              <select
                value={formData.receiptPrinterWidth}
                onChange={(e) => setFormData({ ...formData, receiptPrinterWidth: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="80mm">80mm Thermal Receipt (Standard POS Roll)</option>
                <option value="58mm">58mm Thermal Receipt (Compact Mobile Roll)</option>
                <option value="a4">Standard A4 Sheet (Laser / Inkjet Paper)</option>
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Receipt printing adjusts column spacing and font sizing dynamically for the chosen printer roll.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableBarcodeScanner}
                  onChange={(e) => setFormData({ ...formData, enableBarcodeScanner: e.target.checked })}
                  className="rounded border-stone-300 text-[#762F39] focus:ring-[#762F39]"
                />
                <span className="font-semibold text-stone-800">Enable Barcode Scanner Auto-Submit</span>
              </label>
              <p className="text-[11px] text-stone-500 pl-6">
                When enabled, USB or Bluetooth barcode scanner keypresses automatically look up products and add to cart without manual clicking.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Invoice Delivery */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Invoice Delivery Channel</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                isCloudApiConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isCloudApiConfigured ? 'Meta Cloud API Configured' : 'Direct Dispatch Fallback Mode'}
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
            <p className="font-semibold text-stone-800">Channel Integration Status:</p>
            {isCloudApiConfigured ? (
              <p className="text-emerald-700">
                Official Meta WhatsApp Cloud API credentials detected in environment. POS bills will be dispatched automatically via verified template.
              </p>
            ) : (
              <p className="text-stone-600 leading-relaxed">
                Cloud API credentials (<code>WHATSAPP_API_TOKEN</code> & <code>WHATSAPP_PHONE_NUMBER_ID</code>) are not configured in environment. The system will use <strong>Verified Direct WhatsApp Dispatch</strong>, which opens WhatsApp Web or mobile app with a pre-filled, formatted invoice message and cryptographically unguessable receipt URL with 1-click.
              </p>
            )}

            <div className="pt-2 text-[11px] text-stone-500">
              <p className="font-medium text-stone-700">Privacy & Statutory Policy:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Validates 10-digit Indian (+91) mobile numbers strictly.</li>
                <li>Customer consent is obtained at checkout; includes mandatory opt-out disclaimer ("reply STOP").</li>
                <li>Transactional bill messages do not enroll customers in marketing without explicit opt-in.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="requirePhone"
              checked={formData.requireCustomerPhone}
              onChange={(e) => setFormData({ ...formData, requireCustomerPhone: e.target.checked })}
              className="rounded border-stone-300 text-[#762F39] focus:ring-[#762F39]"
            />
            <label htmlFor="requirePhone" className="text-xs font-semibold text-stone-800 cursor-pointer">
              Require customer mobile number for every stall bill
            </label>
          </div>
        </div>

        {/* Section 4: Discount Authorization & Security */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-stone-900 font-serif font-bold text-base">
            <Percent className="w-4 h-4 text-[#762F39]" />
            <span>Discount Authorization & Governance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Max Discount Without Manager Approval (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.maxDiscountPercentWithoutApproval}
                onChange={(e) => setFormData({ ...formData, maxDiscountPercentWithoutApproval: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:ring-1 focus:ring-[#762F39] focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Discounts exceeding this threshold cannot be applied by stall cashiers unless approved by a Store Manager or Super Admin.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#762F39] hover:bg-[#8C3A46] text-white text-xs font-semibold shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save POS Settings</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
