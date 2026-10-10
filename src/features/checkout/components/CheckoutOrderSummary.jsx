import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { formatINR } from '../../../utils/pricing';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const CheckoutOrderSummary = ({ compact = false }) => {
  const cartState = useStore((state) => state.cart);
  const cartItems = Array.isArray(cartState) ? cartState : (cartState?.items || []);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { subtotal, payableItemsCount, hasUnpricedItems, unpricedCount } = getCartTotals();

  const getCollectionBadge = (collectionId) => {
    switch (collectionId) {
      case 'food':
        return { label: 'Food', class: 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20' };
      case 'tea':
        return { label: 'Tea', class: 'bg-[#FAF1BB]/60 text-[#8C6320] border-[#B88E38]/30' };
      case 'sarees':
        return { label: 'Sarees', class: 'bg-[#7A1C2E]/10 text-[#7A1C2E] border-[#7A1C2E]/20' };
      case 'jewellery':
        return { label: 'Jewellery', class: 'bg-[#3A4556]/10 text-[#3A4556] border-[#3A4556]/20' };
      default:
        return { label: 'Amoga', class: 'bg-[#F8F6F0] text-[#292820] border-[#E5E0D5]' };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E0D5] shadow-sm sticky top-28">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D5] mb-4">
        <h2 className="font-serif text-xl text-[#292820]">Your Bag Items</h2>
        <span className="text-xs uppercase tracking-wider text-[#746F63] bg-[#F8F6F0] px-2.5 py-1 rounded-full border border-[#E5E0D5]">
          {payableItemsCount} {payableItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart item listing */}
      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? 'max-h-60' : 'max-h-80'}`}>
        {cartItems.map((item) => {
          const lineId = item.id || item.lineId;
          const name = item.name || item.product?.name;
          const image = item.image || item.product?.image;
          const price = item.price !== undefined ? item.price : item.product?.price;
          const collectionId = item.collectionId || item.product?.collection;
          const badge = getCollectionBadge(collectionId);
          return (
            <div
              key={lineId}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F8F6F0] border border-[#E5E0D5]/70 hover:border-[#E5E0D5] transition-all text-xs"
            >
              <img
                src={image}
                alt={name}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-[#E5E0D5]"
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
                    <span className="text-[10px] text-[#746F63] truncate">
                      • {item.selectedVariant.name}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-[#292820] truncate text-xs">
                  {name}
                </h3>
                <div className="flex items-center justify-between mt-1 text-[#746F63]">
                  <span>
                    Qty: <strong className="font-semibold text-[#292820]">{item.quantity}</strong> × {formatINR(price)}
                  </span>
                  <span className="font-semibold text-[#3F5A35]">
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
            {unpricedCount} unpriced item(s) detected. Must be removed before placing order.
          </p>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="mt-5 pt-4 border-t border-[#E5E0D5] space-y-2.5 text-xs text-[#292820]">
        <div className="flex justify-between items-baseline">
          <span className="text-[#746F63]">Subtotal</span>
          <span className="font-serif text-sm font-semibold text-[#292820]">
            {formatINR(subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[#746F63]">
          <span>Standard Delivery</span>
          <span className="italic text-[#3F5A35]">Complimentary</span>
        </div>
        <div className="flex justify-between items-baseline text-[#746F63]">
          <span>Taxes</span>
          <span className="italic">Included</span>
        </div>
        <div className="pt-3 border-t border-[#E5E0D5] flex justify-between items-baseline">
          <span className="text-sm font-semibold text-[#292820]">Payable Total</span>
          <span className="font-serif text-xl font-bold text-[#3F5A35]">
            {formatINR(subtotal)}
          </span>
        </div>
      </div>

      {/* Back to Cart link */}
      <div className="mt-4 pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs">
        <Link
          to="/cart"
          className="text-[#3F5A35] hover:underline font-medium"
        >
          ← Edit Items in Bag
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-[#166534]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Simulated Checkout</span>
        </div>
      </div>
    </div>
  );
};
