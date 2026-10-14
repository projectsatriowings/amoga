import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { trackOrderApi } from '../../services/customerApi';
import { Container } from '../../components/ui/Container';
import {
  Truck,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function OrderTrackingPage() {
  const { orderReference: paramReference } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRef = searchParams.get('ref') || paramReference || '';

  const [inputRef, setInputRef] = useState(queryRef);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isMasked, setIsMasked] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async (ref, emailCred = verifyEmail) => {
    if (!ref || !ref.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trackOrderApi(ref.trim(), { email: emailCred });
      if (res && res.success) {
        setTrackingData(res.tracking);
        setIsMasked(Boolean(res.isMasked));
      } else {
        setError(res.message || 'Order tracking details not found');
        setTrackingData(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve tracking information');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryRef) {
      setInputRef(queryRef);
      fetchTracking(queryRef);
    }
  }, [queryRef]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputRef.trim()) return;
    setSearchParams({ ref: inputRef.trim() });
    fetchTracking(inputRef.trim());
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    if (!verifyEmail.trim() || !inputRef.trim()) return;
    fetchTracking(inputRef.trim(), verifyEmail.trim());
  };

  const getMilestoneIcon = (milestone) => {
    if (milestone.state === 'COMPLETED') {
      return <CheckCircle className="w-5 h-5 text-emerald-700" />;
    }
    if (milestone.state === 'CURRENT') {
      return (
        <div className="w-5 h-5 rounded-full bg-[#722F37] text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
          ✓
        </div>
      );
    }
    return <div className="w-4 h-4 rounded-full border-2 border-[#DDD5C7] bg-[#FAF8F5]" />;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-4xl mx-auto space-y-8">
        {/* Page Crest & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/20 shadow-inner mb-1">
            <Truck className="w-6 h-6 text-[#C5A46D]" />
          </div>
          <span className="block text-[11px] font-mono uppercase tracking-widest text-[#8C6320]">
            Order Tracking & Updates
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F0811]">
            Track Your Order
          </h1>
          <p className="text-xs text-[#7A7167] max-w-md mx-auto">
            Live tracking and status updates for your sarees, teas, pantry items, and silver jewellery.
          </p>
        </div>

        {/* Order Reference Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Enter Amoga Order Reference (e.g. AMOGA-ORD-2026-XXXXX)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-mono text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? <span>Searching...</span> : <span>Track Shipment</span>}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to locate tracking details</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Details View */}
        {trackingData && (
          <div className="space-y-6">
            {/* Status & Carrier Overview Card */}
            <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EFECE6] gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A7167]">
                    Order Reference
                  </span>
                  <h2 className="font-mono text-xl font-bold text-[#722F37]">
                    {trackingData.orderReference}
                  </h2>
                  <p className="text-xs text-[#7A7167] mt-0.5">
                    Placed on {new Date(trackingData.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] font-mono uppercase text-[#7A7167]">
                      Status
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/30">
                      {trackingData.status}
                    </span>
                  </div>

                  {trackingData.paymentStatus && (
                    <div className="text-right">
                      <span className="block text-[10px] font-mono uppercase text-[#7A7167]">
                        Payment
                      </span>
                      <span className="inline-block px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {trackingData.paymentStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier & Tracking Waybill Info */}
              {(trackingData.carrier || trackingData.trackingNumber) && (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 text-[#722F37] flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-[#8C6320]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#7A7167]">
                        Logistics Carrier & AWB Waybill
                      </span>
                      <p className="text-xs font-bold text-[#1F0811]">
                        {trackingData.carrier || 'Premium Courier Partner'} &bull;{' '}
                        <span className="font-mono text-[#722F37]">
                          {trackingData.trackingNumber || 'Pending Waybill'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {trackingData.trackingUrl && (
                    <a
                      href={trackingData.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1F0811] hover:bg-[#35121F] text-[#F6EBD8] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                      <span>Track on Courier Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Chronological Milestone Timeline */}
              <div className="pt-2">
                <h3 className="font-serif text-base font-bold text-[#1F0811] mb-6">
                  Fulfilment Progress
                </h3>

                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E0D7C9]">
                  {trackingData.milestones.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className="absolute -left-6 sm:-left-8 top-0.5 bg-white rounded-full p-0.5">
                        {getMilestoneIcon(step)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-xs font-bold ${
                              step.isCurrent
                                ? 'text-[#722F37]'
                                : step.isPassed
                                ? 'text-[#1A1817]'
                                : 'text-[#7A7167]'
                            }`}
                          >
                            {step.title}
                          </h4>
                          {step.isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#722F37]/10 text-[#722F37]">
                              In Progress
                            </span>
                          )}
                          {step.time && (
                            <span className="text-[11px] font-mono text-[#7A7167]">
                              {new Date(step.time).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A524A]">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Log Records */}
              {trackingData.events && trackingData.events.length > 0 && (
                <div className="pt-6 border-t border-[#EFECE6] space-y-3">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#7A7167]">
                    Order Activity Log
                  </h4>
                  <div className="space-y-2">
                    {trackingData.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DA] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                      >
                        <div>
                          <span className="font-semibold text-[#1A1817]">{ev.title}</span>
                          {ev.description && (
                            <p className="text-[11px] text-[#5A524A] mt-0.5">{ev.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#7A7167] shrink-0">
                          {new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Verification Card if Masked */}
            {isMasked && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <span>Verify Email to View Full Order Details</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  To protect your privacy, your delivery address and items are hidden. Enter the email address used during purchase to view complete details.
                </p>

                <form onSubmit={handleVerificationSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="email"
                    required
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    placeholder="Enter your order email address"
                    className="flex-1 px-4 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#2C0E1A] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#722F37] text-[#F6EBD8] text-xs font-semibold rounded-xl hover:bg-[#5E2229] transition-all"
                  >
                    View Full Details
                  </button>
                </form>
              </div>
            )}

            {/* Full Order & Delivery Details (If Verified) */}
            {!isMasked && trackingData.deliveryDestination && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Destination */}
                <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
                    <MapPin className="w-4 h-4 text-[#8C6320]" />
                    <h3 className="font-serif text-sm font-bold text-[#1F0811]">
                      Delivery Destination
                    </h3>
                  </div>

                  <div className="text-xs text-[#4A423B] space-y-1">
                    <p className="font-semibold text-sm text-[#1A1817]">
                      {trackingData.customerName}
                    </p>
                    <p>{trackingData.deliveryDestination.addressLine1}</p>
                    {trackingData.deliveryDestination.addressLine2 && (
                      <p>{trackingData.deliveryDestination.addressLine2}</p>
                    )}
                    <p>
                      {trackingData.deliveryDestination.city},{' '}
                      {trackingData.deliveryDestination.state} —{' '}
                      <span className="font-mono">{trackingData.deliveryDestination.pincode}</span>
                    </p>
                    <p className="font-mono text-[#7A7167] pt-1">
                      Phone: {trackingData.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
                    <Package className="w-4 h-4 text-[#8C6320]" />
                    <h3 className="font-serif text-sm font-bold text-[#1F0811]">
                      Artisanal Items ({trackingData.items?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {trackingData.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                        <div>
                          <p className="font-medium text-[#1A1817]">{item.productName}</p>
                          <span className="text-[11px] text-[#7A7167] font-mono">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <span className="font-medium text-[#1A1817] tabular-nums">
                          ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {trackingData.financialTotals && (
                    <div className="pt-3 border-t border-[#EFECE6] flex justify-between text-xs font-bold text-[#1A1817]">
                      <span>Order Total:</span>
                      <span className="text-sm font-bold text-[#722F37] tabular-nums">
                        ₹{trackingData.financialTotals.totalAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
