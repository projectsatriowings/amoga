import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Check, Bell } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { resolveAvailability } from '../../../utils/inventory.js';
import { RestockModal } from '../../../components/ui/RestockModal.jsx';

export function SareeProductCard({ product }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlistItem, addToCart } = useStore();
  const isWishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const addedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const hasPrice = product.price !== null && Number(product.price) > 0;
  const availability = resolveAvailability(product);

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }

    if (!hasPrice) {
      navigate(`/sarees/products/${product.slug}`);
      return;
    }

    // Default to first variant if variants exist
    const defaultVariant = product.variants?.[0] || null;
    const res = addToCart(product, 1, defaultVariant);
    if (res?.success) {
      setJustAdded(true);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      addedTimerRef.current = setTimeout(() => {
        setJustAdded(false);
      }, 1500);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistItem(product);
  };

  return (
    <>
      <article
        className="group relative rounded-xl bg-[#381222]/80 border border-[#C5A46D]/20 hover:border-[#C5A46D]/80 transition-all duration-normal flex flex-col overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
        aria-label={product.name}
        onClick={() => navigate(`/sarees/products/${product.slug}`)}
      >
        {/* Product Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#2C0E1A]">
          <Link
            to={`/sarees/products/${product.slug}`}
            className="block w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
              loading="lazy"
            />
          </Link>

          {/* Floating Top Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            {availability.isOutOfStock ? (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/85 backdrop-blur-md text-rose-200 border border-rose-400/40 shadow-xs">
                Out of Stock
              </span>
            ) : availability.isLowStock ? (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/85 backdrop-blur-md text-amber-200 border border-amber-400/40 shadow-xs">
                Low Stock — Only {availability.availableQuantity} left
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#2C0E1A]/85 backdrop-blur-md text-[#F6EBD8] border border-[#C5A46D]/40 shadow-xs">
                In Stock
              </span>
            )}

            {product.badge && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#2C0E1A]/65 backdrop-blur-md text-[#F6EBD8] border border-[#C5A46D]/40 shadow-xs">
                {product.badge}
              </span>
            )}
          </div>

          {/* Floating Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#2C0E1A]/80 hover:bg-[#2C0E1A] text-[#F6EBD8] border border-[#C5A46D]/30 backdrop-blur-sm transition-transform active:scale-90 cursor-pointer"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#F6EBD8] group-hover:text-[#C5A46D]'
              }`}
            />
          </button>

          {/* Quick View Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-normal flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-full bg-[#2C0E1A]/90 text-[#C5A46D] text-xs font-mono uppercase tracking-wider border border-[#C5A46D]/40 flex items-center gap-1.5 shadow-lg">
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#381222]/60">
          <div>
            {/* Category Eyebrow */}
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A46D]">
              {product.categoryName}
            </div>

            {/* Product Name */}
            <h3 className="font-serif text-lg text-[#F6EBD8] group-hover:text-[#C5A46D] transition-colors line-clamp-1 mt-0.5">
              <Link
                to={`/sarees/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="focus:outline-none"
              >
                {product.name}
              </Link>
            </h3>

            {/* Subtitle / Tagline */}
            <p className="text-xs text-[#D4C2A7] line-clamp-1 mt-1 font-sans">
              {product.tagline || product.description}
            </p>

            {/* Variant swatches preview if present */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    title={v.name}
                    className="w-3.5 h-3.5 rounded-full border border-[#C5A46D]/40"
                    style={{ backgroundColor: v.hex }}
                  />
                ))}
                <span className="text-[10px] font-mono text-[#D4C2A7]/60 ml-1">
                  {product.variants.length} shade{product.variants.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Price & Action Row */}
          <div className="pt-2 border-t border-[#C5A46D]/15 flex items-center justify-between gap-2">
            <div>
              {hasPrice ? (
                <div className="text-base font-sans font-bold text-[#F6EBD8] tabular-nums">
                  ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#C5A46D] bg-[#451523] px-2 py-0.5 rounded border border-[#C5A46D]/20">
                  Price to be confirmed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/sarees/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-[#451523] hover:bg-[#581c2d] text-[#F6EBD8] text-xs transition-colors border border-[#C5A46D]/30"
                title="View Product"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>

              {availability.isOutOfStock ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-[#451523] text-rose-200 hover:bg-[#581c2d] border border-rose-300/30 cursor-pointer shadow-md"
                  title="Notify Me When Available"
                >
                  <Bell className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>Notify</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    justAdded
                      ? 'bg-[#E5C78B] text-[#2C0E1A] shadow-md'
                      : 'bg-[#C5A46D] text-[#2C0E1A] hover:bg-[#d9bb85]'
                  }`}
                  title={justAdded ? 'Added to Bag' : 'Add Saree to Bag'}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              )}
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
