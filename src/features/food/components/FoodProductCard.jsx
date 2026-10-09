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
      className="group relative rounded-2xl bg-white border border-[#172B1C]/10 shadow-sm hover:shadow-lg hover:border-[#287A25]/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
      aria-label={product.name}
    >
      {/* Card Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#E5DFD3]/50">
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
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#287A25] text-white shadow-sm">
              {product.badge}
            </span>
          )}
          {product.discount && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-sm">
              {product.discount}
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={() => toggleWishlistItem(product)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 shadow-sm ${
            inWishlist
              ? 'bg-red-50 text-red-500 shadow-md'
              : 'bg-white/80 text-black/60 hover:text-red-500 hover:bg-white'
          }`}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <Heart
            className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
          />
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#557C36]">
            <span>{product.categoryName}</span>
            {product.packSize && <span>{product.packSize}</span>}
          </div>

          <Link
            to={`/food/products/${product.slug}`}
            className="block text-base font-serif font-medium text-[#172B1C] group-hover:text-[#287A25] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Star Rating if verified */}
          {product.rating && (
            <div className="flex items-center gap-1.5 text-xs text-[#172B1C]">
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
              <span className="font-semibold">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-[11px] text-black/40">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Description snippet */}
          <p className="text-xs text-[#557C36] leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 border-t border-[#172B1C]/8 flex items-center justify-between gap-2">
          {hasPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#172B1C]">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-black/40 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono font-medium text-[#557C36] bg-[#557C36]/10 px-2 py-0.5 rounded">
              Price to be confirmed
            </span>
          )}

          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#287A25] text-white hover:bg-[#1E5C1B] active:scale-95 text-xs font-semibold tracking-wide uppercase transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#287A25] focus-visible:ring-offset-2 shrink-0"
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
