import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const CheckoutOrderSummary = ({ compact = false }) => {
  const cart = useStore((state) => state.cart);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCartTotals();

  const getCollectionBadge = (collectionId) => {
    switch (collectionId) {
      case 'food':
        return { label: 'Food', class: 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20' };
      case 'sarees':
        return { label: 'Sarees', class: 'bg-[#7A1C2E]/10 text-[#7A1C2E] border-[#7A1C2E]/20' };
      case 'jewellery':
        return { label: 'Jewellery', class: 'bg-[#3A4556]/10 text-[#3A4556] border-[#3A4556]/20' };
      default:
        return { label: 'Amoga', class: 'bg-amoga-brass/20 text-amoga-charcoal border-amoga-brass/30' };
    }
  };

  return (
    <div className="bg-amoga-ivory rounded-2xl p-6 border border-amoga-brass/20 shadow-sm sticky top-28">
      <div className="flex items-center justify-between pb-4 border-b border-amoga-brass/15 mb-4">
        <h2 className="font-serif text-xl text-amoga-burgundy">Your Bag Items</h2>
        <span className="text-xs uppercase tracking-wider text-amoga-charcoal/60 bg-white/80 px-2.5 py-1 rounded-full border border-amoga-brass/20">
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart item listing */}
      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? 'max-h-60' : 'max-h-80'}`}>
        {cart.map((item) => {
          const badge = getCollectionBadge(item.collectionId);
          return (
            <div
              key={item.lineId}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-white/60 border border-amoga-brass/10 hover:border-amoga-brass/25 transition-all text-xs"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-amoga-brass/15"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23eee"/><text x="28" y="28" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="9">Amoga</text></svg>';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${badge.class}`}>
                    {badge.label}
                  </span>
                  {item.selectedVariant?.name && (
                    <span className="text-[10px] text-amoga-charcoal/60 truncate">
                      • {item.selectedVariant.name}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-amoga-charcoal truncate text-xs">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between mt-1 text-amoga-charcoal/70">
                  <span>
                    Qty: <strong className="font-semibold text-amoga-charcoal">{item.quantity}</strong> × {formatINR(item.price)}
                  </span>
                  <span className="font-semibold text-amoga-burgundy">
                    {formatINR((item.price || 0) * item.quantity)}
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
            {unpricedCount} unpriced item(s) detected. Must be removed before placing order.
          </p>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="mt-5 pt-4 border-t border-amoga-brass/15 space-y-2.5 text-xs text-amoga-charcoal">
        <div className="flex justify-between items-baseline">
          <span>Subtotal</span>
          <span className="font-serif text-sm font-semibold text-amoga-charcoal">
            {formatINR(subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-amoga-charcoal/70">
          <span>Standard Delivery</span>
          <span className="italic">Complimentary</span>
        </div>
        <div className="flex justify-between items-baseline text-amoga-charcoal/70">
          <span>Taxes</span>
          <span className="italic">Included</span>
        </div>
        <div className="pt-3 border-t border-amoga-brass/15 flex justify-between items-baseline">
          <span className="text-sm font-semibold text-amoga-charcoal">Payable Total</span>
          <span className="font-serif text-xl font-bold text-amoga-burgundy">
            {formatINR(subtotal)}
          </span>
        </div>
      </div>

      {/* Back to Cart link */}
      <div className="mt-4 pt-3 border-t border-amoga-brass/10 flex items-center justify-between text-xs">
        <Link
          to="/cart"
          className="text-amoga-burgundy hover:underline font-medium"
        >
          ← Edit Items in Cart
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Simulated Checkout</span>
        </div>
      </div>
    </div>
  );
};
