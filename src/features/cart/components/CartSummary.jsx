import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { formatINR, calculateGstInclusiveBreakdown, estimateIndiaPostShipping } from '../../../utils/pricing';
import { resolveAvailability } from '../../../utils/inventory';
import { Truck, Info } from 'lucide-react';
import { useShippingConfig } from '../../../hooks/useShippingConfig';

export const CartSummary = () => {
  const navigate = useNavigate();
  const { freeShippingThreshold, shippingThresholdOperator } = useShippingConfig();
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

  const stockIssues = selectedItems.filter((item) => {
    const product = item.product || item;
    const availability = resolveAvailability(product, item.selectedVariant);
    return (
      availability.isOutOfStock ||
      (availability.availableQuantity > 0 && item.quantity > availability.availableQuantity)
    );
  });
  const hasStockIssues = stockIssues.length > 0;

  const selectedCount = selectedItems.length;
  const isSelectionEmpty = selectedCount === 0;
  const isCheckoutDisabled =
    isSelectionEmpty || hasUnpricedItems || payableItemsCount === 0 || hasStockIssues;

  const handleCheckoutSelected = () => {
    if (isCheckoutDisabled) return;
    const result = initiateSelectiveCheckout();
    if (result.success) {
      navigate('/checkout');
    }
  };

  // Calculate itemized GST breakdown for selected items
  const taxBreakdown = selectedItems.reduce(
    (acc, item) => {
      const unitPrice = item.price !== undefined ? item.price : item.product?.price || 0;
      const qty = item.quantity || 1;
      const lineTotal = unitPrice * qty;
      const rate = Number(item.gstRate || item.product?.gstRate || 5);
      const breakdown = calculateGstInclusiveBreakdown(lineTotal, rate);
      acc.taxableValue += breakdown.taxableValue;
      acc.includedGst += breakdown.includedGst;
      return acc;
    },
    { taxableValue: 0, includedGst: 0 }
  );

  // Authoritative India Post shipping estimate
  const shippingEst = estimateIndiaPostShipping({
    items: selectedItems,
    itemCount: selectedQtyTotal,
    subtotal: selectedSubtotal,
    freeShippingThreshold,
    thresholdOperator: shippingThresholdOperator,
  });

  const estimatedShippingCharge = isSelectionEmpty ? 0 : shippingEst.amount;
  const isComplimentaryShipping = isSelectionEmpty || shippingEst.isFree;
  const finalPayableTotal = Math.max(0, selectedSubtotal + estimatedShippingCharge);

  // Determine guidance message for free shipping based on cart composition
  const teaQty = shippingEst.teaQuantity || 0;
  const teaSub = shippingEst.netTeaSubtotal || 0;
  const stdQty = shippingEst.standardQuantity || 0;
  const stdSub = shippingEst.netStandardSubtotal || 0;

  let freeShippingGuidance = '';
  if (!isComplimentaryShipping && !isSelectionEmpty) {
    if (teaQty > 0 && stdQty === 0) {
      // Only tea in cart
      const neededPacks = Math.max(0, 5 - teaQty);
      const neededAmount = Math.max(0, 1000 - teaSub);
      if (neededPacks > 0 && neededAmount > 0) {
        freeShippingGuidance = `Add ${neededPacks} more tea pack${neededPacks > 1 ? 's' : ''} and ₹${neededAmount.toLocaleString('en-IN')} more to get Free Delivery (Requires ≥5 packs & ≥₹1,000)`;
      } else if (neededPacks > 0) {
        freeShippingGuidance = `Add ${neededPacks} more tea pack${neededPacks > 1 ? 's' : ''} to get Free Delivery (Requires ≥5 packs & ≥₹1,000)`;
      } else {
        freeShippingGuidance = `Add ₹${neededAmount.toLocaleString('en-IN')} more in tea to get Free Delivery (Requires ≥5 packs & ≥₹1,000)`;
      }
    } else if (stdQty > 0 && teaQty === 0) {
      // Only standard collections
      const remainingForFreeShipping = Math.max(0, freeShippingThreshold - stdSub);
      freeShippingGuidance = `Add ₹${remainingForFreeShipping.toLocaleString('en-IN')} more to qualify for Free India Post Delivery (Orders ≥ ₹${freeShippingThreshold.toLocaleString('en-IN')})`;
    } else {
      // Mixed cart
      const remainingForFreeShipping = Math.max(0, freeShippingThreshold - stdSub);
      const neededPacks = Math.max(0, 5 - teaQty);
      const neededAmount = Math.max(0, 1000 - teaSub);
      freeShippingGuidance = `Qualify for Free Delivery: standard items reach ₹${freeShippingThreshold.toLocaleString('en-IN')} (add ₹${remainingForFreeShipping.toLocaleString('en-IN')}), OR tea reaches ≥5 packs & ≥₹1,000 (currently ${teaQty} packs, ₹${Math.round(teaSub)}).`;
    }
  }

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
          Your Order Summary
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

      {/* Free Delivery Threshold Banner */}
      {!isSelectionEmpty && (
        <div
          className={`mb-6 p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            isComplimentaryShipping
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-[#FDFBF7] border-[#EAE4D9] text-[#4A423B]'
          }`}
        >
          <Truck className={`w-4 h-4 shrink-0 ${isComplimentaryShipping ? 'text-emerald-600' : 'text-[#8C7A6B]'}`} />
          <div className="flex-1">
            {isComplimentaryShipping ? (
              <div>
                <p className="font-semibold text-emerald-800">
                  Unlocked: Free India Post Delivery!
                </p>
                {shippingEst.freeShippingReason && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {shippingEst.freeShippingReason}
                  </p>
                )}
              </div>
            ) : (
              <p className="leading-tight">
                {freeShippingGuidance}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div
        className="space-y-4 text-sm pb-6 border-b"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <div className="flex justify-between items-baseline">
          <span style={{ color: 'var(--collection-text-muted)' }}>
            Product Subtotal ({selectedQtyTotal} {selectedQtyTotal === 1 ? 'unit' : 'units'})
          </span>
          <span
            className="font-sans text-lg font-semibold tabular-nums"
            style={{ color: 'var(--collection-text)' }}
          >
            {formatINR(selectedSubtotal)}
          </span>
        </div>

        {/* India Post Delivery Charges */}
        <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
          <div>
            <span className="font-medium">India Post Shipping</span>
            {!isSelectionEmpty && (
              <span className="block text-[10px] text-stone-500 mt-0.5">
                {isComplimentaryShipping
                  ? (shippingEst.freeShippingReason || `Complimentary (Free Shipping Qualified)`)
                  : selectedQtyTotal <= 2
                  ? '1–2 pieces bracket (₹100)'
                  : selectedQtyTotal === 3
                  ? '3 pieces bracket (₹150)'
                  : selectedQtyTotal === 4
                  ? '4 pieces bracket (₹200)'
                  : `5+ pieces bracket (₹200 + ${selectedQtyTotal - 4} × ₹50)`}
              </span>
            )}
          </div>
          <span
            className="text-right font-semibold tabular-nums"
            style={{ color: isComplimentaryShipping ? '#059669' : 'var(--collection-text)' }}
          >
            {isComplimentaryShipping ? 'FREE' : formatINR(estimatedShippingCharge)}
          </span>
        </div>

        {/* GST Inclusive Notice and Exact Breakdown */}
        <div className="pt-2 border-t border-dashed" style={{ borderColor: 'var(--collection-border)' }}>
          <div className="flex justify-between items-start text-xs" style={{ color: 'var(--collection-text-muted)' }}>
            <span className="flex items-center gap-1">
              <span>Included GST</span>
              <span className="text-[10px] text-stone-500 font-normal">(Included in price)</span>
            </span>
            <span className="text-right font-medium tabular-nums" style={{ color: 'var(--collection-text)' }}>
              {isSelectionEmpty ? '₹0.00' : `₹${taxBreakdown.includedGst.toFixed(2)}`}
            </span>
          </div>
          {!isSelectionEmpty && taxBreakdown.taxableValue > 0 && (
            <p className="text-[10px] text-stone-500 text-right mt-0.5">
              Taxable Value: ₹{taxBreakdown.taxableValue.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Empty Selection State Notice */}
      {isSelectionEmpty && (
        <div className="my-5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No Items Selected for Checkout</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Please check the box next to at least one product in your cart to purchase. Unselected products will remain saved in your cart.
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

      {/* Stock Availability Safeguard Warning */}
      {!isSelectionEmpty && hasStockIssues && (
        <div className="my-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Inventory Safeguard Active</p>
            <p className="mt-0.5 text-rose-800 leading-relaxed">
              {stockIssues.length} selected item(s) are out of stock or exceed current warehouse inventory. Please adjust quantities before checkout.
            </p>
          </div>
        </div>
      )}

      {/* Total Amount for Selected Items */}
      <div className="py-6 flex justify-between items-baseline">
        <div>
          <span className="text-base font-medium block" style={{ color: 'var(--collection-text)' }}>
            Total Amount
          </span>
          <span className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
            Inclusive of all taxes
          </span>
        </div>
        <span
          className="font-sans text-3xl font-bold tabular-nums"
          style={{ color: 'var(--collection-accent)' }}
        >
          {formatINR(finalPayableTotal)}
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
            : hasStockIssues
            ? 'Adjust Stock Quantities to Proceed'
            : `Continue to Checkout (${selectedCount})`}
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
          <span>Unselected items remain saved in your cart</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Secure payments with Razorpay</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs uppercase tracking-wider hover:underline font-semibold"
          style={{ color: 'var(--collection-accent)' }}
        >
          &larr; Shop Collections
        </Link>
      </div>
    </div>
  );
};
