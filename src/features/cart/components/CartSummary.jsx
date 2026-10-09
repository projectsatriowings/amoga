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
    <div className="bg-amoga-ivory rounded-2xl p-6 lg:p-8 border border-amoga-brass/20 shadow-sm sticky top-28">
      <h2 className="font-serif text-2xl text-amoga-burgundy mb-6 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-xs font-sans uppercase tracking-widest text-amoga-charcoal/60 bg-white/80 px-2.5 py-1 rounded-full border border-amoga-brass/20">
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </h2>

      {/* Pricing Breakdown */}
      <div className="space-y-4 text-sm pb-6 border-b border-amoga-brass/15">
        <div className="flex justify-between items-baseline text-amoga-charcoal">
          <span className="font-sans">Subtotal (Payable items)</span>
          <span className="font-serif text-lg font-semibold text-amoga-charcoal">
            {formatINR(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-start text-xs text-amoga-charcoal/70">
          <span>Standard Delivery</span>
          <span className="text-right italic">Complimentary during demo preview</span>
        </div>

        <div className="flex justify-between items-start text-xs text-amoga-charcoal/70">
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
          <span className="text-base font-medium text-amoga-charcoal block">Estimated Payable</span>
          <span className="text-xs text-amoga-charcoal/60">Final review on next step</span>
        </div>
        <span className="font-serif text-3xl font-bold text-amoga-burgundy">
          {formatINR(subtotal)}
        </span>
      </div>

      {/* Checkout CTA */}
      <button
        onClick={() => navigate('/checkout')}
        disabled={isCheckoutDisabled}
        className={`w-full py-4 px-6 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md ${
          isCheckoutDisabled
            ? 'bg-amoga-charcoal/20 text-amoga-charcoal/40 cursor-not-allowed shadow-none'
            : 'bg-amoga-burgundy hover:bg-amoga-burgundy/90 text-amoga-ivory active:scale-[0.99] shadow-amoga-burgundy/15 hover:shadow-lg'
        }`}
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Micro-assurance */}
      <div className="mt-6 pt-5 border-t border-amoga-brass/10 space-y-2.5 text-xs text-amoga-charcoal/70">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Authentic artisanal curation across Food, Sarees & Silver</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amoga-gold shrink-0" />
          <span>Multi-collection unified shopping bag</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-amoga-burgundy/80 hover:text-amoga-burgundy font-semibold underline underline-offset-4"
        >
          ← Continue Browsing Collections
        </Link>
      </div>
    </div>
  );
};
