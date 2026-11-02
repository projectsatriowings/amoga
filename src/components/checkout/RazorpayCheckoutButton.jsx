import React, { useState } from 'react';

/**
 * Standard Razorpay Checkout Button Component
 * 
 * Implements:
 * 1. Order Creation via POST /api/create-order
 * 2. Razorpay Standard Checkout Modal invocation (window.Razorpay)
 * 3. Payment Signature Verification via POST /api/verify-payment
 * 4. Dismissal and Failure event handling with user alerts
 */
export function RazorpayCheckoutButton({
  amount = 100, // In INR by default (or paise if isPaise is true)
  isPaise = false,
  currency = 'INR',
  receipt = '',
  name = 'Amoga Luxury Store',
  description = 'Test Mode Standard Checkout',
  prefill = {
    name: 'Test Customer',
    email: 'test@amogastores.com',
    contact: '9999999999',
  },
  themeColor = '#722F37', // Amoga signature burgundy
  buttonText = 'Pay with Razorpay',
  className = '',
  onSuccess,
  onError,
  onDismiss,
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Helper to ensure Razorpay checkout.js script is available in DOM
  const ensureRazorpayLoaded = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage('Creating Razorpay order...');

      // 1. Calculate amount in paise (minimum 100 paise)
      const amountInPaise = isPaise ? Math.round(amount) : Math.round(amount * 100);
      if (amountInPaise < 100) {
        throw new Error('Minimum order amount must be at least ₹1 (100 paise).');
      }

      // 2. Call backend to create Razorpay Order
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: currency.toUpperCase(),
          receipt: receipt || `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await createOrderRes.json();
      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.message || 'Failed to create order with Razorpay.');
      }

      setStatusMessage('Opening payment gateway...');

      // 3. Ensure Razorpay script is loaded
      const scriptReady = await ensureRazorpayLoaded();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout script. Please check your network connection.');
      }

      // Razorpay Key ID precedence: Vite client env -> order response -> default test key
      const keyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        orderData.key_id ||
        'rzp_test_TqVAoKqnaVprE1';

      // 4. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id,
        prefill,
        theme: {
          color: themeColor,
        },
        handler: async (response) => {
          try {
            setLoading(true);
            setStatusMessage('Verifying payment signature...');

            // Step 3: Backend signature verification
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.message || 'Signature verification failed.');
            }

            setStatusMessage('Payment verified successfully!');
            if (onSuccess) {
              onSuccess({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                verificationResult: verifyData,
              });
            }
          } catch (verifyError) {
            console.error('[RAZORPAY VERIFY ERROR]:', verifyError);
            setErrorMessage(verifyError.message || 'Signature verification failed.');
            if (onError) onError(verifyError);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatusMessage(null);
            setErrorMessage('Payment cancelled. Checkout modal was closed.');
            if (onDismiss) onDismiss();
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure event
      rzp.on('payment.failed', (failedResponse) => {
        setLoading(false);
        const errDesc = failedResponse.error?.description || 'Payment transaction failed.';
        setErrorMessage(`Transaction Failed: ${errDesc}`);
        if (onError) onError(failedResponse.error);
      });

      rzp.open();
    } catch (err) {
      console.error('[RAZORPAY CHECKOUT ERROR]:', err);
      setLoading(false);
      setStatusMessage(null);
      setErrorMessage(err.message || 'Payment initiation failed.');
      if (onError) onError(err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={
          className ||
          'inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold tracking-wide text-white bg-[#722F37] hover:bg-[#8B3A44] active:bg-[#5C252C] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg'
        }
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>

      {statusMessage && !errorMessage && (
        <p className="text-xs text-emerald-400 font-medium">{statusMessage}</p>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
