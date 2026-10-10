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
      className="group relative rounded-2xl bg-[#FDF9E7] border border-[#B88E38]/25 shadow-sm hover:shadow-xl hover:border-[#B88E38] transition-all duration-300 flex flex-col justify-between overflow-hidden"
      aria-label={product.name}
    >
      {/* Card Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF1BB]/50">
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
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#B88E38] text-[#2C1E11] shadow-sm border border-[#8C6320]/30">
              {product.badge}
            </span>
          )}
          {product.isFeatured && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] shadow-sm">
              Standee Selection
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
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8C6320]">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#B88E38]" />
              <span>{product.categoryName || 'Herbal Infusion'}</span>
            </span>
            {product.botanicalName && (
              <span className="italic opacity-80 truncate max-w-[120px]">{product.botanicalName}</span>
            )}
          </div>

          <Link
            to={`/tea/products/${product.slug}`}
            className="block text-lg font-serif font-medium text-[#2C1E11] group-hover:text-[#8C6320] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Standee Narrative Note */}
          {product.standeeNotes && (
            <p className="text-xs text-[#543B25] line-clamp-2 leading-relaxed bg-[#FAF1BB]/60 p-2 rounded-lg border border-[#B88E38]/15">
              <span className="font-semibold text-[#8C6320]">Wellness:</span> {product.standeeNotes}
            </p>
          )}
        </div>

        {/* Bottom Pricing & Action Row */}
        <div className="pt-2 border-t border-[#B88E38]/20 flex items-center justify-between gap-3">
          <div>
            {hasPrice ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base font-serif font-bold text-[#2C1E11]">
                  ₹{product.price}
                </span>
                {product.packSize && (
                  <span className="text-[10px] font-mono text-[#8C6320] opacity-80">
                    ({product.packSize})
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-xs text-[#7D5C3F] line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] font-mono text-[#8C6320] font-medium">
                Artisanal Harvest
              </div>
            )}
          </div>

          <Link
            to={`/tea/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider bg-[#2C1E11] text-[#FAF1BB] hover:bg-[#8C6320] hover:text-white transition-all shadow-sm"
          >
            <span>View Brew</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
