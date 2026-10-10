import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';

export const CartSummary = () => {
  const navigate = useNavigate();
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCartTotals();

  const isCheckoutDisabled = payableItemsCount === 0 || hasUnpricedItems;

  return (
    <div
      className="rounded-2xl p-6 lg:p-8 border shadow-sm sticky top-28 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-border)',
        color: 'var(--collection-text)',
      }}
    >
      <h2
        className="font-serif text-2xl mb-6 flex items-center justify-between"
        style={{ color: 'var(--collection-heading)' }}
      >
        <span>Order Summary</span>
        <span
          className="text-xs font-sans uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--collection-section-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-text-muted)',
          }}
        >
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </h2>

      {/* Pricing Breakdown */}
      <div
        className="space-y-4 text-sm pb-6 border-b"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <div className="flex justify-between items-baseline">
          <span style={{ color: 'var(--collection-text-muted)' }}>
            Subtotal (Payable items)
          </span>
          <span
            className="font-sans text-lg font-semibold tabular-nums"
            style={{ color: 'var(--collection-text)' }}
          >
            {formatINR(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
          <span>Standard Delivery</span>
          <span
            className="text-right italic font-medium"
            style={{ color: 'var(--collection-accent)' }}
          >
            Complimentary during demo preview
          </span>
        </div>

        <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
          <span>Applicable Taxes & Duties</span>
          <span className="text-right italic">Included in displayed product pricing</span>
        </div>
      </div>

      {/* Safeguard Warning if unpriced items exist */}
      {hasUnpricedItems && (
        <div className="my-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Checkout Safeguard Active</p>
            <p className="mt-0.5 text-amber-800/90 leading-relaxed">
              {unpricedCount} {unpricedCount === 1 ? 'item has' : 'items have'} bespoke pricing pending approval. Please remove unpriced items to proceed to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Payable Total */}
      <div className="py-6 flex justify-between items-baseline">
        <div>
          <span className="text-base font-medium block" style={{ color: 'var(--collection-text)' }}>
            Estimated Payable
          </span>
          <span className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
            Final review on next step
          </span>
        </div>
        <span
          className="font-sans text-3xl font-bold tabular-nums"
          style={{ color: 'var(--collection-accent)' }}
        >
          {formatINR(subtotal)}
        </span>
      </div>

      {/* Checkout CTA */}
      <button
        type="button"
        onClick={() => navigate('/checkout')}
        disabled={isCheckoutDisabled}
        className={`w-full py-4 px-6 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
          isCheckoutDisabled
            ? 'opacity-40 cursor-not-allowed shadow-none'
            : 'active:scale-[0.99] hover:shadow-lg'
        }`}
        style={{
          backgroundColor: isCheckoutDisabled
            ? 'var(--collection-border)'
            : 'var(--collection-accent)',
          color: 'var(--collection-button-text, #FFFFFF)',
        }}
        onMouseEnter={(e) => {
          if (!isCheckoutDisabled) {
            e.currentTarget.style.backgroundColor = 'var(--collection-accent-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCheckoutDisabled) {
            e.currentTarget.style.backgroundColor = 'var(--collection-accent)';
          }
        }}
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Micro-assurance */}
      <div
        className="mt-6 pt-5 border-t space-y-2.5 text-xs"
        style={{
          borderColor: 'var(--collection-border)',
          color: 'var(--collection-text-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Authentic artisanal curation across Amoga collections</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Unified luxury shopping bag & verified pricing</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs uppercase tracking-wider hover:underline font-semibold"
          style={{ color: 'var(--collection-accent)' }}
        >
          &larr; Continue Browsing Collections
        </Link>
      </div>
    </div>
  );
};
