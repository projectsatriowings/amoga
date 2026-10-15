import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { resolveAvailability } from '../../../utils/inventory';

export const CheckoutOrderSummary = ({ compact = false }) => {
  const getCheckoutItems = useStore((state) => state.getCheckoutItems);
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);
  const checkoutContext = useStore((state) => state.checkoutContext);

  const checkoutItems = getCheckoutItems();
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCheckoutTotals();

  const isBuyNow = checkoutContext?.type === 'buy_now';

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
        return { label: 'Wholesome Pantry', class: 'bg-[#3F7B43]/15 text-[#3F7B43] border-[#3F7B43]/30' };
      case 'tea':
        return { label: 'Wellness Tea', class: 'bg-[#8C6320]/15 text-[#8C6320] border-[#8C6320]/30' };
      case 'sarees':
        return { label: 'Heritage Sarees', class: 'bg-[#C5A46D]/20 text-[#C5A46D] border-[#C5A46D]/40' };
      case 'jewellery':
        return { label: 'Sterling Silver', class: 'bg-[#737C86]/20 text-[#D4D7D9] border-[#737C86]/40' };
      default:
        return { label: 'Amoga', class: 'bg-[var(--collection-section-bg)] text-[var(--collection-text)] border-[var(--collection-border)]' };
    }
  };

  return (
    <div
      className="rounded-2xl p-6 border shadow-sm sticky top-28 transition-colors"
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-card-border, var(--collection-border))',
      }}
    >
      <div
        className="flex items-center justify-between pb-4 border-b mb-4"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <div>
          <h2
            className="font-serif text-xl"
            style={{ color: 'var(--collection-heading)' }}
          >
            Order Review
          </h2>
          <span
            className="text-[11px] font-mono"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            {isBuyNow ? 'Buy Now Direct Item' : 'Selected Line Items'}
          </span>
        </div>
        <span
          className="text-xs uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs font-mono"
          style={{
            backgroundColor: 'var(--collection-section-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-text-muted)',
          }}
        >
          {payableItemsCount} {payableItemsCount === 1 ? 'unit' : 'units'}
        </span>
      </div>

      {/* Checkout item listing (ONLY selected items or buy now item) */}
      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? 'max-h-60' : 'max-h-80'}`}>
        {checkoutItems.map((item) => {
          const lineId = item.id || item.lineId;
          const name = item.name || item.product?.name;
          const image = item.image || item.product?.image;
          const price = item.price !== undefined ? item.price : item.product?.price;
          const collectionId = item.collectionId || item.product?.collection;
          const badge = getCollectionBadge(collectionId);
          return (
            <div
              key={lineId}
              className="flex items-start gap-3 p-3 rounded-xl border transition-all text-xs"
              style={{
                backgroundColor: 'var(--collection-section-bg)',
                borderColor: 'var(--collection-border)',
              }}
            >
              <img
                src={image}
                alt={name}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border"
                style={{ borderColor: 'var(--collection-border)' }}
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23eee"/><text x="28" y="28" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="9">Amoga</text></svg>';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full border shadow-2xs ${badge.class}`}>
                    {badge.label}
                  </span>
                  {item.selectedVariant?.name && (
                    <span
                      className="text-[10px] break-words"
                      style={{ color: 'var(--collection-text-muted)' }}
                    >
                      • {item.selectedVariant.name}
                    </span>
                  )}
                </div>
                <h3
                  className="font-medium break-words text-xs"
                  style={{ color: 'var(--collection-text)' }}
                >
                  {name}
                </h3>
                <div
                  className="flex items-center justify-between mt-1"
                  style={{ color: 'var(--collection-text-muted)' }}
                >
                  <span>
                    Qty: <strong className="font-semibold" style={{ color: 'var(--collection-text)' }}>{item.quantity}</strong> × {formatINR(price)}
                  </span>
                  <span
                    className="font-semibold font-sans"
                    style={{ color: 'var(--collection-accent)' }}
                  >
                    {formatINR((price || 0) * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safeguard if unpriced */}
      {hasUnpricedItems && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {unpricedCount} unpriced item(s) detected in checkout. Must be removed before placing order.
          </p>
        </div>
      )}

      {/* Safeguard if stock issues */}
      {stockIssues.length > 0 && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {stockIssues.length} item(s) exceed available stock. Please return to your shopping bag to adjust quantities before placing order.
          </p>
        </div>
      )}

      {/* Pricing Summary */}
      <div
        className="mt-5 pt-4 border-t space-y-2.5 text-xs"
        style={{
          borderColor: 'var(--collection-border)',
          color: 'var(--collection-text)',
        }}
      >
        <div className="flex justify-between items-baseline">
          <span style={{ color: 'var(--collection-text-muted)' }}>Items Subtotal</span>
          <span
            className="font-semibold tabular-nums text-sm font-sans"
            style={{ color: 'var(--collection-text)' }}
          >
            {formatINR(subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px]">
          <span style={{ color: 'var(--collection-text-muted)' }}>Standard Delivery</span>
          <span
            className="italic font-medium"
            style={{ color: 'var(--collection-accent)' }}
          >
            Complimentary
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px]">
          <span style={{ color: 'var(--collection-text-muted)' }}>Taxes & Duties</span>
          <span className="italic" style={{ color: 'var(--collection-text-muted)' }}>Included</span>
        </div>
        <div
          className="pt-3 border-t flex justify-between items-baseline text-sm font-semibold"
          style={{ borderColor: 'var(--collection-border)' }}
        >
          <span
            className="font-serif text-base"
            style={{ color: 'var(--collection-heading)' }}
          >
            Payable Total
          </span>
          <span
            className="text-xl font-bold font-sans tabular-nums"
            style={{ color: 'var(--collection-accent)' }}
          >
            {formatINR(subtotal)}
          </span>
        </div>
      </div>

      {/* Return to Bag Link */}
      <div
        className="mt-5 pt-4 border-t text-center"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <Link
          to="/cart"
          className="text-xs uppercase tracking-wider font-semibold hover:underline"
          style={{ color: 'var(--collection-accent)' }}
        >
          &larr; Return to Shopping Bag
        </Link>
      </div>
    </div>
  );
};
