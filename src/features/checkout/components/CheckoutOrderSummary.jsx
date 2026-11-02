import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '../../../store/useStore';
import { formatINR, estimateIndiaPostShipping } from '../../../utils/pricing';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { resolveAvailability } from '../../../utils/inventory';
import { useShippingConfig } from '../../../hooks/useShippingConfig';
import { ReturnPolicyNoticeCard } from '../../../components/checkout/ReturnPolicyNoticeCard';

export const CheckoutOrderSummary = ({ compact = false }) => {
  const shouldReduceMotion = useReducedMotion();
  const { freeShippingThreshold, shippingThresholdOperator } = useShippingConfig();
  const getCheckoutItems = useStore((state) => state.getCheckoutItems);
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);
  const checkoutContext = useStore((state) => state.checkoutContext);

  const checkoutItems = getCheckoutItems();
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCheckoutTotals();

  const isBuyNow = checkoutContext?.type === 'buy_now';
  const shippingEst = estimateIndiaPostShipping({
    items: checkoutItems,
    itemCount: payableItemsCount,
    subtotal,
    freeShippingThreshold,
    thresholdOperator: shippingThresholdOperator,
  });
  const isFreeShipping = shippingEst.isFree;
  const shippingAmount = shippingEst.amount;

  const stockIssues = checkoutItems.filter((item) => {
    const product = item.product || item;
    const availability = resolveAvailability(product, item.selectedVariant);
    return (
      availability.isOutOfStock ||
      (availability.availableQuantity > 0 && item.quantity > availability.availableQuantity)
    );
  });

  const getCollectionBadge = (collectionId) => {
    switch (collectionId) {
      case 'food':
        return { label: 'Wholesome Pantry', class: 'bg-[#3F7B43]/10 text-[#2D5A30] border-[#3F7B43]/20' };
      case 'tea':
        return { label: 'Wellness Tea', class: 'bg-[#8C6320]/10 text-[#6B4B18] border-[#8C6320]/20' };
      case 'sarees':
        return { label: 'Heritage Sarees', class: 'bg-[#C5A46D]/15 text-[#722F37] border-[#C5A46D]/30' };
      case 'jewellery':
        return { label: 'Sterling Silver', class: 'bg-[#737C86]/10 text-[#495057] border-[#737C86]/20' };
      default:
        return { label: 'Amoga', class: 'bg-[#FAF8F5] text-[#5C5248] border-[#DDD5C7]' };
    }
  };

  return (
    <div
      className="rounded-2xl p-6 sm:p-7 border shadow-xs sticky top-24 transition-all space-y-6"
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-card-border, var(--collection-border))',
        color: 'var(--collection-text)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--collection-border)' }}>
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight" style={{ color: 'var(--collection-heading)' }}>
            Order Summary
          </h2>
          <span className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
            {isBuyNow ? 'Immediate Single Item' : 'Selected Cart Items'}
          </span>
        </div>
        <span
          className="text-[11px] font-mono px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--collection-section-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-text)',
          }}
        >
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Clean Product Row Layout */}
      <div className={`overflow-y-auto pr-1 ${compact ? 'max-h-60' : 'max-h-80'}`}>
        <AnimatePresence initial={false}>
          {checkoutItems.map((item, idx) => {
            const lineId = item.id || item.lineId;
            const name = item.name || item.product?.name;
            const image = item.image || item.product?.image;
            const price = item.price !== undefined ? item.price : item.product?.price;
            const collectionId = item.collectionId || item.product?.collection;
            const badge = getCollectionBadge(collectionId);

            return (
              <motion.div
                key={lineId}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, delay: shouldReduceMotion ? 0 : idx * 0.04 }}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5 text-xs border-b last:border-b-0"
                style={{ borderColor: 'var(--collection-border)' }}
              >
                <div className="relative shrink-0">
                  <img
                    src={image}
                    alt={name}
                    className="w-13 h-13 object-cover rounded-xl border"
                    style={{
                      borderColor: 'var(--collection-border)',
                      backgroundColor: 'var(--collection-section-bg)',
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52"><rect width="52" height="52" fill="%23f5f3ef"/><text x="26" y="26" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="9">Amoga</text></svg>';
                    }}
                  />
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full text-[10px] font-semibold flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: 'var(--collection-accent)',
                      color: 'var(--collection-button-text)',
                    }}
                  >
                    {item.quantity}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${badge.class}`}>
                      {badge.label}
                    </span>
                    {item.selectedVariant?.name && (
                      <span className="text-[10px]" style={{ color: 'var(--collection-text-muted)' }}>
                        &bull; {item.selectedVariant.name}
                      </span>
                    )}
                    {(collectionId === 'tea' || item.packSize || item.product?.packSize) && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--collection-text-muted)' }}>
                        &bull; {item.packSize || item.product?.packSize || '25 g'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-xs line-clamp-1" style={{ color: 'var(--collection-heading)' }}>
                    {name}
                  </h3>
                  <div className="flex items-center justify-between mt-1" style={{ color: 'var(--collection-text-muted)' }}>
                    <span>
                      Qty: {item.quantity} &times; {formatINR(price)}
                    </span>
                    <span className="font-semibold font-sans" style={{ color: 'var(--collection-heading)' }}>
                      {formatINR((price || 0) * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Safeguard if unpriced */}
      {hasUnpricedItems && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {unpricedCount} unpriced item(s) detected in checkout. Must be removed before placing order.
          </p>
        </div>
      )}

      {/* Safeguard if stock issues */}
      {stockIssues.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {stockIssues.length} item(s) exceed available stock. Please return to your cart to adjust quantities before placing order.
          </p>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="pt-4 border-t space-y-2.5 text-xs" style={{ borderColor: 'var(--collection-border)', color: 'var(--collection-text)' }}>
        <div className="flex justify-between items-baseline">
          <span style={{ color: 'var(--collection-text-muted)' }}>Product Subtotal</span>
          <span className="font-semibold tabular-nums text-sm font-sans" style={{ color: 'var(--collection-heading)' }}>
            {formatINR(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-[11px]">
          <div>
            <span style={{ color: 'var(--collection-text-muted)' }}>India Post Delivery</span>
            <span className="block text-[10px]" style={{ color: 'var(--collection-text-muted)' }}>
              {isFreeShipping
                ? (shippingEst.freeShippingReason || 'Free Shipping (Eligible)')
                : `${payableItemsCount} ${payableItemsCount === 1 ? 'piece' : 'pieces'} standard parcel`}
            </span>
          </div>
          <span
            className="font-semibold tabular-nums"
            style={{ color: isFreeShipping ? '#10B981' : 'var(--collection-heading)' }}
          >
            {isFreeShipping ? 'FREE' : formatINR(shippingAmount)}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-[11px]">
          <span style={{ color: 'var(--collection-text-muted)' }}>Included GST (5%)</span>
          <span className="tabular-nums font-medium" style={{ color: 'var(--collection-text)' }}>
            ₹{((subtotal * 0.05) / 1.05).toFixed(2)} (Taxable: ₹{(subtotal / 1.05).toFixed(2)})
          </span>
        </div>

        {/* Prominent Final Total */}
        <div className="pt-3 border-t flex justify-between items-baseline" style={{ borderColor: 'var(--collection-border)' }}>
          <div>
            <span className="font-serif text-base font-bold block" style={{ color: 'var(--collection-heading)' }}>
              Total Amount
            </span>
            <span className="text-[10px]" style={{ color: 'var(--collection-text-muted)' }}>
              Inclusive of GST & shipping
            </span>
          </div>
          <span className="text-2xl font-bold font-sans tabular-nums" style={{ color: 'var(--collection-accent)' }}>
            {formatINR(subtotal + shippingAmount)}
          </span>
        </div>
      </div>

      {/* Prominent Return Policy Notice Card */}
      <div className="pt-2">
        <ReturnPolicyNoticeCard compact />
      </div>

      {/* Return to Cart Link */}
      <div className="pt-3 border-t text-center" style={{ borderColor: 'var(--collection-border)' }}>
        <Link
          to="/cart"
          className="text-xs uppercase tracking-wider font-semibold transition-colors hover:underline"
          style={{ color: 'var(--collection-accent)' }}
        >
          &larr; Back to Cart
        </Link>
      </div>
    </div>
  );
};
