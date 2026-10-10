import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Leaf, ArrowRight } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export function TeaProductCard({ product }) {
  const { toggleWishlistItem, isInWishlist } = useStore();
  const inWishlist = isInWishlist(product.id);
  const hasPrice = product.price !== null;

  return (
    <article
      className="group relative rounded-2xl bg-[#FFFFFF] border border-[#E5E0D5] hover:border-[#173B2A] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
      aria-label={product.name}
    >
      {/* Card Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F8F6F0]">
        <Link to={`/tea/products/${product.slug}`} className="block w-full h-full">
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
          {product.isFeatured && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#65815A] text-white shadow-2xs">
              Curated Blend
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
              : 'bg-white/80 text-[#746F63] hover:text-rose-600 hover:bg-white'
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
          <div className="flex items-center justify-between text-[11px] font-mono text-[#65815A]">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#65815A]" />
              <span>{product.categoryName || 'Botanical Blend'}</span>
            </span>
            {product.botanicalName && (
              <span className="italic opacity-80 truncate max-w-[120px]">{product.botanicalName}</span>
            )}
          </div>

          <Link
            to={`/tea/products/${product.slug}`}
            className="block text-lg font-serif font-medium text-[#173B2A] group-hover:text-[#65815A] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Standee Narrative Note */}
          {product.standeeNotes && (
            <p className="text-xs text-[#292820]/80 line-clamp-2 leading-relaxed bg-[#F8F6F0] p-2 rounded-lg border border-[#E5E0D5]">
              <span className="font-semibold text-[#173B2A]">Ritual:</span> {product.standeeNotes}
            </p>
          )}
        </div>

        {/* Bottom Pricing & Action Row */}
        <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between gap-3">
          <div>
            {hasPrice ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base font-sans font-semibold text-[#292820] tabular-nums">
                  ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                </span>
                {product.packSize && (
                  <span className="text-[10px] font-mono text-[#746F63]">
                    ({product.packSize})
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-xs text-[#A89F93] line-through tabular-nums">
                    ₹{typeof product.originalPrice === 'number' ? product.originalPrice.toLocaleString('en-IN') : product.originalPrice}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] font-mono text-[#65815A] font-medium">
                Artisanal Harvest
              </div>
            )}
          </div>

          <Link
            to={`/tea/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-[#173B2A] text-white hover:bg-[#65815A] transition-all shadow-2xs"
          >
            <span>View Brew</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
