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
    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-[#E5E0D5] shadow-sm sticky top-28">
      <h2 className="font-serif text-2xl text-[#292820] mb-6 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-xs font-sans uppercase tracking-wider text-[#746F63] bg-[#F8F6F0] px-2.5 py-1 rounded-full border border-[#E5E0D5]">
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </h2>

      {/* Pricing Breakdown */}
      <div className="space-y-4 text-sm pb-6 border-b border-[#E5E0D5]">
        <div className="flex justify-between items-baseline text-[#292820]">
          <span className="font-sans text-[#746F63]">Subtotal (Payable items)</span>
          <span className="font-serif text-lg font-semibold text-[#292820]">
            {formatINR(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-start text-xs text-[#746F63]">
          <span>Standard Delivery</span>
          <span className="text-right italic text-[#3F5A35]">Complimentary during demo preview</span>
        </div>

        <div className="flex justify-between items-start text-xs text-[#746F63]">
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
          <span className="text-base font-medium text-[#292820] block">Estimated Payable</span>
          <span className="text-xs text-[#746F63]">Final review on next step</span>
        </div>
        <span className="font-serif text-3xl font-bold text-[#3F5A35]">
          {formatINR(subtotal)}
        </span>
      </div>

      {/* Checkout CTA */}
      <button
        onClick={() => navigate('/checkout')}
        disabled={isCheckoutDisabled}
        className={`w-full py-4 px-6 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md ${
          isCheckoutDisabled
            ? 'bg-[#898477]/30 text-[#746F63] cursor-not-allowed shadow-none'
            : 'bg-[#3F5A35] hover:bg-[#344B2C] text-white active:scale-[0.99] shadow-[#3F5A35]/20 hover:shadow-lg'
        }`}
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Micro-assurance */}
      <div className="mt-6 pt-5 border-t border-[#E5E0D5] space-y-2.5 text-xs text-[#746F63]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Authentic artisanal curation across Food, Tea, Sarees & Silver</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A46D] shrink-0" />
          <span>Multi-collection unified shopping bag</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs uppercase tracking-wider text-[#3F5A35] hover:underline font-semibold"
        >
          ← Continue Browsing Collections
        </Link>
      </div>
    </div>
  );
};
