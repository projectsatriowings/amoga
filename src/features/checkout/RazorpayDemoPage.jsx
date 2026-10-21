import React, { useState } from 'react';
import { RazorpayCheckoutButton } from '../../components/checkout/RazorpayCheckoutButton';

export function RazorpayDemoPage() {
  const [amountInr, setAmountInr] = useState(100);
  const [customerName, setCustomerName] = useState('Amoga Test User');
  const [customerEmail, setCustomerEmail] = useState('test@amogastores.com');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [paymentResult, setPaymentResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  const keyId =
    import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TqVAoKqnaVprE1';

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#F4F4F2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[#2A2B30] pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Razorpay Test Mode Active
          </div>
          <h1 className="text-3xl font-serif text-[#EAE6DF] tracking-tight">
            Razorpay Standard Web Checkout
          </h1>
          <p className="mt-2 text-sm text-[#A09A90]">
            Complete 3-step payment flow: Order Creation, Checkout Modal & Server-Side Signature Verification.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 rounded-xl bg-[#17181D] border border-[#2A2B30] shadow-xl space-y-6">
          <h2 className="text-lg font-medium text-[#EAE6DF] border-b border-[#2A2B30] pb-3">
            Checkout Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A09A90] mb-1">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amountInr}
                onChange={(e) => setAmountInr(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0E0F12] border border-[#3A3B42] text-[#F4F4F2] focus:outline-none focus:border-[#722F37] transition text-sm"
              />
              <span className="text-[11px] text-[#7A7167] mt-1 block">
                Minimum: ₹1 (100 paise)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A09A90] mb-1">
                Active Key ID
              </label>
              <input
                type="text"
                readOnly
                value={keyId}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0E0F12] border border-[#3A3B42] text-[#7A7167] text-xs font-mono select-all cursor-text"
              />
              <span className="text-[11px] text-[#7A7167] mt-1 block">
                Public client key from environment
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A09A90] mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0E0F12] border border-[#3A3B42] text-[#F4F4F2] focus:outline-none focus:border-[#722F37] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A09A90] mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0E0F12] border border-[#3A3B42] text-[#F4F4F2] focus:outline-none focus:border-[#722F37] transition text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A09A90] mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0E0F12] border border-[#3A3B42] text-[#F4F4F2] focus:outline-none focus:border-[#722F37] transition text-sm"
              />
            </div>
          </div>

          {/* Checkout Button Trigger */}
          <div className="pt-4 border-t border-[#2A2B30] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#EAE6DF]">
                Total: ₹{amountInr.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#7A7167]">
                ({Math.round(amountInr * 100)} paise)
              </p>
            </div>

            <RazorpayCheckoutButton
              amount={amountInr}
              currency="INR"
              name="Amoga Standard Checkout"
              description={`Test payment of ₹${amountInr}`}
              prefill={{
                name: customerName,
                email: customerEmail,
                contact: customerPhone,
              }}
              buttonText={`Pay ₹${amountInr} with Razorpay`}
              onSuccess={(res) => {
                setPaymentResult(res);
                setLastError(null);
              }}
              onError={(err) => {
                setLastError(err.message || String(err));
              }}
              onDismiss={() => {
                setLastError('User dismissed Razorpay checkout window.');
              }}
            />
          </div>
        </div>

        {/* Verification / Result Card */}
        {paymentResult && (
          <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-base font-semibold text-emerald-300">
                  Payment Verified Successfully!
                </h3>
                <p className="text-xs text-emerald-500">
                  HMAC-SHA256 signature verified against Razorpay Key Secret.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#0E0F12]/80 p-4 rounded-lg border border-[#2A2B30]">
              <div className="flex justify-between">
                <span className="text-[#A09A90]">Order ID:</span>
                <span className="text-[#EAE6DF] font-semibold">{paymentResult.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A09A90]">Payment ID:</span>
                <span className="text-emerald-400 font-semibold">{paymentResult.payment_id}</span>
              </div>
              <div className="flex justify-between truncate">
                <span className="text-[#A09A90]">Signature:</span>
                <span className="text-[#A09A90] truncate max-w-xs">{paymentResult.signature}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentResult(null);
                setLastError(null);
              }}
              className="text-xs text-[#A09A90] hover:text-[#F4F4F2] underline underline-offset-4"
            >
              Reset & Test Again
            </button>
          </div>
        )}

        {/* Error Alert */}
        {lastError && !paymentResult && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800 text-rose-300 text-xs space-y-1">
            <p className="font-semibold">Notice / Error:</p>
            <p className="text-rose-400">{lastError}</p>
          </div>
        )}

        {/* Integration Instructions */}
        <div className="p-6 rounded-xl bg-[#17181D]/60 border border-[#2A2B30] space-y-4 text-xs text-[#A09A90]">
          <h4 className="font-semibold text-[#EAE6DF] uppercase tracking-wider">
            Architecture Summary
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-[#EAE6DF]">Order Creation:</strong> Calls <code className="text-rose-400">POST /api/create-order</code> with amount (in paise), currency, and receipt ID.
            </li>
            <li>
              <strong className="text-[#EAE6DF]">Standard Checkout Modal:</strong> Triggered via <code className="text-rose-400">new window.Razorpay(options).open()</code>.
            </li>
            <li>
              <strong className="text-[#EAE6DF]">Server Verification:</strong> Verifies <code className="text-rose-400">crypto.timingSafeEqual</code> HMAC-SHA256 signature via <code className="text-rose-400">POST /api/verify-payment</code>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
export default RazorpayDemoPage;
