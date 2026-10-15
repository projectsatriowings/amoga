import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { fetchOrderApi } from '../../services/checkoutApi';
import { formatINR } from '../../utils/pricing';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  UtensilsCrossed,
  Sparkles,
  Gem,
  Leaf,
  Info,
  Calendar,
  Truck,
  FileText,
  Database,
  User,
} from 'lucide-react';

export const DemoOrderConfirmation = () => {
  const { orderId } = useParams();
  const storeLastCompletedOrder = useStore(
    (state) => state.lastCompletedOrder || state.checkout?.lastCompletedOrder
  );

  // Retrieve cached order from session storage if page was refreshed
  let cachedSessionOrder = null;
  if (typeof window !== 'undefined' && orderId) {
    try {
      const stored = sessionStorage.getItem(`amoga_last_completed_order_${orderId}`);
      if (stored) {
        cachedSessionOrder = JSON.parse(stored);
      }
    } catch {
      // Non-blocking
    }
  }

  const lastCompletedOrder = (storeLastCompletedOrder?.orderId === orderId || storeLastCompletedOrder?.orderReference === orderId)
    ? storeLastCompletedOrder
    : cachedSessionOrder;

  const [dbOrder, setDbOrder] = useState(null);

  // Securely retrieve guest access token from session storage or active Zustand state
  let guestToken = null;
  try {
    guestToken = typeof window !== 'undefined' ? sessionStorage.getItem(`amoga_guest_token_${orderId}`) : null;
  } catch {
    // Non-blocking
  }
  if (!guestToken && (lastCompletedOrder?.orderId === orderId || lastCompletedOrder?.orderReference === orderId)) {
    guestToken = lastCompletedOrder.guestAccessToken;
  }

  useEffect(() => {
    let isMounted = true;
    // If order reference is a persistent order and token is provided, fetch from PostgreSQL backend
    if (orderId && orderId.startsWith('AMOGA-ORD-') && guestToken) {
      fetchOrderApi(orderId, guestToken)
        .then((order) => {
          if (isMounted) setDbOrder(order);
        })
        .catch((err) => {
          console.warn('Could not load order from backend:', err.message);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [orderId, guestToken]);

  // Determine active display order
  const activeOrder = dbOrder || (lastCompletedOrder?.orderId === orderId ? lastCompletedOrder : null);
  const hasMatchingOrder = Boolean(activeOrder);
  const isPersistent = Boolean(dbOrder || (activeOrder && activeOrder.orderReference));
  const isPaid = activeOrder?.paymentStatus === 'SUCCEEDED';
  const latestPaymentRef = activeOrder?.payments?.[0]?.paymentReference || activeOrder?.paymentReference;

  // Check if orderId follows standard demo or real reference convention
  const isDemoFormat = typeof orderId === 'string' && (orderId.startsWith('AMOGA-DEMO-') || orderId.startsWith('AMOGA-ORD-'));

  return (
    <div className="min-h-screen bg-[var(--collection-page-bg)] text-[var(--collection-text)] pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[var(--collection-text-muted)]">
            <li>
              <Link to="/" className="hover:text-[var(--collection-accent)] transition-colors">
                Portal
              </Link>
            </li>
            <li>
              <span className="text-[var(--collection-border)]">/</span>
            </li>
            <li className="text-[var(--collection-accent)] font-semibold" aria-current="page">
              Order Confirmation
            </li>
          </ol>
        </nav>

        {hasMatchingOrder ? (
          /* Active Order Snapshot View */
          <div className="space-y-8">
            {/* Header Hero Card */}
            <div className="bg-[var(--collection-card-bg)] rounded-3xl p-6 sm:p-10 border border-[var(--collection-border)] shadow-sm text-center transition-colors">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-[#166534] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                  isPaid
                    ? 'bg-emerald-50 text-[#166534] border-emerald-300'
                    : isPersistent
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-[#166534] border-emerald-300'
                }`}>
                  {isPaid ? (
                    <Database className="w-3.5 h-3.5 text-[#166534]" />
                  ) : isPersistent ? (
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-[#166534]" />
                  )}
                  {isPaid
                    ? 'Payment Captured (Test Mode)'
                    : isPersistent
                    ? 'Persistent Order (Payment Pending)'
                    : 'Simulated Order Completed'}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[var(--collection-heading)] mt-1">
                {isPaid
                  ? 'Order Confirmed & Payment Verified'
                  : isPersistent
                  ? 'Order Placed (Awaiting Payment)'
                  : 'Order Confirmation'}
              </h1>

              <div className="mt-4 p-3 bg-[var(--collection-section-bg)] inline-block rounded-xl border border-[var(--collection-border)]">
                <span className="text-xs text-[var(--collection-text-muted)] uppercase tracking-widest block font-medium">
                  Authoritative Order Reference
                </span>
                <span className="font-mono text-base sm:text-lg font-bold text-[var(--collection-accent)]">
                  {orderId}
                </span>
              </div>

              {/* Action Buttons: Track Order & My Account */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={`/track/${encodeURIComponent(orderId)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-bold uppercase tracking-wider shadow-md transition-all hover:scale-105"
                >
                  <Truck className="w-4 h-4 text-[#C5A46D]" />
                  <span>Track Order Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/account?tab=orders"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#2C0E1A] border border-[#DDD5C7] text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-[#8C6320]" />
                  <span>View in My Account</span>
                </Link>
              </div>

              {/* Explicit Test Mode Disclaimer */}
              <div className="mt-6 p-4 max-w-2xl mx-auto bg-amber-50 rounded-2xl border border-amber-300/80 text-left text-xs sm:text-sm text-amber-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold text-amber-900">
                    Payment Architecture — Test Mode Disclosure
                  </p>
                  <p className="mt-1 text-amber-800/90 text-xs">
                    {isPaid
                      ? 'This order was confirmed via the server-side payment verification pipeline using the isolated Test Provider adapter. A cryptographically verified HMAC signature validated the transaction. No live banking card or money was charged.'
                      : 'This order is saved in the database but payment has not yet been completed. Live gateway integration is pending client provider selection.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Destination Snapshot */}
              <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm text-xs transition-colors">
                <div className="flex items-center gap-2 text-[var(--collection-accent)] pb-3 border-b border-[var(--collection-border)] mb-4">
                  <Truck className="w-4 h-4" />
                  <h2 className="font-serif text-base font-semibold text-[var(--collection-heading)]">
                    Delivery Recipient Details
                  </h2>
                </div>

                <div className="space-y-1 text-[var(--collection-text-muted)]">
                  <p className="font-bold text-sm text-[var(--collection-text)] break-words">
                    {activeOrder.customer?.fullName || 'Valued Customer'}
                  </p>
                  <p className="break-words">{activeOrder.customer?.email}</p>
                  <p>{activeOrder.customer?.phone}</p>
                  <div className="pt-2 text-[var(--collection-text-muted)]">
                    <p className="break-words text-[var(--collection-text)]">{activeOrder.customer?.addressLine1}</p>
                    {activeOrder.customer?.addressLine2 && (
                      <p className="break-words text-[var(--collection-text)]">{activeOrder.customer?.addressLine2}</p>
                    )}
                    <p>
                      {activeOrder.customer?.city}, {activeOrder.customer?.state} -{' '}
                      <strong className="text-[var(--collection-text)]">{activeOrder.customer?.pincode}</strong>
                    </p>
                  </div>
                  {activeOrder.customer?.instructions && (
                    <p className="pt-2 italic text-[var(--collection-text-muted)] bg-[var(--collection-section-bg)] p-2 rounded-lg border border-[var(--collection-border)] break-words">
                      Instructions: &ldquo;{activeOrder.customer.instructions}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Order Meta Snapshot */}
              <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm text-xs transition-colors">
                <div className="flex items-center gap-2 text-[var(--collection-accent)] pb-3 border-b border-[var(--collection-border)] mb-4">
                  <Calendar className="w-4 h-4" />
                  <h2 className="font-serif text-base font-semibold text-[var(--collection-heading)]">
                    Order & Payment Lifecycle
                  </h2>
                </div>

                <div className="space-y-2.5 text-[var(--collection-text-muted)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--collection-text-muted)]">Created At:</span>
                    <span className="font-medium text-[var(--collection-text)]">
                      {new Date(activeOrder.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--collection-text-muted)]">Order Status:</span>
                    <span className="font-semibold text-emerald-500 font-sans">
                      {activeOrder.status || 'CONFIRMED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--collection-text-muted)]">Payment Status:</span>
                    <span className={`font-semibold font-sans ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {activeOrder.paymentStatus || (isPaid ? 'SUCCEEDED' : 'PENDING')}
                    </span>
                  </div>
                  {latestPaymentRef && (
                    <div className="flex justify-between">
                      <span className="text-[var(--collection-text-muted)]">Payment Attempt:</span>
                      <span className="font-mono text-[11px] text-[var(--collection-text)]">
                        {latestPaymentRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--collection-text-muted)]">Provider Mode:</span>
                    <span className="font-medium text-[var(--collection-text-muted)]">
                      Test Adapter (Dev Mode)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--collection-border)]">
                    <span className="font-semibold text-[var(--collection-heading)]">Paid Total:</span>
                    <span className="font-sans text-base font-bold text-[var(--collection-accent)] tabular-nums">
                      {formatINR(activeOrder.totals?.totalAmount || activeOrder.totals?.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Snapshot */}
            <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm transition-colors">
              <div className="flex items-center gap-2 text-[var(--collection-accent)] pb-3 border-b border-[var(--collection-border)] mb-4">
                <FileText className="w-4 h-4" />
                <h2 className="font-serif text-base font-semibold text-[var(--collection-heading)]">
                  Items in Order ({activeOrder.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-[var(--collection-border)] text-xs">
                {(activeOrder.items || []).map((item, idx) => (
                  <div key={item.lineId || item.id || idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name || item.productName}
                          className="w-12 h-12 object-cover rounded-lg border border-[var(--collection-border)] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--collection-accent)]">
                          {item.collectionId || item.collectionName || 'Collection'}
                        </span>
                        <h3 className="font-medium text-[var(--collection-text)] break-words">
                          {item.name || item.productName}
                        </h3>
                        {(item.selectedVariant?.name || item.variantName) && (
                          <p className="text-[10px] text-[var(--collection-text-muted)]">
                            {item.selectedVariant?.name || item.variantName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[var(--collection-text-muted)]">
                        Qty: {item.quantity} × {formatINR(item.price || item.unitPrice || 0)}
                      </span>
                      <p className="font-semibold text-[var(--collection-text)] font-sans tabular-nums">
                        {formatINR(item.lineTotal || (item.price || item.unitPrice || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Graceful Unknown / Expired Reference View */
          <div className="bg-[var(--collection-card-bg)] rounded-3xl p-8 sm:p-12 border border-[var(--collection-border)] shadow-sm text-center max-w-2xl mx-auto transition-colors">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--collection-heading)] mb-2">
              {isDemoFormat ? 'Order Reference Notice' : 'Unknown Reference Identifier'}
            </h1>

            <div className="my-4 p-3 bg-[var(--collection-section-bg)] inline-block rounded-xl border border-[var(--collection-border)]">
              <span className="text-xs text-[var(--collection-text-muted)] uppercase tracking-widest block font-medium">
                Provided Identifier
              </span>
              <span className="font-mono text-base font-bold text-[var(--collection-text)]">
                {orderId || 'None'}
              </span>
            </div>

            <p className="text-sm text-[var(--collection-text-muted)] leading-relaxed mb-6">
              {isDemoFormat
                ? 'This reference identifier was generated during a previous checkout session. Session details are cached in browser memory or retrieved via your guest access token.'
                : 'No recorded order was found for this identifier in your current browser session.'}
            </p>

            <Link
              to="/cart"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-[var(--collection-accent)] text-[var(--collection-btn-text,#FFFFFF)] text-sm font-medium hover:bg-[var(--collection-accent-hover)] transition-all shadow-md"
            >
              Go to Shopping Bag
            </Link>
          </div>
        )}

        {/* Collection Discovery Hub: All 4 Houses (Food, Tea, Sarees, Jewellery) */}
        <div className="mt-14 pt-10 border-t border-[var(--collection-border)]">
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--collection-heading)] text-center mb-2">
            Continue Exploring Amoga Collections
          </h2>
          <p className="text-center text-xs sm:text-sm text-[var(--collection-text-muted)] mb-8">
            Experience our hand-crafted offerings across all four artisanal houses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Wholesome Pantry */}
            <Link
              to="/food"
              className="group p-5 rounded-2xl bg-[var(--collection-card-bg)] border border-[var(--collection-border)] hover:border-[#3F7B43] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#3F7B43]/15 text-[#3F7B43] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[var(--collection-heading)] group-hover:text-[#3F7B43] transition-colors">
                  Wholesome Pantry
                </h3>
                <p className="text-xs text-[var(--collection-text-muted)] mt-1">
                  Comforting soup mixes, nourishing millet blends and flavourful rice podis
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#3F7B43] uppercase tracking-wider gap-1">
                <span>Explore Pantry</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Wellness Tea */}
            <Link
              to="/tea"
              className="group p-5 rounded-2xl bg-[var(--collection-card-bg)] border border-[var(--collection-border)] hover:border-[#8C6320] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#8C6320]/15 text-[#8C6320] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[var(--collection-heading)] group-hover:text-[#8C6320] transition-colors">
                  Wellness Tea
                </h3>
                <p className="text-xs text-[var(--collection-text-muted)] mt-1">
                  Thoughtfully selected botanical teas and herbal infusions for your everyday ritual
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#8C6320] uppercase tracking-wider gap-1">
                <span>Explore Tea</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Heritage Sarees */}
            <Link
              to="/sarees"
              className="group p-5 rounded-2xl bg-[var(--collection-card-bg)] border border-[var(--collection-border)] hover:border-[#C5A46D] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#C5A46D]/20 text-[#C5A46D] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[var(--collection-heading)] group-hover:text-[#C5A46D] transition-colors">
                  Heritage Sarees
                </h3>
                <p className="text-xs text-[var(--collection-text-muted)] mt-1">
                  Kanchipuram, Banarasi zari & pure mulberry silks
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#C5A46D] uppercase tracking-wider gap-1">
                <span>Explore Sarees</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 4. Silver Jewellery */}
            <Link
              to="/jewellery"
              className="group p-5 rounded-2xl bg-[var(--collection-card-bg)] border border-[var(--collection-border)] hover:border-[#94A3B8] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#94A3B8]/20 text-[#CBD5E1] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Gem className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[var(--collection-heading)] group-hover:text-[#CBD5E1] transition-colors">
                  Silver Jewellery
                </h3>
                <p className="text-xs text-[var(--collection-text-muted)] mt-1">
                  92.5 Sterling silver neckpieces, earrings & bangles
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#94A3B8] uppercase tracking-wider gap-1">
                <span>Explore Silver</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
