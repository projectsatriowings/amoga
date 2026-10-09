import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { formatINR, validateCartForCheckout } from '../../utils/pricing';
import {
  createOrderApi,
  createPaymentOrderApi,
  verifyPaymentApi,
  testSimulatePaymentApi,
} from '../../services/checkoutApi';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Truck,
  ShoppingBag,
  CreditCard,
  Lock,
  RefreshCw,
  X,
} from 'lucide-react';

// Pure helper to generate demo reference outside component render scope
function generateDemoOrderId() {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AMOGA-DEMO-${timestampPart}-${randomSuffix}`;
}

function generateIdempotencyKey() {
  const timestampPart = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `idemp-${timestampPart}-${randomSuffix}`;
}

function getNowIso() {
  return new Date().toISOString();
}

// Frozen order snapshot constructor
function buildSimulatedOrder(demoOrderId, customerDetails, cart, totals) {
  return {
    orderId: demoOrderId,
    createdAt: new Date().toISOString(),
    customer: { ...customerDetails },
    items: cart.map((item) => ({ ...item })),
    totals: { ...totals },
    isDemo: true,
    simulationNotice: 'Demonstration only — no real payment was processed or charged.',
  };
}

export const OrderReviewPage = () => {
  const navigate = useNavigate();
  const cart = useStore((state) => state.cart);
  const customerDetails = useStore((state) => state.customerDetails);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const setLastCompletedOrder = useStore((state) => state.setLastCompletedOrder);
  const clearCart = useStore((state) => state.clearCart);

  const [simulationError, setSimulationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Modal States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAttempt, setPaymentAttempt] = useState(null);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const totals = getCartTotals();

  // Validate customer details
  const isCustomerValid =
    Boolean(customerDetails.fullName?.trim()) &&
    Boolean(customerDetails.email?.trim()) &&
    Boolean(customerDetails.phone?.trim()) &&
    Boolean(customerDetails.addressLine1?.trim()) &&
    Boolean(customerDetails.city?.trim()) &&
    Boolean(customerDetails.state?.trim()) &&
    Boolean(customerDetails.pincode?.trim());

  // Validate cart eligibility
  const cartValidation = validateCartForCheckout(cart);

  const handleInitiatePayment = async () => {
    // 1. Re-validate cart client-side
    const recheckCart = validateCartForCheckout(cart);
    if (!recheckCart.isValid) {
      setSimulationError(recheckCart.errors.join(' '));
      return;
    }

    // 2. Re-validate customer details
    if (!isCustomerValid) {
      setSimulationError('Delivery information is incomplete. Please return to Checkout to provide required details.');
      return;
    }

    setIsSubmitting(true);
    setSimulationError(null);
    setPaymentError(null);

    const idempotencyKey = generateIdempotencyKey();

    try {
      // 3. Submit or resume order in PostgreSQL backend
      const orderResult = await createOrderApi({
        items: cart,
        customer: customerDetails,
        idempotencyKey,
      });

      if (orderResult && orderResult.orderReference) {
        setCreatedOrderData(orderResult);

        // Store guest access token in session storage keyed by reference
        if (orderResult.guestAccessToken) {
          try {
            sessionStorage.setItem(
              `amoga_guest_token_${orderResult.orderReference}`,
              orderResult.guestAccessToken
            );
          } catch {
            // Non-blocking in private browsing mode
          }
        }

        // 4. Create authoritative payment order attempt
        const paymentResult = await createPaymentOrderApi({
          orderReference: orderResult.orderReference,
          guestAccessToken: orderResult.guestAccessToken,
          idempotencyKey: `pay-${idempotencyKey}`,
        });

        if (paymentResult.provider === 'razorpay') {
          // Dynamically load Razorpay standard checkout script if not present
          const loadRazorpay = () => {
            return new Promise((resolve) => {
              if (window.Razorpay) return resolve(true);
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve(true);
              script.onerror = () => resolve(false);
              document.body.appendChild(script);
            });
          };

          const scriptLoaded = await loadRazorpay();
          if (!scriptLoaded) {
            setPaymentError('Unable to load Razorpay checkout gateway. Please verify network access.');
            return;
          }

          const clientPayload = paymentResult.clientPayload || {};
          const razorpayOptions = {
            key: clientPayload.keyId,
            amount: clientPayload.amountPaise,
            currency: clientPayload.currency || 'INR',
            name: clientPayload.name || 'AMOGA',
            description: clientPayload.description || `Order ${orderResult.orderReference}`,
            order_id: clientPayload.orderId,
            prefill: clientPayload.prefill || {},
            theme: {
              color: '#722F37', // Amoga signature burgundy
            },
            handler: async (response) => {
              setIsProcessingPayment(true);
              setPaymentError(null);
              try {
                const verifyResult = await verifyPaymentApi({
                  orderReference: orderResult.orderReference,
                  paymentReference: paymentResult.paymentReference,
                  providerOrderId: response.razorpay_order_id,
                  providerPaymentId: response.razorpay_payment_id,
                  providerSignature: response.razorpay_signature,
                  guestAccessToken: orderResult.guestAccessToken,
                });

                if (verifyResult && verifyResult.verified) {
                  const completedOrderSnapshot = {
                    orderId: orderResult.orderReference,
                    orderReference: orderResult.orderReference,
                    guestAccessToken: orderResult.guestAccessToken,
                    status: 'CONFIRMED',
                    paymentStatus: 'SUCCEEDED',
                    paymentReference: paymentResult.paymentReference,
                    createdAt: getNowIso(),
                    customer: orderResult.customer || { ...customerDetails },
                    items: orderResult.items || cart.map((item) => ({ ...item })),
                    totals: orderResult.totals || { ...totals },
                    isPersistent: true,
                    isDemo: false,
                  };
                  setLastCompletedOrder(completedOrderSnapshot);
                  clearCart();
                  navigate(`/order-confirmation/${orderResult.orderReference}`);
                }
              } catch (verifyErr) {
                setPaymentError(verifyErr.message || 'Payment signature verification failed.');
              } finally {
                setIsProcessingPayment(false);
              }
            },
            modal: {
              ondismiss: () => {
                setPaymentError('Payment window was dismissed. Your shopping bag has been preserved.');
              },
            },
          };

          const rzp = new window.Razorpay(razorpayOptions);
          rzp.on('payment.failed', (failResp) => {
            setPaymentError(failResp.error?.description || 'Payment transaction declined.');
          });
          rzp.open();
          return;
        }

        // Default / test provider simulation
        setPaymentAttempt(paymentResult);
        setPaymentModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn('Backend order or payment initialization returned error:', err);
      if (err.status === 422 && err.details) {
        setSimulationError(Array.isArray(err.details) ? err.details.join(' ') : String(err.details));
        setIsSubmitting(false);
        return;
      }

      // If backend is offline, provide graceful development fallback
      const demoOrderId = generateDemoOrderId();
      const simulatedOrder = buildSimulatedOrder(demoOrderId, customerDetails, cart, totals);
      setLastCompletedOrder(simulatedOrder);
      clearCart();
      navigate(`/order-confirmation/${demoOrderId}`);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecutePaymentSimulation = async (outcome = 'success') => {
    if (!paymentAttempt || !createdOrderData) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const guestAccessToken =
        createdOrderData.guestAccessToken ||
        sessionStorage.getItem(`amoga_guest_token_${createdOrderData.orderReference}`);

      // 1. In dev test mode, request signed simulation parameters from test provider helper
      const simResponse = await testSimulatePaymentApi({
        orderReference: createdOrderData.orderReference,
        paymentReference: paymentAttempt.paymentReference,
        outcome,
        guestAccessToken,
      });

      // 2. Submit callback parameters to server-side verification endpoint
      const verifyResult = await verifyPaymentApi({
        orderReference: createdOrderData.orderReference,
        paymentReference: paymentAttempt.paymentReference,
        providerOrderId: simResponse.providerOrderId || paymentAttempt.providerOrderId,
        providerPaymentId: simResponse.providerPaymentId,
        providerSignature: simResponse.providerSignature,
        guestAccessToken,
      });

      if (verifyResult && verifyResult.verified) {
        // Payment Succeeded!
        const completedOrderSnapshot = {
          orderId: createdOrderData.orderReference,
          orderReference: createdOrderData.orderReference,
          guestAccessToken,
          status: 'CONFIRMED',
          paymentStatus: 'SUCCEEDED',
          paymentReference: paymentAttempt.paymentReference,
          createdAt: getNowIso(),
          customer: createdOrderData.customer || { ...customerDetails },
          items: createdOrderData.items || cart.map((item) => ({ ...item })),
          totals: createdOrderData.totals || { ...totals },
          isPersistent: true,
          isDemo: false,
        };

        setLastCompletedOrder(completedOrderSnapshot);
        clearCart();
        setPaymentModalOpen(false);
        navigate(`/order-confirmation/${createdOrderData.orderReference}`);
        return;
      }
    } catch (err) {
      console.warn('Payment verification returned error:', err);
      // Payment failure preserves the cart so customer can retry
      setPaymentError(
        err.message || 'Payment verification failed: The test payment attempt was rejected or declined.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // If cart is empty and no active order
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-amoga-paper pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl p-8 border border-amoga-brass/20 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amoga-ivory border border-amoga-brass/30 flex items-center justify-center mx-auto mb-4 text-amoga-burgundy">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl text-amoga-charcoal mb-2">
            No Active Bag for Review
          </h1>
          <p className="text-sm text-amoga-charcoal/70 mb-6">
            There are no items in your shopping bag to review.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-amoga-burgundy text-amoga-ivory text-sm font-medium hover:bg-amoga-burgundy/90 transition-all shadow-md"
          >
            Return to Shopping Bag
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amoga-paper pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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
            <li>
              <Link to="/cart" className="hover:text-amoga-burgundy transition-colors">
                Bag
              </Link>
            </li>
            <li>
              <span className="text-amoga-charcoal/40">/</span>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-amoga-burgundy transition-colors">
                Checkout
              </Link>
            </li>
            <li>
              <span className="text-amoga-charcoal/40">/</span>
            </li>
            <li className="text-amoga-burgundy font-medium" aria-current="page">
              Order Review
            </li>
          </ol>
        </nav>

        {/* Page Title */}
        <div className="pb-6 border-b border-amoga-brass/20 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-amoga-charcoal">
              Order Review & Demonstration
            </h1>
            <p className="mt-1 text-sm text-amoga-charcoal/70">
              Please inspect your selections and delivery destination before completing the simulation.
            </p>
          </div>
          <span className="text-xs uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300 font-semibold self-start sm:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Frontend Demo Preview
          </span>
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="p-5 bg-amber-50/90 rounded-2xl border border-amber-300/80 text-amber-950 text-xs sm:text-sm mb-8 flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <h2 className="font-semibold text-amber-900">
              Simulated Demonstration Notice
            </h2>
            <p className="mt-1 text-amber-800/90">
              This application is in frontend presentation mode. <strong>No actual payment gateway is connected</strong>, no credit cards are charged, and no real fulfilment order is dispatched. Clicking the completion button simulates the order confirmation experience with non-production reference records.
            </p>
          </div>
        </div>

        {/* Errors / Warnings */}
        {simulationError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs sm:text-sm mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Review Error</p>
              <p className="mt-0.5">{simulationError}</p>
            </div>
          </div>
        )}

        {/* Delivery Details Incomplete Warning */}
        {!isCustomerValid && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm mb-8 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Customer details are incomplete</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Please return to the checkout page to provide your contact name, email, phone, and delivery address.
                </p>
              </div>
            </div>
            <Link
              to="/checkout"
              className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-semibold shrink-0 hover:bg-amber-900 transition-colors"
            >
              Edit Details
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Items & Customer Card (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Destination Card */}
            <div className="bg-white rounded-2xl p-6 border border-amoga-brass/20 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-amoga-brass/15 mb-4">
                <div className="flex items-center gap-2 text-amoga-burgundy">
                  <Truck className="w-4 h-4" />
                  <h2 className="font-serif text-lg font-semibold text-amoga-charcoal">
                    Delivery Destination
                  </h2>
                </div>
                <Link
                  to="/checkout"
                  className="text-xs uppercase tracking-wider text-amoga-burgundy hover:underline font-semibold"
                >
                  Edit Address
                </Link>
              </div>

              {isCustomerValid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-amoga-charcoal/80">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-amoga-charcoal/50 font-medium mb-1">
                      Recipient
                    </span>
                    <p className="font-semibold text-amoga-charcoal text-sm">
                      {customerDetails.fullName}
                    </p>
                    <p className="mt-0.5">{customerDetails.email}</p>
                    <p>{customerDetails.phone}</p>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-amoga-charcoal/50 font-medium mb-1">
                      Shipping Address
                    </span>
                    <p>{customerDetails.addressLine1}</p>
                    {customerDetails.addressLine2 && <p>{customerDetails.addressLine2}</p>}
                    <p>
                      {customerDetails.city}, {customerDetails.state} -{' '}
                      <strong>{customerDetails.pincode}</strong>
                    </p>
                    {customerDetails.instructions && (
                      <p className="mt-2 text-[11px] italic text-amoga-charcoal/60 bg-amoga-ivory p-2 rounded-lg border border-amoga-brass/15">
                        Instructions: &ldquo;{customerDetails.instructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-rose-700 italic">
                  No delivery address entered yet. Please return to Checkout.
                </p>
              )}
            </div>

            {/* Cart Items Detailed Review */}
            <div className="bg-white rounded-2xl p-6 border border-amoga-brass/20 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-amoga-brass/15 mb-4">
                <h2 className="font-serif text-lg font-semibold text-amoga-charcoal">
                  Items Selected ({totals.payableItemsCount})
                </h2>
                <Link
                  to="/cart"
                  className="text-xs uppercase tracking-wider text-amoga-burgundy hover:underline font-semibold"
                >
                  Edit Cart
                </Link>
              </div>

              <div className="divide-y divide-amoga-brass/15">
                {cart.map((item) => (
                  <div key={item.lineId} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-amoga-brass/20 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23eee"/><text x="32" y="32" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Amoga</text></svg>';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amoga-ivory text-amoga-burgundy border border-amoga-brass/20">
                          {item.collectionId}
                        </span>
                        {item.selectedVariant?.name && (
                          <span className="text-[11px] text-amoga-charcoal/60">
                            • {item.selectedVariant.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-sm text-amoga-charcoal truncate">
                        {item.name}
                      </h3>
                      <div className="text-amoga-charcoal/70 mt-1">
                        Unit Price: <span className="font-medium">{formatINR(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-amoga-charcoal/60 block">
                        Qty: <strong>{item.quantity}</strong>
                      </span>
                      <span className="font-serif text-base font-semibold text-amoga-burgundy block mt-0.5">
                        {formatINR((item.price || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Demo Simulation CTA (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-amoga-ivory rounded-2xl p-6 sm:p-7 border border-amoga-brass/25 shadow-sm sticky top-28 space-y-6">
              <h2 className="font-serif text-xl text-amoga-burgundy border-b border-amoga-brass/15 pb-3">
                Final Payable Summary
              </h2>

              <div className="space-y-3 text-xs text-amoga-charcoal">
                <div className="flex justify-between items-baseline">
                  <span>Subtotal ({totals.payableItemsCount} items)</span>
                  <span className="font-serif text-sm font-semibold">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-amoga-charcoal/70">
                  <span>Standard Shipping</span>
                  <span className="italic">Complimentary (Demo)</span>
                </div>
                <div className="flex justify-between items-baseline text-amoga-charcoal/70">
                  <span>Taxes & Duties</span>
                  <span className="italic">Included</span>
                </div>
                <div className="pt-4 border-t border-amoga-brass/15 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-amoga-charcoal">Total Amount</span>
                  <span className="font-serif text-2xl font-bold text-amoga-burgundy">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>
              </div>

              {/* Payment CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={!cartValidation.isValid || !isCustomerValid || isSubmitting}
                  className={`w-full py-4 px-5 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 text-center transition-all shadow-md ${
                    !cartValidation.isValid || !isCustomerValid || isSubmitting
                      ? 'bg-amoga-charcoal/20 text-amoga-charcoal/40 cursor-not-allowed shadow-none'
                      : 'bg-amoga-burgundy hover:bg-amoga-burgundy/90 text-amoga-ivory active:scale-[0.99] shadow-amoga-burgundy/20 hover:shadow-lg'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting ? 'Initiating Payment Order...' : `Proceed to Secure Payment — ${formatINR(totals.subtotal)}`}
                  </span>
                </button>

                <p className="mt-2.5 text-[11px] text-center text-amoga-charcoal/60 leading-tight">
                  Test Mode Payment Gateway • Authoritative Server Pricing in INR
                </p>
              </div>

              {/* Navigation Links */}
              <div className="pt-4 border-t border-amoga-brass/15 flex flex-col gap-2 text-center text-xs">
                <Link
                  to="/checkout"
                  className="text-amoga-charcoal/70 hover:text-amoga-burgundy font-medium flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Checkout Form</span>
                </Link>
                <Link
                  to="/cart"
                  className="text-amoga-charcoal/50 hover:text-amoga-charcoal font-medium"
                >
                  Return to Shopping Bag
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Test Payment Gateway Modal */}
      {paymentModalOpen && paymentAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amoga-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-amoga-brass/30 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amoga-charcoal via-amoga-charcoal/95 to-amoga-burgundy text-amoga-ivory px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amoga-brass">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold tracking-wide">
                    Amoga Secure Checkout
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      Test Mode Simulation
                    </span>
                    <span className="text-xs text-white/60">• No Real Money Charged</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isProcessingPayment) setPaymentModalOpen(false);
                }}
                disabled={isProcessingPayment}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Order & Payment References */}
              <div className="bg-amoga-ivory/80 rounded-2xl p-4 border border-amoga-brass/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-amoga-charcoal/60">Order Reference:</span>
                  <span className="font-mono font-bold text-amoga-burgundy">
                    {paymentAttempt.orderReference}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amoga-charcoal/60">Payment Attempt:</span>
                  <span className="font-mono font-medium text-amoga-charcoal">
                    {paymentAttempt.paymentReference}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amoga-charcoal/60">Provider Adapter:</span>
                  <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px]">
                    {paymentAttempt.provider} (Isolated Test Adapter)
                  </span>
                </div>
                <div className="pt-2 border-t border-amoga-brass/20 flex justify-between items-baseline">
                  <span className="font-semibold text-amoga-charcoal text-sm">Authoritative Total:</span>
                  <span className="font-serif text-xl font-bold text-amoga-burgundy">
                    {formatINR(paymentAttempt.amount || totals.subtotal)}
                  </span>
                </div>
              </div>

              {/* Error message banner */}
              {paymentError && (
                <div className="p-3.5 bg-red-50 rounded-xl border border-red-300 text-xs text-red-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Payment Failed</p>
                    <p className="mt-0.5 text-red-700">{paymentError}</p>
                    <p className="mt-1 text-[11px] text-red-600">Your shopping bag remains preserved. You can retry with a different outcome.</p>
                  </div>
                </div>
              )}

              {/* Test Mode Simulation Disclaimer */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Engineering Test Architecture
                </p>
                <p className="mt-1">
                  Payment provider has not yet been selected. This interactive modal validates the backend signature verification, database transaction isolation, and idempotency pipeline.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecutePaymentSimulation('success')}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Cryptographic Signature...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {formatINR(paymentAttempt.amount || totals.subtotal)} (Simulate Success)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleExecutePaymentSimulation('failure')}
                  disabled={isProcessingPayment}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Simulate Payment Failure (Declined / Invalid Signature)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
