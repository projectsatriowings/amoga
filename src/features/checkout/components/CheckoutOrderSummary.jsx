import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';
import { AlertCircle, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

export const CheckoutOrderSummary = ({ compact = false }) => {
  const getCheckoutItems = useStore((state) => state.getCheckoutItems);
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);
  const checkoutContext = useStore((state) => state.checkoutContext);

  const checkoutItems = getCheckoutItems();
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCheckoutTotals();

  const isBuyNow = checkoutContext?.type === 'buy_now';

  const getCollectionBadge = (collectionId) => {
    switch (collectionId) {
      case 'food':
        return { label: 'Wholesome Pantry', class: 'bg-[#3F7B43]/10 text-[#3F7B43] border-[#3F7B43]/20' };
      case 'tea':
        return { label: 'Wellness Tea', class: 'bg-[#6C8461]/15 text-[#6C8461] border-[#6C8461]/30' };
      case 'sarees':
        return { label: 'Heritage Sarees', class: 'bg-[#6E263A]/10 text-[#6E263A] border-[#6E263A]/20' };
      case 'jewellery':
        return { label: 'Silver Jewellery', class: 'bg-[#737C86]/15 text-[#525B65] border-[#737C86]/30' };
      default:
        return { label: 'Amoga', class: 'bg-[var(--collection-section-bg)] text-[var(--collection-text)] border-[var(--collection-border)]' };
    }
  };

  return (
    <div className="bg-[var(--collection-card-bg)] rounded-2xl p-6 border border-[var(--collection-border)] shadow-sm sticky top-28 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--collection-border)] mb-4">
        <div>
          <h2 className="font-serif text-xl text-[var(--collection-heading)]">Order Review</h2>
          <span className="text-[11px] font-mono text-[var(--collection-text-muted)]">
            {isBuyNow ? 'Buy Now Direct Item' : 'Selected Line Items'}
          </span>
        </div>
        <span className="text-xs uppercase tracking-wider text-[var(--collection-text-muted)] bg-[var(--collection-section-bg)]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--collection-border)] shadow-2xs font-mono">
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
              className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--collection-section-bg)] border border-[var(--collection-border)]/70 hover:border-[var(--collection-border)] transition-all text-xs"
            >
              <img
                src={image}
                alt={name}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-[var(--collection-border)]"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23eee"/><text x="28" y="28" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="9">Amoga</text></svg>';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full border backdrop-blur-md shadow-2xs ${badge.class}`}>
                    {badge.label}
                  </span>
                  {item.selectedVariant?.name && (
                    <span className="text-[10px] text-[var(--collection-text-muted)] truncate">
                      • {item.selectedVariant.name}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-[var(--collection-text)] truncate text-xs">
                  {name}
                </h3>
                <div className="flex items-center justify-between mt-1 text-[var(--collection-text-muted)]">
                  <span>
                    Qty: <strong className="font-semibold text-[var(--collection-text)]">{item.quantity}</strong> × {formatINR(price)}
                  </span>
                  <span className="font-semibold text-[var(--collection-accent)]">
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

      {/* Pricing Summary */}
      <div className="mt-5 pt-4 border-t border-[var(--collection-border)] space-y-2.5 text-xs text-[var(--collection-text)]">
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--collection-text-muted)]">Items Subtotal</span>
          <span className="font-semibold tabular-nums text-sm text-[var(--collection-text)]">
            {formatINR(subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px] text-[var(--collection-text-muted)]">
          <span>Standard Delivery</span>
          <span className="text-[var(--collection-accent)] italic font-medium">
            Complimentary
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px] text-[var(--collection-text-muted)]">
          <span>Taxes & Duties</span>
          <span className="italic">Included</span>
        </div>
        <div className="pt-3 border-t border-[var(--collection-border)] flex justify-between items-baseline text-sm font-semibold">
          <span className="text-[var(--collection-heading)]">Payable Total</span>
          <span className="text-xl font-bold font-sans tabular-nums text-[var(--collection-accent)]">
            {formatINR(subtotal)}
          </span>
        </div>
      </div>

      {/* Return to Bag Link */}
      <div className="mt-5 pt-4 border-t border-[var(--collection-border)] text-center">
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
