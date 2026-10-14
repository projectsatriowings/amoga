import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackOrderApi } from '../../services/customerApi';
import { Container } from '../../components/ui/Container';
import {
  Truck,
  Search,
  Check,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Package,
  ChevronRight,
} from 'lucide-react';

/**
 * Helper to format timestamps cleanly as "14 Oct 2026, 11:40 am"
 */
function formatMilestoneTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();

  return `${datePart}, ${timePart}`;
}

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

  // Detect user preference for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (e) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

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

  const isDelivered = trackingData?.status === 'DELIVERED';
  const isCancelled = trackingData?.status === 'CANCELLED';

  // Compute active milestone index (from 0 to milestones.length - 1)
  const activeMilestoneIndex = useMemo(() => {
    if (!trackingData?.milestones || trackingData.milestones.length === 0) return 0;
    if (isDelivered) return trackingData.milestones.length - 1;

    const explicitIdx = trackingData.milestones.findIndex((m) => m.isCurrent);
    if (explicitIdx !== -1) return explicitIdx;

    const lastCompletedIdx = trackingData.milestones.reduce((acc, m, idx) => {
      return m.state === 'COMPLETED' || m.isPassed ? idx : acc;
    }, -1);

    if (lastCompletedIdx === -1) return 0;
    if (lastCompletedIdx < trackingData.milestones.length - 1) return lastCompletedIdx + 1;
    return lastCompletedIdx;
  }, [trackingData, isDelivered]);

  // Height percentage of the green connector fill line
  const fillProgressPercent = useMemo(() => {
    if (!trackingData?.milestones || trackingData.milestones.length <= 1) return 0;
    if (isDelivered) return 100;
    if (isCancelled) return 0;

    const totalSteps = trackingData.milestones.length - 1;
    const completedCount = trackingData.milestones.filter(
      (m, idx) => m.state === 'COMPLETED' || (idx < activeMilestoneIndex && m.isPassed)
    ).length;

    return Math.min(100, Math.max(0, Math.round((completedCount / totalSteps) * 100)));
  }, [trackingData, isDelivered, isCancelled, activeMilestoneIndex]);

  // Resolve active status badge text
  const getActiveBadgeLabel = (step, idx) => {
    if (trackingData?.status === 'PENDING_PAYMENT' && idx === 0) return 'Awaiting Payment';
    if (trackingData?.status === 'PENDING_CONFIRMATION' && idx === 0) return 'Verifying Order';
    if (step.key === 'PROCESSING') return 'Processing';
    if (step.key === 'DISPATCHED') return 'In Transit';
    return 'In Progress';
  };

  // Render milestone icon
  const renderMilestoneIcon = (step, isCompleted, isActive) => {
    // 1. Completed state: refined green circle with white checkmark
    if (isCompleted) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2E6B47] text-white flex items-center justify-center shadow-xs border-2 border-white shrink-0">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }

    // 2. Active / In-progress state: deep burgundy circle with restrained pulse
    if (isActive) {
      return (
        <div className="relative flex items-center justify-center shrink-0">
          {!prefersReducedMotion && (
            <span className="absolute -inset-1 rounded-full bg-[#722F37]/15 animate-pulse pointer-events-none" />
          )}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#722F37] text-white flex items-center justify-center shadow-sm border-2 border-white ring-4 ring-[#722F37]/15">
            {step.key === 'CONFIRMED' && <ShieldCheck className="w-4 h-4 text-white" />}
            {step.key === 'PROCESSING' && <Package className="w-4 h-4 text-white" />}
            {step.key === 'DISPATCHED' && <Truck className="w-4 h-4 text-white" />}
            {step.key === 'DELIVERED' && <Check className="w-4 h-4 text-white" />}
            {!['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].includes(step.key) && (
              <Clock className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      );
    }

    // 3. Upcoming / Pending state: muted neutral icon with subtle center dot
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#D6CFC4] bg-[#FAF8F5] text-[#9E988F] flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#D6CFC4]" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F0811] pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#7A7167]">
          <Link to="/" className="hover:text-[#722F37] hover:underline">
            Portal
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <Link to="/account" className="hover:text-[#722F37] hover:underline">
            Account
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="font-semibold text-[#1F0811]">Order Tracking</span>
        </div>

        {/* Order Reference Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 sm:p-5 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Enter Amoga Order Reference (e.g. AMOGA-ORD-2026-XXXXX)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-mono text-[#1F0811] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#722F37] hover:bg-[#5E2229] active:scale-[0.99] text-[#F6EBD8] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Retrieving...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-12 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-base text-[#1F0811]">Consulting Atelier Records...</p>
            <p className="text-xs text-[#7A7167]">Retrieving authoritative milestone and courier dispatch updates.</p>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to locate tracking details</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Details View */}
        {trackingData && !loading && (
          <div className="space-y-8">
            {/* Main Order Tracking Card */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 sm:p-10 lg:p-12 space-y-8">
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#8C6320] font-semibold block">
                      ORDER TRACKING
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1F0811] font-normal tracking-tight">
                      Your Order Journey
                    </h2>
                    <p className="text-xs sm:text-sm text-[#7A7167] font-sans leading-relaxed max-w-xl">
                      From our artisans to your doorstep, here's where your order stands.
                    </p>
                  </div>

                  {/* Order Reference & Status Badges */}
                  <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">Reference</span>
                      <span className="font-mono text-xs font-bold text-[#1F0811]">
                        {trackingData.orderReference}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDelivered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#2E6B47]/10 text-[#2E6B47] border border-[#2E6B47]/25">
                          <Check className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/25">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#722F37] opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#722F37]" />
                          </span>
                          <span>{trackingData.status.replace(/_/g, ' ')}</span>
                        </span>
                      )}

                      {trackingData.paymentStatus && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#FAF8F5] text-[#7A7167] border border-[#E8E2D8]">
                          {trackingData.paymentStatus}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-[#7A7167] font-sans">
                      Placed on{' '}
                      {new Date(trackingData.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Courier & AWB Banner if Shipped */}
                {(trackingData.carrier || trackingData.trackingNumber) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-[#1F0811]">
                      <Truck className="w-4 h-4 text-[#8C6320] shrink-0" />
                      <span>
                        Logistics Carrier: <strong>{trackingData.carrier || 'Premium Courier Partner'}</strong>
                        {trackingData.trackingNumber && (
                          <>
                            {' '}&bull; Waybill / AWB:{' '}
                            <span className="font-mono text-[#722F37] font-semibold">
                              {trackingData.trackingNumber}
                            </span>
                          </>
                        )}
                      </span>
                    </div>

                    {trackingData.trackingUrl && (
                      <a
                        href={trackingData.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#722F37] hover:text-[#5E2229] underline shrink-0"
                      >
                        <span>Courier Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Thin Divider separating Header from Progress Timeline */}
              <div className="border-b border-[#EFECE6]" />

              {/* Professional Vertical Timeline */}
              <div className="relative pt-2">
                {/* Continuous Vertical Connector Line Behind Icons */}
                <div
                  className="absolute left-4 sm:left-[18px] top-4 sm:top-5 bottom-4 sm:bottom-5 w-[2px] -translate-x-1/2 bg-[#E8E2D8]"
                  aria-hidden="true"
                />

                {/* Progressively Filled Green Connector Line */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${fillProgressPercent}%` }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute left-4 sm:left-[18px] top-4 sm:top-5 w-[2px] -translate-x-1/2 bg-[#2E6B47] origin-top"
                  aria-hidden="true"
                />

                {/* Milestone Nodes */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: prefersReducedMotion ? 0 : 0.08,
                        delayChildren: prefersReducedMotion ? 0 : 0.04,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="space-y-6 sm:space-y-8 relative z-10"
                >
                  {trackingData.milestones.map((step, idx) => {
                    // Delivery completion rule: when order is DELIVERED, all steps including Delivered are COMPLETED
                    const isCompleted =
                      isDelivered ||
                      step.state === 'COMPLETED' ||
                      (idx < activeMilestoneIndex && step.isPassed);

                    // Active state: only true if order is NOT delivered and step is the current status
                    const isActive =
                      !isDelivered &&
                      !isCancelled &&
                      (step.isCurrent || idx === activeMilestoneIndex);

                    const formattedTime = formatMilestoneTime(step.time);

                    return (
                      <motion.div
                        key={step.key || idx}
                        variants={{
                          hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.35, ease: 'easeOut' },
                          },
                        }}
                        className="flex items-start gap-4 sm:gap-6 relative"
                      >
                        {/* Icon Column — Exactly Centered on the Connector Track */}
                        <div className="w-8 sm:w-9 flex items-center justify-center shrink-0 pt-0.5">
                          {renderMilestoneIcon(step, isCompleted, isActive)}
                        </div>

                        {/* Content Column */}
                        <div
                          className={`flex-1 min-w-0 transition-all rounded-2xl ${
                            isActive
                              ? 'bg-[#FAF2F4] border border-[#722F37]/15 border-l-4 border-l-[#722F37] p-4 sm:p-5 shadow-2xs'
                              : 'p-2 sm:p-2.5'
                          }`}
                        >
                          {/* Row 1: Title, Status Badge, and Desktop Timestamp */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3
                                className={`font-serif text-base sm:text-lg ${
                                  isActive
                                    ? 'font-bold text-[#722F37]'
                                    : isCompleted
                                    ? 'font-medium text-[#1F0811]'
                                    : 'font-normal text-[#8A8177]'
                                }`}
                              >
                                {step.title}
                              </h3>

                              {/* Status Badges */}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#2E6B47]/10 text-[#2E6B47] border border-[#2E6B47]/20">
                                  Completed
                                </span>
                              )}

                              {isActive && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/25">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#722F37] animate-pulse" />
                                  <span>{getActiveBadgeLabel(step, idx)}</span>
                                </span>
                              )}

                              {!isCompleted && !isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-[#9E988F] bg-[#FAF8F5] border border-[#E5DFD5]">
                                  Pending
                                </span>
                              )}
                            </div>

                            {/* Timestamp for Desktop (Right Aligned) */}
                            {formattedTime && (
                              <span className="hidden sm:inline-block ml-auto text-xs font-mono text-[#7A7167] shrink-0">
                                {formattedTime}
                              </span>
                            )}
                          </div>

                          {/* Timestamp for Mobile (Placed neatly beneath title) */}
                          {formattedTime && (
                            <span className="sm:hidden block text-[11px] font-mono text-[#7A7167] mt-0.5">
                              {formattedTime}
                            </span>
                          )}

                          {/* Row 2: Milestone Description */}
                          <p
                            className={`text-xs sm:text-sm font-sans leading-relaxed mt-1.5 ${
                              isActive
                                ? 'text-[#3E1B23]'
                                : isCompleted
                                ? 'text-[#5A524A]'
                                : 'text-[#8A8177]'
                            }`}
                          >
                            {step.description}
                          </p>

                          {/* Extra Shipped details if in transit */}
                          {step.key === 'DISPATCHED' && trackingData.carrier && (
                            <div className="mt-2 text-[11px] font-mono text-[#7A7167]">
                              Handled by <strong>{trackingData.carrier}</strong>
                              {trackingData.trackingNumber && ` • AWB: ${trackingData.trackingNumber}`}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Order Activity Log Section */}
              {trackingData.events && trackingData.events.length > 0 && (
                <div className="pt-8 border-t border-[#EFECE6] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#7A7167] font-semibold">
                      ORDER ACTIVITY LOG
                    </span>
                    <span className="text-[11px] font-mono text-[#8C6320] bg-[#FAF8F5] border border-[#E8E2D8] px-2.5 py-0.5 rounded-full">
                      {trackingData.events.length} {trackingData.events.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {trackingData.events.map((ev, evIdx) => (
                      <div
                        key={ev.id || evIdx}
                        className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-all ${
                          evIdx === 0
                            ? 'bg-[#FAF8F5] border-[#C5A46D]/35'
                            : 'bg-white border-[#E8E2D8]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1F0811]">{ev.title}</span>
                            {evIdx === 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#2E6B47]/10 text-[#2E6B47] border border-[#2E6B47]/20">
                                Latest
                              </span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-[11px] text-[#5A524A] mt-0.5">{ev.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#7A7167] shrink-0">
                          {formatMilestoneTime(ev.createdAt) || new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Verification Card if Masked */}
            {isMasked && (
              <div className="bg-amber-50/70 rounded-3xl border border-amber-200/80 p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900 font-serif font-bold text-base">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <span>Verify Email to View Full Order Details</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-sans max-w-2xl">
                  To protect your privacy, your recipient address and item breakdown are masked. Enter the email address used during purchase to verify ownership.
                </p>

                <form onSubmit={handleVerificationSubmit} className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md">
                  <input
                    type="email"
                    required
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    placeholder="Enter your customer order email"
                    className="flex-1 px-4 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#1F0811] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#722F37] text-[#F6EBD8] text-xs font-semibold rounded-xl hover:bg-[#5E2229] transition-all cursor-pointer"
                  >
                    Verify Access
                  </button>
                </form>
              </div>
            )}

            {/* Full Order & Delivery Details (If Verified) */}
            {!isMasked && trackingData.deliveryDestination && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Destination */}
                <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
                    <MapPin className="w-4 h-4 text-[#8C6320]" />
                    <h3 className="font-serif text-sm font-bold text-[#1F0811]">
                      Delivery Destination
                    </h3>
                  </div>

                  <div className="text-xs text-[#5A524A] space-y-1">
                    <p className="font-semibold text-sm text-[#1F0811]">
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
                <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
                    <Package className="w-4 h-4 text-[#8C6320]" />
                    <h3 className="font-serif text-sm font-bold text-[#1F0811]">
                      Artisanal Items ({trackingData.items?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {trackingData.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                        <div>
                          <p className="font-medium text-[#1F0811]">{item.productName}</p>
                          <span className="text-[11px] text-[#7A7167] font-mono">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <span className="font-medium text-[#1F0811] tabular-nums">
                          ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {trackingData.financialTotals && (
                    <div className="pt-3 border-t border-[#EFECE6] flex justify-between text-xs font-bold text-[#1F0811]">
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
