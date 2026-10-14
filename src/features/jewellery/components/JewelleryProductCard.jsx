import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Check, Bell } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { resolveAvailability } from '../../../utils/inventory.js';
import { RestockModal } from '../../../components/ui/RestockModal.jsx';

export function JewelleryProductCard({ product }) {
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
      navigate(`/jewellery/products/${product.slug}`);
      return;
    }

    const defaultVariant = product.sizes && product.sizes.length > 0
      ? { id: `size-${product.sizes[0]}`, name: `Size ${product.sizes[0]}` }
      : null;

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
        className="group relative rounded-xl bg-[#343238]/70 border border-[#B9B8B5]/15 hover:border-[#B9B8B5]/60 transition-all duration-normal flex flex-col overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
        aria-label={product.name}
        onClick={() => navigate(`/jewellery/products/${product.slug}`)}
      >
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-[#242326]">
          <Link
            to={`/jewellery/products/${product.slug}`}
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
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#242326]/85 backdrop-blur-md text-[#F7F3EB] border border-[#B9B8B5]/30 shadow-xs">
                In Stock
              </span>
            )}

            {product.badge && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#242326]/65 backdrop-blur-md text-[#F7F3EB] border border-white/25 shadow-xs">
                {product.badge}
              </span>
            )}
          </div>

          {/* Floating Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#242326]/80 hover:bg-[#242326] text-[#F7F3EB] border border-[#B9B8B5]/20 backdrop-blur-sm transition-transform active:scale-90 cursor-pointer"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#F7F3EB] group-hover:text-[#C6AD82]'
              }`}
            />
          </button>

          {/* Quick View Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-normal flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-full bg-[#242326]/90 text-[#B9B8B5] text-xs font-mono uppercase tracking-wider border border-[#B9B8B5]/30 flex items-center gap-1.5 shadow-lg">
              <Eye className="w-3.5 h-3.5" />
              <span>View Piece</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#343238]/40">
          <div>
            {/* Category Eyebrow */}
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#B9B8B5]/80">
              {product.categoryName}
            </div>

            {/* Product Name */}
            <h3 className="font-serif text-lg text-[#F7F3EB] group-hover:text-[#B9B8B5] transition-colors line-clamp-1 mt-0.5">
              <Link
                to={`/jewellery/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="focus:outline-none"
              >
                {product.name}
              </Link>
            </h3>

            {/* Subtitle / Tagline */}
            <p className="text-xs text-[#B9B8B5] line-clamp-1 mt-1 font-sans">
              {product.tagline || product.description}
            </p>

            {/* Available Sizes count preview if present */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="text-[10px] font-mono text-[#B9B8B5]/60 mt-1.5">
                Available in {product.sizes.length} sizes
              </div>
            )}
          </div>

          {/* Price & Action Row */}
          <div className="pt-2 border-t border-[#B9B8B5]/15 flex items-center justify-between gap-2">
            <div>
              {hasPrice ? (
                <div className="text-base font-sans font-bold text-[#F7F3EB] tabular-nums">
                  ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#B9B8B5] bg-[#242326] px-2 py-0.5 rounded border border-[#B9B8B5]/20">
                  Price to be confirmed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/jewellery/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-[#242326] hover:bg-[#3E3C44] text-[#F7F3EB] text-xs transition-colors border border-[#B9B8B5]/20"
                title="View Piece Details"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>

              {availability.isOutOfStock ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-[#242326] text-rose-200 hover:bg-[#3E3C44] border border-rose-400/30 cursor-pointer shadow-md"
                  title="Notify Me When Available"
                >
                  <Bell className="w-3.5 h-3.5 text-[#B9B8B5]" />
                  <span>Notify</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    justAdded
                      ? 'bg-white text-[#111215] shadow-md'
                      : 'bg-[#B9B8B5] text-[#242326] hover:bg-white'
                  }`}
                  title={justAdded ? 'Added to Bag' : 'Add Piece to Bag'}
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
