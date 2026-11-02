import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Leaf, ShoppingBag, Bell } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { resolveAvailability } from '../../../utils/inventory.js';
import { RestockModal } from '../../../components/ui/RestockModal.jsx';
import defaultTeaHero from '../../../assets/images/food-teas-hero.jpg';

export function TeaProductCard({ product }) {
  const navigate = useNavigate();
  const { toggleWishlistItem, isInWishlist, addToCart } = useStore();
  const inWishlist = isInWishlist(product.id);
  const hasPrice = product.price !== null && Number(product.price) > 0;
  const [showRestockModal, setShowRestockModal] = useState(false);

  const availability = resolveAvailability(product);

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistItem(product);
  };

  const handleCardClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    navigate(`/tea/products/${product.slug}`);
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }

    if (!hasPrice) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(`/tea/products/${product.slug}`);
      return;
    }

    addToCart(product, 1);
  };

  return (
    <>
      <article
        className="group relative rounded-2xl bg-[#FFFDF5] border border-[#B88E38]/30 shadow-sm hover:shadow-xl hover:border-[#8C6320] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        aria-label={product.name}
        onClick={handleCardClick}
      >
        {/* Card Image Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#FAF1BB]/60">
          <Link
            to={`/tea/products/${product.slug}`}
            className="block w-full h-full"
            onClick={handleLinkClick}
          >
            <img
              src={product.image || defaultTeaHero}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultTeaHero;
              }}
            />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
            {availability.isOutOfStock ? (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-rose-900/80 backdrop-blur-md text-white border border-rose-300/30 shadow-xs">
                Out of Stock
              </span>
            ) : availability.isLowStock ? (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-amber-900/80 backdrop-blur-md text-white border border-amber-300/30 shadow-xs">
                Low Stock — Only {availability.availableQuantity} left
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#2C1E11]/75 backdrop-blur-md text-[#FAF1BB] shadow-xs border border-white/20">
                In Stock
              </span>
            )}

            {product.badge && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-white/75 backdrop-blur-md text-[#2C1E11] shadow-xs border border-white/60">
                {product.badge}
              </span>
            )}
            {product.isFeatured && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#2C1E11]/60 backdrop-blur-md text-[#FAF1BB] shadow-xs border border-white/20">
                Standee Selection
              </span>
            )}
          </div>

          {/* Wishlist Toggle Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 shadow-sm cursor-pointer ${
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
                <span>{product.categoryName || 'Botanical Blend'}</span>
              </span>
              {product.botanicalName && (
                <span className="italic opacity-80 truncate max-w-[120px]">{product.botanicalName}</span>
              )}
            </div>

            <Link
              to={`/tea/products/${product.slug}`}
              onClick={handleLinkClick}
              className="block text-lg font-serif font-medium text-[#2C1E11] group-hover:text-[#8C6320] transition-colors line-clamp-1"
            >
              {product.name}
            </Link>
          </div>

          {/* Bottom Pricing & Action Row */}
          <div className="pt-2 border-t border-[#B88E38]/20 flex items-center justify-between gap-3">
            <div>
              {hasPrice ? (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base font-sans font-semibold text-[#2C1E11] tabular-nums font-numeric">
                    ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                  </span>
                  <span className="text-xs font-sans font-medium text-[#8C6320]">
                    / Pack
                  </span>
                  <span className="text-[10px] font-sans text-[#8C6320] bg-white/80 px-2 py-0.5 rounded-md border border-[#B88E38]/25 tabular-nums font-numeric">
                    Net Weight: {product.packSize || '25 g'}
                  </span>
                  <span className="text-[9px] text-[#8C6320] block w-full">Incl. GST</span>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-[#8C6320] font-medium">
                  Artisanal Harvest
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/tea/products/${product.slug}`}
                onClick={handleLinkClick}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8C6320] hover:text-[#2C1E11] hover:bg-[#FAF1BB]/60 transition-colors"
              >
                View
              </Link>

              {availability.isOutOfStock ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 active:scale-95 text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer"
                  aria-label={`Notify me when ${product.name} is back in stock`}
                >
                  <Bell className="w-3.5 h-3.5 text-rose-700" />
                  <span>Notify</span>
                </button>
              ) : hasPrice ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] hover:bg-[#8C6320] hover:text-white active:scale-95 text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        product={product}
      />
    </>
  );
}
