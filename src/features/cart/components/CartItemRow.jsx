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
      ? { label: 'Silver Jewellery', color: 'bg-[#B9B8B5]/15 text-[#B9B8B5] border-[#B9B8B5]/30' }
      : product.collection === 'sarees'
      ? { label: 'Heritage Sarees', color: 'bg-[#C5A46D]/15 text-[#C5A46D] border-[#C5A46D]/30' }
      : product.collection === 'tea'
      ? { label: 'Herbal Tea', color: 'bg-[#FAF1BB]/30 text-[#8C6320] border-[#B88E38]/40' }
      : { label: 'Gourmet Food', color: 'bg-[#287A25]/15 text-[#557C36] border-[#287A25]/30' };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Product Image & Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <Link to={productUrl} className="shrink-0 group">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/20 border border-white/10">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        </Link>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${collectionBadge.color}`}
            >
              {collectionBadge.label}
            </span>
            {product.categoryName && (
              <span className="text-[11px] font-mono text-white/40">
                &bull; {product.categoryName}
              </span>
            )}
          </div>

          <h3 className="text-base font-serif font-medium text-white hover:text-white/80 transition-colors line-clamp-1">
            <Link to={productUrl}>{product.name}</Link>
          </h3>

          {/* Selected Variant / Size display */}
          {selectedVariant && (
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="text-white/40">Option:</span>
              {selectedVariant.hex && (
                <span
                  className="w-3 h-3 rounded-full border border-white/30 inline-block"
                  style={{ backgroundColor: selectedVariant.hex }}
                />
              )}
              <span className="font-medium text-white/90">{selectedVariant.name}</span>
            </div>
          )}

          {/* Unit Price */}
          <div className="text-xs text-white/60 pt-0.5">
            {hasPrice ? (
              <span>Unit Price: {formatINR(unitPrice)}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                Price pending confirmation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity & Line Total */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2 py-1">
          <button
            type="button"
            onClick={() => handleUpdate(lineKey, quantity - 1)}
            disabled={quantity <= 1}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-xs font-mono font-bold text-white px-2 min-w-[24px] text-center"
            aria-label={`Current quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => handleUpdate(lineKey, quantity + 1)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={`Increase quantity of ${product.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Line Subtotal */}
        <div className="text-right min-w-[90px]">
          {hasPrice ? (
            <div className="text-base font-serif font-bold text-white">
              {formatINR(unitPrice * quantity)}
            </div>
          ) : (
            <div className="text-[11px] font-mono text-amber-400">
              Unverified
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => handleRemove(lineKey)}
          className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label={`Remove ${product.name} from shopping bag`}
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
