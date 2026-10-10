import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Eye, Check } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export function JewelleryProductCard({ product }) {
  const { isInWishlist, toggleWishlistItem, addToCart } = useStore();
  const isWishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = React.useState(false);

  const hasPrice = product.price !== null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasPrice) return;

    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistItem(product);
  };

  return (
    <div className="group relative rounded-xl bg-[#343238]/70 border border-[#B9B8B5]/15 hover:border-[#B9B8B5]/60 transition-all duration-normal flex flex-col overflow-hidden shadow-lg hover:shadow-2xl">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#242326]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Top Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#242326]/65 backdrop-blur-md text-[#F7F3EB] border border-white/25 shadow-xs">
              {product.badge}
            </span>
          </div>
        )}

        {/* Floating Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#242326]/80 hover:bg-[#242326] text-[#F7F3EB] border border-[#B9B8B5]/20 backdrop-blur-sm transition-transform active:scale-90"
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
            <Link to={`/jewellery/products/${product.slug}`} className="focus:outline-none">
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
                ₹{product.price.toLocaleString('en-IN')}
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
              className="p-2 rounded-lg bg-[#242326] hover:bg-[#3E3C44] text-[#F7F3EB] text-xs transition-colors border border-[#B9B8B5]/20"
              title="View Piece Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>

            {hasPrice ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`p-2 rounded-lg text-xs transition-all flex items-center justify-center ${
                  justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#B9B8B5] text-[#242326] hover:bg-white'
                }`}
                title={justAdded ? 'Added to Bag' : 'Add to Bag'}
              >
                {justAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span
                className="p-2 rounded-lg bg-[#242326]/50 text-[#B9B8B5]/40 text-xs cursor-not-allowed border border-white/5"
                title="Purchase unavailable pending confirmed pricing"
              >
                <Plus className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
