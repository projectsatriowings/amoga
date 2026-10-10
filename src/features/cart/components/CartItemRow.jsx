import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { formatINR, isValidPrice } from '../../../utils/pricing';
import { useStore } from '../../../store/useStore';

export function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  const storeUpdateQuantity = useStore((state) => state.updateQuantity);
  const storeRemoveFromCart = useStore((state) => state.removeFromCart);

  const handleUpdate = onUpdateQuantity || storeUpdateQuantity;
  const handleRemove = onRemove || storeRemoveFromCart;

  const product = item.product || item;
  const quantity = item.quantity;
  const selectedVariant = item.selectedVariant;
  const lineId = item.id || item.lineId;
  const lineKey = lineId || product.id;
  const unitPrice = item.price !== undefined ? item.price : product.price;
  const hasPrice = isValidPrice(unitPrice);

  // Resolve collection-specific product URL
  const productUrl =
    product.collection === 'jewellery'
      ? `/jewellery/products/${product.slug}`
      : product.collection === 'sarees'
      ? `/sarees/products/${product.slug}`
      : product.collection === 'tea'
      ? `/tea/products/${product.slug}`
      : `/food/products/${product.slug}`;

  // Collection metadata label & styling
  const collectionBadge =
    product.collection === 'jewellery'
      ? { label: 'Silver Jewellery', color: 'bg-[#3A4556]/10 text-[#3A4556] border-[#3A4556]/20' }
      : product.collection === 'sarees'
      ? { label: 'Heritage Sarees', color: 'bg-[#7A1C2E]/10 text-[#7A1C2E] border-[#7A1C2E]/20' }
      : product.collection === 'tea'
      ? { label: 'Wellness Tea', color: 'bg-[#FAF1BB]/60 text-[#173B2A] border-[#65815A]/30' }
      : { label: 'Wholesome Pantry', color: 'bg-[#3F7B43]/10 text-[#173B2A] border-[#3F7B43]/20' };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border shadow-xs transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-border)',
        color: 'var(--collection-text)',
      }}
    >
      {/* Product Image & Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <Link to={productUrl} className="shrink-0 group">
          <div
            className="w-20 h-20 rounded-xl overflow-hidden border transition-transform group-hover:scale-[1.03]"
            style={{
              backgroundColor: 'var(--collection-section-bg)',
              borderColor: 'var(--collection-border)',
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f8f6f0"/><text x="40" y="40" dominant-baseline="middle" text-anchor="middle" fill="%23746f63" font-size="11">Amoga</text></svg>';
              }}
            />
          </div>
        </Link>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-2xs ${collectionBadge.color}`}
            >
              {collectionBadge.label}
            </span>
            {product.categoryName && (
              <span
                className="text-[11px] font-mono opacity-80"
                style={{ color: 'var(--collection-text-muted)' }}
              >
                &bull; {product.categoryName}
              </span>
            )}
          </div>

          <h3
            className="text-base font-serif font-medium transition-colors line-clamp-1"
            style={{ color: 'var(--collection-heading)' }}
          >
            <Link
              to={productUrl}
              className="hover:opacity-80 transition-opacity"
            >
              {product.name}
            </Link>
          </h3>

          {/* Selected Variant / Size display */}
          {selectedVariant && (
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              <span>Option:</span>
              {selectedVariant.hex && (
                <span
                  className="w-3 h-3 rounded-full border inline-block"
                  style={{
                    backgroundColor: selectedVariant.hex,
                    borderColor: 'var(--collection-border)',
                  }}
                />
              )}
              <span
                className="font-medium"
                style={{ color: 'var(--collection-text)' }}
              >
                {selectedVariant.name}
              </span>
            </div>
          )}

          {/* Unit Price */}
          <div
            className="text-xs pt-0.5"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            {hasPrice ? (
              <span>
                Unit Price:{' '}
                <strong
                  className="font-sans tabular-nums font-semibold"
                  style={{ color: 'var(--collection-text)' }}
                >
                  {formatINR(unitPrice)}
                </strong>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 font-mono text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                Price pending confirmation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity & Line Total */}
      <div
        className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        {/* Quantity Controls */}
        <div
          className="flex items-center gap-1 border rounded-xl px-2 py-1 transition-colors"
          style={{
            backgroundColor: 'var(--collection-input-bg)',
            borderColor: 'var(--collection-input-border)',
          }}
        >
          <button
            type="button"
            onClick={() => handleUpdate(lineKey, quantity - 1)}
            disabled={quantity <= 1}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
            style={{ color: 'var(--collection-text-muted)' }}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-xs font-mono font-bold px-2 min-w-[24px] text-center"
            style={{ color: 'var(--collection-text)' }}
            aria-label={`Current quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => handleUpdate(lineKey, quantity + 1)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--collection-text-muted)' }}
            aria-label={`Increase quantity of ${product.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Line Subtotal */}
        <div className="text-right min-w-[90px]">
          {hasPrice ? (
            <div
              className="text-base font-sans font-bold tabular-nums"
              style={{ color: 'var(--collection-accent)' }}
            >
              {formatINR(unitPrice * quantity)}
            </div>
          ) : (
            <div className="text-[11px] font-mono text-amber-700">
              Unverified
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => handleRemove(lineKey)}
          className="p-2 rounded-xl text-[#65675A] hover:text-red-700 hover:bg-red-500/10 transition-colors cursor-pointer"
          aria-label={`Remove ${product.name} from shopping bag`}
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
