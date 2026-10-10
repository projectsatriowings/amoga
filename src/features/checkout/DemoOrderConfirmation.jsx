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
  Info,
  Calendar,
  Truck,
  FileText,
  Database,
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
    <div className="min-h-screen bg-amoga-paper pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs uppercase tracking-widest text-amoga-charcoal/60">
            <li>
              <Link to="/" className="hover:text-amoga-burgundy transition-colors">
                Portal
              </Link>
            </li>
            <li>
              <span className="text-amoga-charcoal/40">/</span>
            </li>
            <li className="text-amoga-burgundy font-medium" aria-current="page">
              Order Confirmation
            </li>
          </ol>
        </nav>

        {hasMatchingOrder ? (
          /* Active Order Snapshot View */
          <div className="space-y-8">
            {/* Header Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amoga-brass/25 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isPersistent
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {isPaid ? (
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isPersistent ? (
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {isPaid
                    ? 'Payment Captured (Test Mode)'
                    : isPersistent
                    ? 'Persistent Order (Payment Pending)'
                    : 'Simulated Order Completed'}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-amoga-charcoal mt-1">
                {isPaid
                  ? 'Order Confirmed & Payment Verified'
                  : isPersistent
                  ? 'Order Placed (Awaiting Payment)'
                  : 'Demo Order Confirmation'}
              </h1>

              <div className="mt-4 p-3 bg-amoga-ivory inline-block rounded-xl border border-amoga-brass/30">
                <span className="text-xs text-amoga-charcoal/60 uppercase tracking-widest block font-medium">
                  Authoritative Order Reference
                </span>
                <span className="font-mono text-base sm:text-lg font-bold text-amoga-burgundy">
                  {orderId}
                </span>
              </div>

              {/* Explicit Test Mode Disclaimer */}
              <div className="mt-6 p-4 max-w-2xl mx-auto bg-amber-50 rounded-2xl border border-amber-300/80 text-left text-xs sm:text-sm text-amber-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold text-amber-900">
                    Phase 8 Payment Architecture — Test Mode Disclosure
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
              <div className="bg-white rounded-2xl p-6 border border-amoga-brass/20 shadow-sm text-xs">
                <div className="flex items-center gap-2 text-amoga-burgundy pb-3 border-b border-amoga-brass/15 mb-4">
                  <Truck className="w-4 h-4" />
                  <h2 className="font-serif text-base font-semibold text-amoga-charcoal">
                    Delivery Recipient Details
                  </h2>
                </div>

                <div className="space-y-1 text-amoga-charcoal/80">
                  <p className="font-bold text-sm text-amoga-charcoal">
                    {activeOrder.customer?.fullName || 'Valued Customer'}
                  </p>
                  <p>{activeOrder.customer?.email}</p>
                  <p>{activeOrder.customer?.phone}</p>
                  <div className="pt-2 text-amoga-charcoal/70">
                    <p>{activeOrder.customer?.addressLine1}</p>
                    {activeOrder.customer?.addressLine2 && (
                      <p>{activeOrder.customer?.addressLine2}</p>
                    )}
                    <p>
                      {activeOrder.customer?.city}, {activeOrder.customer?.state} -{' '}
                      <strong>{activeOrder.customer?.pincode}</strong>
                    </p>
                  </div>
                  {activeOrder.customer?.instructions && (
                    <p className="pt-2 italic text-amoga-charcoal/60">
                      Instructions: &ldquo;{activeOrder.customer.instructions}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Order Meta Snapshot */}
              <div className="bg-white rounded-2xl p-6 border border-amoga-brass/20 shadow-sm text-xs">
                <div className="flex items-center gap-2 text-amoga-burgundy pb-3 border-b border-amoga-brass/15 mb-4">
                  <Calendar className="w-4 h-4" />
                  <h2 className="font-serif text-base font-semibold text-amoga-charcoal">
                    Order & Payment Lifecycle
                  </h2>
                </div>

                <div className="space-y-2.5 text-amoga-charcoal/80">
                  <div className="flex justify-between">
                    <span className="text-amoga-charcoal/60">Created At:</span>
                    <span className="font-medium">
                      {new Date(activeOrder.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amoga-charcoal/60">Order Status:</span>
                    <span className="font-semibold text-emerald-700">
                      {activeOrder.status || 'CONFIRMED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amoga-charcoal/60">Payment Status:</span>
                    <span className={`font-semibold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {activeOrder.paymentStatus || (isPaid ? 'SUCCEEDED' : 'PENDING')}
                    </span>
                  </div>
                  {latestPaymentRef && (
                    <div className="flex justify-between">
                      <span className="text-amoga-charcoal/60">Payment Attempt:</span>
                      <span className="font-mono text-[11px] text-amoga-charcoal/90">
                        {latestPaymentRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-amoga-charcoal/60">Provider Mode:</span>
                    <span className="font-medium text-amoga-charcoal/70">
                      Test Adapter (Dev Mode)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amoga-brass/15">
                    <span className="font-semibold text-amoga-charcoal">Paid Total:</span>
                    <span className="font-serif text-base font-bold text-amoga-burgundy">
                      {formatINR(activeOrder.totals?.totalAmount || activeOrder.totals?.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Snapshot */}
            <div className="bg-white rounded-2xl p-6 border border-amoga-brass/20 shadow-sm">
              <div className="flex items-center gap-2 text-amoga-burgundy pb-3 border-b border-amoga-brass/15 mb-4">
                <FileText className="w-4 h-4" />
                <h2 className="font-serif text-base font-semibold text-amoga-charcoal">
                  Items in Order ({activeOrder.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-amoga-brass/15 text-xs">
                {(activeOrder.items || []).map((item, idx) => (
                  <div key={item.lineId || item.id || idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name || item.productName}
                          className="w-12 h-12 object-cover rounded-lg border border-amoga-brass/20 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-amoga-burgundy">
                          {item.collectionId || item.collectionName || 'Collection'}
                        </span>
                        <h3 className="font-medium text-amoga-charcoal truncate">
                          {item.name || item.productName}
                        </h3>
                        {(item.selectedVariant?.name || item.variantName) && (
                          <p className="text-[10px] text-amoga-charcoal/60">
                            {item.selectedVariant?.name || item.variantName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-amoga-charcoal/60">
                        Qty: {item.quantity} × {formatINR(item.price || item.unitPrice || 0)}
                      </span>
                      <p className="font-semibold text-amoga-charcoal font-serif">
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
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amoga-brass/25 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-amoga-charcoal mb-2">
              {isDemoFormat ? 'Demonstration Reference Notice' : 'Unknown Reference Identifier'}
            </h1>

            <div className="my-4 p-3 bg-amoga-ivory inline-block rounded-xl border border-amoga-brass/30">
              <span className="text-xs text-amoga-charcoal/60 uppercase tracking-widest block font-medium">
                Provided Identifier
              </span>
              <span className="font-mono text-base font-bold text-amoga-charcoal">
                {orderId || 'None'}
              </span>
            </div>

            <p className="text-sm text-amoga-charcoal/75 leading-relaxed mb-6">
              {isDemoFormat
                ? 'This reference identifier is formatted as an Amoga frontend demonstration reference. Because this application operates purely client-side without a persistent server database, order details are retained only in temporary browser memory during an active checkout session.'
                : 'No simulated order record was found for this identifier in your current browser session. Amoga operates in a frontend-only demonstration mode and does not maintain a server-side order database.'}
            </p>

            <div className="p-4 bg-amoga-ivory rounded-xl border border-amoga-brass/25 text-xs text-amoga-charcoal/70 mb-8 text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amoga-burgundy shrink-0 mt-0.5" />
              <span>
                To test the complete simulated order flow, add items to your shopping bag from any collection, fill the checkout form, and complete the demo review.
              </span>
            </div>

            <Link
              to="/cart"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-amoga-burgundy text-amoga-ivory text-sm font-medium hover:bg-amoga-burgundy/90 transition-all shadow-md"
            >
              Go to Shopping Bag
            </Link>
          </div>
        )}

        {/* Collection Discovery Hub */}
        <div className="mt-14 pt-10 border-t border-amoga-brass/20">
          <h2 className="font-serif text-xl sm:text-2xl text-amoga-charcoal text-center mb-2">
            Continue Exploring Amoga Collections
          </h2>
          <p className="text-center text-xs sm:text-sm text-amoga-charcoal/60 mb-8">
            Experience our hand-crafted offerings across all three houses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/food"
              className="group p-5 rounded-2xl bg-white border border-[#2D5A27]/20 hover:border-[#2D5A27] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#2D5A27]/10 text-[#2D5A27] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-amoga-charcoal group-hover:text-[#2D5A27] transition-colors">
                  Gourmet Food
                </h3>
                <p className="text-xs text-amoga-charcoal/60 mt-1">
                  Artisanal treats, pure filter coffee & botanical teas
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#2D5A27] uppercase tracking-wider gap-1">
                <span>Explore Food</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/sarees"
              className="group p-5 rounded-2xl bg-white border border-[#7A1C2E]/20 hover:border-[#7A1C2E] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#7A1C2E]/10 text-[#7A1C2E] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-amoga-charcoal group-hover:text-[#7A1C2E] transition-colors">
                  Heritage Sarees
                </h3>
                <p className="text-xs text-amoga-charcoal/60 mt-1">
                  Kanchipuram, Banarasi zari & pure mulberry silks
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#7A1C2E] uppercase tracking-wider gap-1">
                <span>Explore Sarees</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/jewellery"
              className="group p-5 rounded-2xl bg-white border border-[#3A4556]/20 hover:border-[#3A4556] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#3A4556]/10 text-[#3A4556] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Gem className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-amoga-charcoal group-hover:text-[#3A4556] transition-colors">
                  Silver Jewellery
                </h3>
                <p className="text-xs text-amoga-charcoal/60 mt-1">
                  92.5 Sterling silver neckpieces, earrings & bangles
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#3A4556] uppercase tracking-wider gap-1">
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
