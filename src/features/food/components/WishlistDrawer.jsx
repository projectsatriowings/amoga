import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Button } from '../../../components/ui/Button';

export function WishlistDrawer() {
  const { wishlist, closeWishlist, toggleWishlistItem, addToCart } = useStore();
  const { items, isOpen } = wishlist;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWishlist}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#F1EDE4] text-[#172B1C] shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-l border-[#172B1C]/10"
            role="dialog"
            aria-modal="true"
            aria-label="Wishlist Drawer"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#172B1C]/10 flex items-center justify-between bg-white/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-lg font-serif font-medium text-[#172B1C]">
                  Saved Favourites ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeWishlist}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#172B1C] transition-colors focus-visible:ring-2 focus-visible:ring-[#287A25]"
                aria-label="Close wishlist drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#E5DFD3] flex items-center justify-center text-[#557C36]">
                    <Heart className="w-8 h-8 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-serif font-medium">No items saved yet</p>
                    <p className="text-xs text-[#557C36] max-w-xs">
                      Tap the heart icon on any recipe or tea to save it for later.
                    </p>
                  </div>
                  <Link to="/food/products" onClick={closeWishlist}>
                    <Button variant="primary" size="sm" collection="food">
                      Discover Products
                    </Button>
                  </Link>
                </div>
              ) : (
                items.map((prod) => {
                  const productUrl =
                    prod.collection === 'jewellery'
                      ? `/jewellery/products/${prod.slug}`
                      : prod.collection === 'sarees'
                      ? `/sarees/products/${prod.slug}`
                      : `/food/products/${prod.slug}`;

                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-xl bg-white border border-[#172B1C]/8 flex items-center gap-3 shadow-sm"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-[#EAE6D9]"
                      />

                      <div className="flex-1 min-w-0">
                        <Link
                          to={productUrl}
                          onClick={closeWishlist}
                          className="text-sm font-medium hover:text-[#287A25] transition-colors line-clamp-1 block"
                        >
                          {prod.name}
                        </Link>

                        <div className="text-[11px] text-[#557C36] font-mono">
                          {prod.categoryName}
                        </div>

                        <div className="text-xs font-sans font-semibold text-[#172B1C] mt-1 tabular-nums">
                          {prod.price !== null ? `₹${prod.price.toLocaleString('en-IN')}` : 'Price to be confirmed'}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => addToCart(prod, 1)}
                          className="p-2 rounded-md bg-[#287A25] text-white hover:bg-[#1E5C1B] transition-colors"
                          title="Add to cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlistItem(prod)}
                          className="p-2 rounded-md hover:bg-black/5 text-black/40 hover:text-red-500 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
