import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';

export const CartSummary = () => {
  const navigate = useNavigate();
  const getSelectedItems = useStore((state) => state.getSelectedItems);
  const getSelectedTotals = useStore((state) => state.getSelectedTotals);
  const cartState = useStore((state) => state.cart);
  const cartItems = Array.isArray(cartState) ? cartState : (cartState?.items || []);
  const initiateSelectiveCheckout = useStore((state) => state.initiateSelectiveCheckout);

  const selectedItems = getSelectedItems();
  const {
    subtotal: selectedSubtotal,
    totalCount: selectedQtyTotal,
    payableItemsCount,
    hasUnpricedItems,
    unpricedCount,
  } = getSelectedTotals();

  const selectedCount = selectedItems.length;
  const isSelectionEmpty = selectedCount === 0;
  const isCheckoutDisabled = isSelectionEmpty || hasUnpricedItems || payableItemsCount === 0;

  const handleCheckoutSelected = () => {
    if (isCheckoutDisabled) return;
    const result = initiateSelectiveCheckout();
    if (result.success) {
      navigate('/checkout');
    }
  };

  return (
    <div
      className="rounded-2xl p-6 lg:p-8 border shadow-sm sticky top-28 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-border)',
        color: 'var(--collection-text)',
      }}
    >
      <div className="flex items-center justify-between pb-4 border-b mb-6" style={{ borderColor: 'var(--collection-border)' }}>
        <h2
          className="font-serif text-2xl"
          style={{ color: 'var(--collection-heading)' }}
        >
          Order Summary
        </h2>
        <span
          className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--collection-section-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-accent)',
          }}
        >
          {selectedCount} of {cartItems.length} selected
        </span>
      </div>

      {/* Pricing Breakdown */}
      <div
        className="space-y-4 text-sm pb-6 border-b"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <div className="flex justify-between items-baseline">
          <span style={{ color: 'var(--collection-text-muted)' }}>
            Selected Items ({selectedQtyTotal} {selectedQtyTotal === 1 ? 'unit' : 'units'})
          </span>
          <span
            className="font-sans text-lg font-semibold tabular-nums"
            style={{ color: 'var(--collection-text)' }}
          >
            {formatINR(selectedSubtotal)}
          </span>
        </div>

        <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
          <span>Standard Delivery</span>
          <span
            className="text-right italic font-medium"
            style={{ color: 'var(--collection-accent)' }}
          >
            Complimentary during preview
          </span>
        </div>

        <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
          <span>Applicable Taxes & Duties</span>
          <span className="text-right italic">Included in displayed prices</span>
        </div>
      </div>

      {/* Empty Selection State Notice */}
      {isSelectionEmpty && (
        <div className="my-5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No Items Selected for Checkout</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Please check the box next to at least one product in your bag to purchase. Unselected products will remain saved in your bag.
            </p>
          </div>
        </div>
      )}

      {/* Safeguard Warning if selected items have unpriced items */}
      {!isSelectionEmpty && hasUnpricedItems && (
        <div className="my-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Checkout Safeguard Active</p>
            <p className="mt-0.5 text-amber-800/90 leading-relaxed">
              {unpricedCount} selected item has bespoke pricing pending approval. Please deselect it to proceed with your remaining items.
            </p>
          </div>
        </div>
      )}

      {/* Payable Total for Selected Items */}
      <div className="py-6 flex justify-between items-baseline">
        <div>
          <span className="text-base font-medium block" style={{ color: 'var(--collection-text)' }}>
            Selected Payable
          </span>
          <span className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
            Authoritatively confirmed at checkout
          </span>
        </div>
        <span
          className="font-sans text-3xl font-bold tabular-nums"
          style={{ color: 'var(--collection-accent)' }}
        >
          {formatINR(selectedSubtotal)}
        </span>
      </div>

      {/* Checkout Selected Items CTA */}
      <button
        type="button"
        onClick={handleCheckoutSelected}
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
        <span>
          {isSelectionEmpty
            ? 'Select Items to Checkout'
            : `Checkout Selected Items (${selectedCount})`}
        </span>
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
          <span>Selective purchase: unselected items remain in your bag</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Authoritative backend prices and integer paise precision</span>
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
