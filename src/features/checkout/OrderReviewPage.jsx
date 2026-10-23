import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { formatINR, validateCartForCheckout } from '../../utils/pricing';
import {
  createOrderApi,
  createPaymentOrderApi,
  verifyPaymentApi,
  testSimulatePaymentApi,
  validateCartApi,
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
import { BackButton } from '../../components/ui/BackButton';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';

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
function buildSimulatedOrder(demoOrderId, customerDetails, items, totals) {
  return {
    orderId: demoOrderId,
    createdAt: new Date().toISOString(),
    customer: { ...customerDetails },
    items: (Array.isArray(items) ? items : []).map((item) => ({ ...item })),
    totals: { ...totals },
    isDemo: true,
    simulationNotice: 'Demonstration only — no real payment was processed or charged.',
  };
}

export const OrderReviewPage = () => {
  const navigate = useNavigate();
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);
  const reconcileCartAfterPurchase = useStore((state) => state.reconcileCartAfterPurchase);
  const checkoutContext = useStore((state) => state.checkoutContext);
  const cartItems = useStore((state) => state.cart.items);
  const selectedLineIds = useStore((state) => state.selectedLineIds);
  const customerDetails = useStore((state) => state.customerDetails || state.checkout?.customerDetails) || {};
  const setLastCompletedOrder = useStore((state) => state.setLastCompletedOrder);
  const resolved = useResolvedTheme();

  // Memoize checkout items stably against actual store state to prevent reference mutations on re-renders
  const checkoutItems = useMemo(() => {
    if (checkoutContext?.type === 'buy_now' && checkoutContext?.buyNowItem) {
      return [checkoutContext.buyNowItem];
    }
    const ids = Array.isArray(selectedLineIds) ? selectedLineIds : [];
    return (cartItems || []).filter((item) => ids.includes(item.id || item.lineId));
  }, [cartItems, selectedLineIds, checkoutContext]);

  // Serialized items key ensuring cart validation only fires when cart contents or quantities change
  const itemsKey = useMemo(() => {
    return (checkoutItems || [])
      .map((i) => `${i.id || i.productId}:${i.selectedVariant?.id || ''}:${i.quantity}`)
      .join(',');
  }, [checkoutItems]);

  const totals = getCheckoutTotals();

  const [simulationError, setSimulationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Authoritative server shipping from store settings
  const [serverShipping, setServerShipping] = useState({
    carrier: 'India Post',
    amount: 0,
    isComplimentary: true,
    freeShippingThreshold: 2000,
    thresholdOperator: 'GTE',
    taxBreakdown: null,
    totalTaxAmount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    if (checkoutItems.length > 0 && itemsKey) {
      validateCartApi(checkoutItems)
        .then((res) => {
          if (isMounted && res?.totals) {
            setServerShipping({
              carrier: res.totals.shippingCarrier || res.shipping?.carrier || 'India Post',
              amount: res.totals.shippingAmount || 0,
              isComplimentary: res.totals.isComplimentaryShipping ?? (res.totals.shippingAmount === 0),
              freeShippingThreshold: res.totals.freeShippingThreshold || 2000,
              thresholdOperator: res.totals.shippingThresholdOperator || 'GTE',
              taxBreakdown: res.totals.taxBreakdown || res.taxBreakdown || null,
              totalTaxAmount: res.totals.totalTaxAmount || 0,
              taxableAmount: res.totals.taxableAmount || 0,
              cgstAmount: res.totals.cgstAmount || 0,
              sgstAmount: res.totals.sgstAmount || 0,
              igstAmount: res.totals.igstAmount || 0,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [itemsKey]);

  const shippingFee = serverShipping.isComplimentary ? 0 : serverShipping.amount;
  const finalPayableTotal = Math.max(0, (totals.subtotal || 0) + shippingFee);

  // Payment Modal States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAttempt, setPaymentAttempt] = useState(null);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Freeze backdrop and page scrolling when payment modal is displayed
  useBodyScrollLock(Boolean(paymentModalOpen && paymentAttempt));

  // Validate customer details safely
  const isCustomerValid =
    Boolean(customerDetails?.fullName?.trim()) &&
    Boolean(customerDetails?.email?.trim()) &&
    Boolean(customerDetails?.phone?.trim()) &&
    Boolean(customerDetails?.addressLine1?.trim()) &&
    Boolean(customerDetails?.city?.trim()) &&
    Boolean(customerDetails?.state?.trim()) &&
    Boolean(customerDetails?.pincode?.trim());

  // Validate cart eligibility
  const cartValidation = validateCartForCheckout(checkoutItems);

  const handleInitiatePayment = async () => {
    // 1. Re-validate cart client-side
    const recheckCart = validateCartForCheckout(checkoutItems);
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
        items: checkoutItems,
        customer: customerDetails,
        idempotencyKey,
        paymentMethod,
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

        // 4. Create authoritative payment order attempt for online payment
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
                    items: orderResult.items || checkoutItems.map((item) => ({ ...item })),
                    totals: orderResult.totals || { ...totals },
                    isPersistent: true,
                    isDemo: false,
                  };
                  setLastCompletedOrder(completedOrderSnapshot);
                  reconcileCartAfterPurchase(checkoutItems);
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
      setIsSubmitting(false);

      if (err.status === 409 || err.code === 'INSUFFICIENT_STOCK') {
        setSimulationError(err.message || 'One or more items in your bag are out of stock or exceed current warehouse inventory. Please adjust quantities.');
        return;
      }
      if (err.status === 422 && err.details) {
        setSimulationError(Array.isArray(err.details) ? err.details.join(' ') : String(err.details));
        return;
      }

      // If backend error has a specific message, display it clearly
      if (err.message) {
        if (err.message.toLowerCase().includes('authentication failed')) {
          setSimulationError('Payment Gateway Authentication Error: The server is unable to authenticate with Razorpay. Please verify the Razorpay Key ID and Secret in the server configuration.');
        } else {
          setSimulationError(err.message);
        }
        return;
      }

      // If backend is completely offline (network down), provide development fallback
      const demoOrderId = generateDemoOrderId();
      const simulatedOrder = buildSimulatedOrder(demoOrderId, customerDetails, checkoutItems, totals);
      setLastCompletedOrder(simulatedOrder);
      reconcileCartAfterPurchase(checkoutItems);
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
          items: createdOrderData.items || checkoutItems.map((item) => ({ ...item })),
          totals: createdOrderData.totals || { ...totals },
          isPersistent: true,
          isDemo: false,
        };

        setLastCompletedOrder(completedOrderSnapshot);
        reconcileCartAfterPurchase(checkoutItems);
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

  // If checkout context is empty and no active order
  if (checkoutItems.length === 0) {
    return (
      <div
        className="min-h-screen pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 transition-colors"
        style={{
          ...resolved.cssVariables,
          backgroundColor: 'var(--collection-page-bg)',
          color: 'var(--collection-text)',
        }}
      >
        <div
          className="max-w-xl mx-auto text-center py-16 rounded-2xl p-8 border shadow-sm"
          style={{
            backgroundColor: 'var(--collection-card-bg)',
            borderColor: 'var(--collection-border)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: 'var(--collection-section-bg)',
              borderColor: 'var(--collection-border)',
              color: 'var(--collection-accent)',
            }}
          >
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1
            className="font-serif text-2xl mb-2"
            style={{ color: 'var(--collection-heading)' }}
          >
            Your Cart is Empty
          </h1>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            There are no items selected for purchase to review.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-md cursor-pointer hover:opacity-95"
            style={{
              backgroundColor: 'var(--collection-button-bg, var(--collection-accent))',
              color: 'var(--collection-button-text, #FFFFFF)',
            }}
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 transition-colors"
      style={{
        ...resolved.cssVariables,
        backgroundColor: 'var(--collection-page-bg)',
        color: 'var(--collection-text)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb Navigation & Back Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackButton fallbackTo="/checkout" label="Back to Checkout" />

          <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[var(--collection-text-muted)]">
            <li>
              <Link to="/" className="hover:text-[var(--collection-accent)] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <span className="text-[var(--collection-border)]">/</span>
            </li>
            <li>
              <Link to="/cart" className="hover:text-[var(--collection-accent)] transition-colors">
                Cart
              </Link>
            </li>
            <li>
              <span className="text-[var(--collection-border)]">/</span>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-[var(--collection-accent)] transition-colors">
                Checkout
              </Link>
            </li>
            <li>
              <span className="text-[var(--collection-border)]">/</span>
            </li>
            <li className="text-[var(--collection-accent)] font-semibold" aria-current="page">
              Order Review
            </li>
          </ol>
        </nav>
        </div>

        {/* Page Title */}
        <div className="pb-6 border-b border-[var(--collection-border)] mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--collection-heading)]">
              Review Your Order
            </h1>
            <p className="mt-1 text-sm text-[var(--collection-text-muted)]">
              Please check your items, delivery address, and payment method before placing your order.
            </p>
          </div>
          <span className="text-xs uppercase tracking-widest text-[var(--collection-accent)] bg-[var(--collection-section-bg)] px-3.5 py-1.5 rounded-full border border-[var(--collection-border)] font-semibold self-start sm:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--collection-accent)]" />
            Secure Checkout
          </span>
        </div>

        {/* Order Review Banner */}
        <div
          className="p-5 rounded-2xl border text-xs sm:text-sm mb-8 flex items-start gap-3.5 shadow-xs transition-colors"
          style={{
            backgroundColor: 'var(--collection-card-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-text)',
          }}
        >
          <ShieldCheck
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: 'var(--collection-accent)' }}
          />
          <div className="leading-relaxed">
            <h2
              className="font-semibold text-sm"
              style={{ color: 'var(--collection-heading)' }}
            >
              Order Confirmation
            </h2>
            <p className="mt-1 text-xs opacity-90 text-[var(--collection-text-muted)]">
              Items are reserved for your order. Select your payment method below to complete your order.
            </p>
          </div>
        </div>

        {/* Errors / Warnings */}
        {simulationError && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-[#991B1B] text-xs sm:text-sm mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
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
            {/* Delivery Address Card */}
            <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--collection-border)] mb-4">
                <div className="flex items-center gap-2 text-[var(--collection-accent)]">
                  <Truck className="w-4 h-4" />
                  <h2 className="font-serif text-lg font-semibold text-[var(--collection-heading)]">
                    Delivery Address
                  </h2>
                </div>
                <Link
                  to="/checkout"
                  className="text-xs uppercase tracking-wider text-[var(--collection-accent)] hover:underline font-semibold"
                >
                  Edit Address
                </Link>
              </div>

              {isCustomerValid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[var(--collection-text-muted)]">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[var(--collection-text-muted)] font-medium mb-1">
                      Recipient
                    </span>
                    <p className="font-semibold text-[var(--collection-text)] text-sm break-words">
                      {customerDetails.fullName}
                    </p>
                    <p className="mt-0.5 break-words">{customerDetails.email}</p>
                    <p>{customerDetails.phone}</p>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[var(--collection-text-muted)] font-medium mb-1">
                      Delivery Address
                    </span>
                    <p className="break-words text-[var(--collection-text)]">{customerDetails.addressLine1}</p>
                    {customerDetails.addressLine2 && <p className="break-words text-[var(--collection-text)]">{customerDetails.addressLine2}</p>}
                    <p className="break-words">
                      {`${customerDetails.city}, ${customerDetails.state} - `}
                      <strong className="text-[var(--collection-text)]">{customerDetails.pincode}</strong>
                    </p>
                    {customerDetails.instructions && (
                      <p className="mt-2 text-[11px] italic text-[var(--collection-text)] bg-black/5 dark:bg-white/10 p-2.5 rounded-lg border border-[var(--collection-border)] break-words">
                        Instructions: &ldquo;{customerDetails.instructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#991B1B] italic">
                  No delivery address entered yet. Please return to Checkout.
                </p>
              )}
            </div>

            {/* Payment Method Selection Card */}
            <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--collection-border)] mb-4">
                <div className="flex items-center gap-2 text-[var(--collection-accent)]">
                  <CreditCard className="w-4 h-4" />
                  <h2 className="font-serif text-lg font-semibold text-[var(--collection-heading)]">
                    Choose Payment Method
                  </h2>
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--collection-accent)] font-semibold">
                  Secure Checkout
                </span>
              </div>

              <div>
                {/* Online Payment Option */}
                <div className="relative flex flex-col p-4 rounded-xl border border-[var(--collection-accent)] bg-black/5 dark:bg-white/10 shadow-xs ring-1 ring-[var(--collection-accent)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-xs sm:text-sm text-[var(--collection-text)] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[var(--collection-accent)]" />
                      <span>Online Payment</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Encrypted & Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--collection-text)] opacity-85 leading-relaxed">
                    UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Netbanking via Razorpay.
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Items Detailed Review */}
            <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--collection-border)] mb-4">
                <h2 className="font-serif text-lg font-semibold text-[var(--collection-heading)]">
                  Items Selected ({totals.payableItemsCount})
                </h2>
                <Link
                  to="/cart"
                  className="text-xs uppercase tracking-wider text-[var(--collection-accent)] hover:underline font-semibold"
                >
                  Edit Cart
                </Link>
              </div>

              <div className="divide-y divide-[var(--collection-border)]">
                {checkoutItems.map((item) => {
                  const lineId = item.id || item.lineId;
                  const name = item.name || item.product?.name;
                  const image = item.image || item.product?.image;
                  const price = item.price !== undefined ? item.price : item.product?.price;
                  const collectionId = item.collectionId || item.product?.collection;
                  const variantName = item.selectedVariant?.name || item.variantName;

                  const collectionLabel =
                    collectionId === 'jewellery'
                      ? 'Sterling Silver'
                      : collectionId === 'sarees'
                      ? 'Heritage Sarees'
                      : collectionId === 'tea'
                      ? 'Wellness Tea'
                      : 'Wholesome Pantry';
                  const categoryName = item.categoryName || item.product?.categoryName;

                  return (
                    <div key={lineId} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
                      <img
                        src={image}
                        alt={name}
                        className="w-16 h-16 object-cover rounded-xl border border-[var(--collection-border)] shrink-0"
                        onError={(e) => {
                          e.currentTarget.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23eee"/><text x="32" y="32" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Amoga</text></svg>';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[var(--collection-section-bg)] text-[var(--collection-accent)] border border-[var(--collection-border)]">
                            {collectionLabel}
                          </span>
                          {categoryName && (
                            <span className="text-[11px] text-[var(--collection-text-muted)] break-words">
                              • {categoryName}
                            </span>
                          )}
                          {variantName && (
                            <span className="text-[11px] text-[var(--collection-text)] font-medium break-words">
                              • {variantName}
                            </span>
                          )}
                          {(collectionId === 'tea' || item.packSize || item.product?.packSize) && (
                            <span className="text-[11px] text-[var(--collection-text)] font-medium break-words font-mono">
                              • Net Weight: {item.packSize || item.product?.packSize || '25 g'}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-sm text-[var(--collection-text)] break-words">
                          {name}
                        </h3>
                        <div className="text-[var(--collection-text-muted)] mt-1">
                          Unit Price: <span className="font-medium text-[var(--collection-text)]">{formatINR(price)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-[var(--collection-text-muted)] block">
                          Qty: <strong className="text-[var(--collection-text)]">{item.quantity}</strong>
                        </span>
                        <span className="font-sans text-base font-semibold text-[var(--collection-accent)] tabular-nums block mt-0.5">
                          {formatINR((price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Demo Simulation CTA (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 sm:p-7 border border-[var(--collection-border)] shadow-sm sticky top-28 space-y-6 transition-colors">
              <h2 className="font-serif text-xl text-[var(--collection-heading)] border-b border-[var(--collection-border)] pb-3">
                Your Order Summary
              </h2>

              <div className="space-y-3 text-xs text-[var(--collection-text)]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--collection-text-muted)]">Subtotal ({totals.payableItemsCount} items)</span>
                  <span className="font-sans text-sm font-semibold text-[var(--collection-text)] tabular-nums">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>

                {/* India Post Delivery Charges */}
                <div className="flex justify-between items-baseline text-[var(--collection-text-muted)]">
                  <div>
                    <span>{serverShipping.carrier || 'India Post'} Shipping</span>
                    <span className="block text-[10px] text-stone-500">
                      {serverShipping.isComplimentary
                        ? 'Complimentary (Order ≥ ₹2,500)'
                        : `${totals.payableItemsCount} ${totals.payableItemsCount === 1 ? 'piece' : 'pieces'} standard parcel`}
                    </span>
                  </div>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: serverShipping.isComplimentary ? '#059669' : 'var(--collection-text)' }}
                  >
                    {serverShipping.isComplimentary ? 'FREE' : formatINR(shippingFee)}
                  </span>
                </div>

                {/* Included GST Breakdown */}
                <div className="pt-2 border-t border-dashed border-[var(--collection-border)]">
                  <div className="flex justify-between items-baseline text-[var(--collection-text-muted)]">
                    <span>
                      Included GST <span className="text-[10px] text-stone-500">(Included in price)</span>
                    </span>
                    <span className="font-medium tabular-nums text-[var(--collection-text)]">
                      {serverShipping.totalTaxAmount > 0
                        ? `₹${Number(serverShipping.totalTaxAmount).toFixed(2)}`
                        : `₹${((totals.subtotal * 0.05) / 1.05).toFixed(2)}`}
                    </span>
                  </div>
                  {serverShipping.taxableAmount > 0 && (
                    <div className="flex justify-between items-baseline text-[10px] text-stone-500 mt-0.5">
                      <span>Taxable Value: ₹{Number(serverShipping.taxableAmount).toFixed(2)}</span>
                      <span>
                        {serverShipping.igstAmount > 0
                          ? `IGST: ₹${Number(serverShipping.igstAmount).toFixed(2)}`
                          : `CGST: ₹${Number(serverShipping.cgstAmount || 0).toFixed(2)} + SGST: ₹${Number(serverShipping.sgstAmount || 0).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t flex justify-between items-baseline" style={{ borderColor: 'var(--collection-border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--collection-heading)' }}>Total Amount</span>
                  <span className="font-sans text-2xl font-bold tabular-nums" style={{ color: 'var(--collection-accent)' }}>
                    {formatINR(finalPayableTotal)}
                  </span>
                </div>
              </div>

              {/* Payment CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={!cartValidation.isValid || !isCustomerValid || isSubmitting}
                  className="w-full py-4 px-5 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 text-center transition-all shadow-md cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{
                    backgroundColor: 'var(--collection-button-bg, var(--collection-accent))',
                    color: 'var(--collection-button-text, #FFFFFF)',
                  }}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting ? 'Initiating Payment Order...' : `Proceed to Secure Payment — ${formatINR(finalPayableTotal)}`}
                  </span>
                </button>

                <p className="mt-2.5 text-[11px] text-center text-[var(--collection-text)] opacity-85 leading-tight">
                  Encrypted Payment Gateway • Authoritative Server Pricing in INR
                </p>
              </div>

              {/* Navigation Links */}
              <div className="pt-4 border-t border-[var(--collection-border)] flex flex-col gap-2 text-center text-xs">
                <Link
                  to="/checkout"
                  className="text-[var(--collection-text)] opacity-85 hover:opacity-100 hover:text-[var(--collection-accent)] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Delivery Address</span>
                </Link>
                <Link
                  to="/cart"
                  className="text-[var(--collection-text)] opacity-75 hover:opacity-100 hover:text-[var(--collection-accent)] font-medium transition-colors"
                >
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Test Payment Gateway Modal */}
      {paymentModalOpen && paymentAttempt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292820]/60 backdrop-blur-sm animate-fade-in overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessingPayment) setPaymentModalOpen(false);
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
            className="bg-[var(--collection-card-bg)] rounded-3xl max-w-lg w-full border border-[var(--collection-border)] shadow-2xl overflow-hidden flex flex-col transition-colors overscroll-contain select-text"
          >
            {/* Modal Header */}
            <div
              className="px-6 py-5 flex items-center justify-between border-b transition-colors"
              style={{
                backgroundColor: 'var(--collection-page-bg)',
                borderColor: 'var(--collection-border)',
                color: 'var(--collection-heading)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs shrink-0"
                  style={{
                    backgroundColor: 'var(--collection-accent-light, rgba(255,255,255,0.08))',
                    borderColor: 'var(--collection-border)',
                    color: 'var(--collection-accent)',
                  }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="font-serif text-lg font-semibold tracking-wide"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Amoga Secure Checkout
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: 'var(--collection-accent-light, rgba(255,255,255,0.12))',
                        color: 'var(--collection-accent)',
                        borderColor: 'var(--collection-border)',
                      }}
                    >
                      Test Mode Simulation
                    </span>
                    <span
                      className="text-xs opacity-80"
                      style={{ color: 'var(--collection-text-muted)' }}
                    >
                      • No Real Money Charged
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isProcessingPayment) setPaymentModalOpen(false);
                }}
                disabled={isProcessingPayment}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: 'var(--collection-heading)' }}
                aria-label="Close payment modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="p-6 space-y-5 transition-colors"
              style={{ backgroundColor: 'var(--collection-card-bg)' }}
            >
              {/* Order & Payment References */}
              <div
                className="rounded-2xl p-5 border space-y-3 text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--collection-section-bg)',
                  borderColor: 'var(--collection-border)',
                  color: 'var(--collection-text)',
                }}
              >
                <div className="flex justify-between items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Order Reference:
                  </span>
                  <span
                    className="font-mono font-bold text-xs sm:text-sm tracking-wider"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    {paymentAttempt.orderReference}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Payment Attempt:
                  </span>
                  <span
                    className="font-mono font-medium text-xs break-all"
                    style={{ color: 'var(--collection-text)' }}
                  >
                    {paymentAttempt.paymentReference}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Provider Adapter:
                  </span>
                  <span
                    className="font-mono font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded border"
                    style={{
                      color: 'var(--collection-accent)',
                      borderColor: 'var(--collection-border)',
                      backgroundColor: 'var(--collection-card-bg)',
                    }}
                  >
                    {paymentAttempt.provider} (Isolated Test Adapter)
                  </span>
                </div>
                <div
                  className="pt-3 border-t flex justify-between items-baseline"
                  style={{ borderColor: 'var(--collection-border)' }}
                >
                  <span
                    className="font-semibold text-sm"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Authoritative Total:
                  </span>
                  <span
                    className="font-sans text-2xl font-bold tabular-nums"
                    style={{ color: 'var(--collection-accent)' }}
                  >
                    {formatINR(paymentAttempt.amount || totals.subtotal)}
                  </span>
                </div>
              </div>

              {/* Error message banner */}
              {paymentError && (
                <div className="p-3.5 bg-red-950/40 rounded-xl border border-red-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-300">Payment Failed</p>
                    <p className="mt-0.5 text-rose-200/90">{paymentError}</p>
                    <p className="mt-1 text-[11px] text-rose-300/80">Your shopping bag remains preserved. You can retry with a different outcome.</p>
                  </div>
                </div>
              )}

              {/* Test Mode Simulation Disclaimer */}
              <div
                className="p-3.5 rounded-xl border text-[11px] leading-relaxed transition-colors"
                style={{
                  backgroundColor: 'var(--collection-accent-light, rgba(255,255,255,0.06))',
                  borderColor: 'var(--collection-border)',
                }}
              >
                <p
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--collection-heading)' }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--collection-accent)' }} />
                  <span>Engineering Test Architecture</span>
                </p>
                <p
                  className="mt-1 leading-relaxed opacity-90 text-[11px]"
                  style={{ color: 'var(--collection-text)' }}
                >
                  Payment provider has not yet been selected. This interactive modal validates the backend signature verification, database transaction isolation, and idempotency pipeline.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecutePaymentSimulation('success')}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--collection-button-bg, var(--collection-accent))',
                    color: 'var(--collection-button-text, #FFFFFF)',
                  }}
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
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
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
