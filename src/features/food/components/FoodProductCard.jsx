import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export function FoodProductCard({ product }) {
  const { addToCart, toggleWishlistItem, isInWishlist } = useStore();
  const inWishlist = isInWishlist(product.id);
  const hasPrice = product.price !== null;

  return (
    <article
      className="group relative rounded-2xl bg-[#FFFFFF] border border-[#E5E0D5] hover:border-[#173B2A] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
      aria-label={product.name}
    >
      {/* Card Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F8F6F0]">
        <Link to={`/food/products/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.badge && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#173B2A] text-white shadow-2xs">
              {product.badge}
            </span>
          )}
          {product.discount && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#3F7B43] text-white shadow-2xs">
              {product.discount}
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={() => toggleWishlistItem(product)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 shadow-2xs ${
            inWishlist
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/85 text-[#746F63] hover:text-rose-600 hover:bg-white'
          }`}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <Heart
            className={`w-4 h-4 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`}
          />
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#746F63]">
            <span>{product.categoryName || 'Pantry Blend'}</span>
            {product.packSize && <span>{product.packSize}</span>}
          </div>

          <Link
            to={`/food/products/${product.slug}`}
            className="block text-base font-serif font-medium text-[#173B2A] group-hover:text-[#3F7B43] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Star Rating if available */}
          {product.rating && (
            <div className="flex items-center gap-1.5 text-xs text-[#292820]">
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
              <span className="font-semibold">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-[11px] text-[#746F63]">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Description snippet */}
          <p className="text-xs text-[#746F63] leading-relaxed line-clamp-2 font-sans">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between gap-2">
          {hasPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-sans font-semibold text-[#292820] tabular-nums">
                ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-[#A89F93] line-through tabular-nums">
                  ₹{typeof product.originalPrice === 'number' ? product.originalPrice.toLocaleString('en-IN') : product.originalPrice}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono font-medium text-[#746F63] bg-[#F8F6F0] px-2 py-0.5 rounded border border-[#E5E0D5]">
              Price to be confirmed
            </span>
          )}

          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173B2A] text-white hover:bg-[#3F7B43] active:scale-95 text-xs font-mono font-semibold tracking-wide uppercase transition-all shadow-2xs shrink-0 cursor-pointer"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
