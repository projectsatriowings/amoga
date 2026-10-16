import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldAlert,
  Bookmark,
  Trash2,
  PackageCheck,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { CartItemRow } from './components/CartItemRow';
import { CartSummary } from './components/CartSummary';
import { formatINR, isValidPrice } from '../../utils/pricing';
import { BackButton } from '../../components/ui/BackButton';

export const CartPage = () => {
  const cartState = useStore((state) => state.cart);
  const cartItems = Array.isArray(cartState) ? cartState : (cartState?.items || []);
  const selectedLineIds = useStore((state) => state.selectedLineIds || []);
  const selectAllItems = useStore((state) => state.selectAllItems);
  const deselectAllItems = useStore((state) => state.deselectAllItems);
  const getSelectedItems = useStore((state) => state.getSelectedItems);
  const getSelectedTotals = useStore((state) => state.getSelectedTotals);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);

  // Saved for Later state
  const savedForLaterState = useStore((state) => state.savedForLater);
  const savedItems = Array.isArray(savedForLaterState?.items) ? savedForLaterState.items : [];
  const moveToBag = useStore((state) => state.moveToBag);
  const removeFromSaved = useStore((state) => state.removeFromSaved);

  const resolved = useResolvedTheme();
  const shouldReduceMotion = useReducedMotion();

  const { totalItemsCount } = getCartTotals();
  const selectedItems = getSelectedItems();
  const { hasUnpricedItems: hasSelectedUnpriced } = getSelectedTotals();
  const allSelected = cartItems.length > 0 && selectedLineIds.length >= cartItems.length;
  const noneSelected = selectedLineIds.length === 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };

  const hasAnyItems = cartItems.length > 0 || savedItems.length > 0;

  return (
    <div
      className="min-h-screen pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-normal"
      style={{
        ...resolved.cssVariables,
        backgroundColor: 'var(--collection-page-bg)',
        color: 'var(--collection-text)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation & Back Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackButton fallbackTo="/" label="Continue Shopping" />

          <nav aria-label="Breadcrumb">
            <ol
              className="flex items-center space-x-2 text-xs uppercase tracking-widest"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              <li>
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  Home
                </Link>
              </li>
              <li>
                <span className="opacity-60">/</span>
              </li>
              <li
                className="font-semibold"
                style={{ color: 'var(--collection-accent)' }}
                aria-current="page"
              >
                My Cart
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Title & Context */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b gap-4"
          style={{ borderColor: 'var(--collection-border)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              {resolved.isMixed ? (
                <span
                  className="text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border inline-block"
                  style={{
                    backgroundColor: 'var(--collection-section-bg)',
                    borderColor: 'var(--collection-border)',
                    color: 'var(--collection-accent)',
                  }}
                >
                  Mixed Collection Bag • Multi-House
                </span>
              ) : (
                <span
                  className="text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border inline-block"
                  style={{
                    backgroundColor: 'var(--collection-section-bg)',
                    borderColor: 'var(--collection-border)',
                    color: 'var(--collection-accent)',
                  }}
                >
                  {resolved.theme.name}
                </span>
              )}
            </div>
            <h1
              className="font-serif text-3xl sm:text-4xl lg:text-5xl"
              style={{ color: 'var(--collection-heading)' }}
            >
              My Cart
            </h1>
            <p
              className="mt-2 text-sm sm:text-base font-sans max-w-2xl leading-relaxed"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              Select items for checkout or keep them saved for later.
            </p>
          </div>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-4">
              <span
                className="text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs font-mono"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                  color: 'var(--collection-text)',
                }}
              >
                {selectedItems.length} of {cartItems.length} selected
              </span>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs uppercase tracking-wider hover:text-red-700 transition-colors underline underline-offset-4 cursor-pointer"
                style={{ color: 'var(--collection-text-muted)' }}
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {!hasAnyItems ? (
          /* Entirely Empty State */
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-16 text-center max-w-xl mx-auto"
          >
            <div
              className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6 shadow-xs"
              style={{
                backgroundColor: 'var(--collection-card-bg)',
                borderColor: 'var(--collection-border)',
                color: '#267D2A',
              }}
            >
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2
              className="font-serif text-2xl sm:text-3xl mb-3"
              style={{ color: 'var(--collection-heading)' }}
            >
              Your cart is empty
            </h2>
            <p
              className="text-sm sm:text-base mb-8 leading-relaxed max-w-md mx-auto"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              Add items to your cart to get started.
            </p>

            <div className="flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center py-3.5 px-8 rounded-full bg-[#267D2A] text-white font-medium text-sm tracking-wide shadow-sm hover:bg-[#1E6622] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#267D2A] focus-visible:ring-offset-2 transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                Shop Our Collections
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Active Cart & Saved Items Layout */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Active Cart Section */}
              {cartItems.length > 0 && (
                <div className="space-y-4">
                  {/* Selection Toolbar */}
                  <div
                    className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
                    style={{
                      backgroundColor: 'var(--collection-card-bg)',
                      borderColor: 'var(--collection-border)',
                    }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          allSelected
                            ? 'bg-[var(--collection-accent)] border-[var(--collection-accent)] text-white'
                            : 'bg-white border-black/30'
                        }`}
                      >
                        {allSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <span style={{ color: 'var(--collection-heading)' }}>
                        {allSelected ? 'Deselect All' : 'Select All Items'}
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px]" style={{ color: 'var(--collection-text-muted)' }}>
                        {selectedItems.length} of {cartItems.length} lines selected
                      </span>
                      {!noneSelected && (
                        <button
                          type="button"
                          onClick={deselectAllItems}
                          className="hover:underline text-[11px] uppercase tracking-wider font-semibold cursor-pointer"
                          style={{ color: 'var(--collection-accent)' }}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>

                  {hasSelectedUnpriced && (
                    <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h2 className="font-semibold text-sm">Selective Checkout Safeguard</h2>
                        <p className="mt-1 leading-relaxed text-amber-800">
                          One or more selected items have unapproved prices. You can uncheck them to proceed with your other verified purchases.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cart Item Rows */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.id || item.lineId}
                          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CartItemRow
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Saved For Later Section */}
              {savedItems.length > 0 && (
                <div
                  className="mt-10 p-6 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: 'var(--collection-card-bg)',
                    borderColor: 'var(--collection-border)',
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--collection-border)' }}>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4" style={{ color: 'var(--collection-accent)' }} />
                      <h2
                        className="font-serif text-lg sm:text-xl font-medium"
                        style={{ color: 'var(--collection-heading)' }}
                      >
                        Saved for Later ({savedItems.length})
                      </h2>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
                      Items not included in checkout totals
                    </span>
                  </div>

                  <div className="space-y-3">
                    {savedItems.map((saved) => {
                      const sKey = saved.id || saved.lineId;
                      const hasPrice = isValidPrice(saved.price);
                      const isAvailable = saved.product?.inStock !== false;

                      return (
                        <div
                          key={sKey}
                          className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                          style={{
                            backgroundColor: 'var(--collection-section-bg)',
                            borderColor: 'var(--collection-border)',
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                              src={saved.image}
                              alt={saved.name}
                              className="w-16 h-16 rounded-lg object-cover border"
                              style={{ borderColor: 'var(--collection-border)' }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23eee"/><text x="32" y="32" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Amoga</text></svg>';
                              }}
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <h3
                                className="text-sm font-medium font-serif break-words"
                                style={{ color: 'var(--collection-heading)' }}
                              >
                                {saved.name}
                              </h3>
                              {saved.selectedVariant && (
                                <div className="text-xs" style={{ color: 'var(--collection-text-muted)' }}>
                                  Option: {saved.selectedVariant.name}
                                </div>
                              )}
                              <div className="text-xs font-semibold tabular-nums" style={{ color: 'var(--collection-accent)' }}>
                                {hasPrice ? formatINR(saved.price) : 'Price pending confirmation'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: 'var(--collection-border)' }}>
                            <button
                              type="button"
                              onClick={() => moveToBag(sKey)}
                              disabled={!hasPrice || !isAvailable}
                              className="px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                              style={{
                                backgroundColor: 'var(--collection-accent)',
                                color: 'var(--collection-button-text, #FFFFFF)',
                              }}
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Move to Cart</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeFromSaved(sKey)}
                              className="p-2 rounded-lg text-black/50 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove from saved list"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom browsing banner: all 4 collections */}
              <div
                className="pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs"
                style={{ borderColor: 'var(--collection-border)' }}
              >
                <span style={{ color: 'var(--collection-text-muted)' }}>
                  Explore our collections:
                </span>
                <div className="flex items-center gap-4 uppercase tracking-wider font-semibold">
                  <Link to="/food" className="hover:underline underline-offset-4" style={{ color: '#3F7B43' }}>
                    + Pantry
                  </Link>
                  <Link to="/tea" className="hover:underline underline-offset-4" style={{ color: '#6C8461' }}>
                    + Tea
                  </Link>
                  <Link to="/sarees" className="hover:underline underline-offset-4" style={{ color: '#6E263A' }}>
                    + Sarees
                  </Link>
                  <Link to="/jewellery" className="hover:underline underline-offset-4" style={{ color: '#737C86' }}>
                    + Silver
                  </Link>
                </div>
              </div>
            </div>

            {/* Summary Column (4 cols) */}
            <div className="lg:col-span-4">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
