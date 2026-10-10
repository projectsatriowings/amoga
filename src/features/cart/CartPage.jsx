import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, UtensilsCrossed, Sparkles, Gem, Leaf, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { CartItemRow } from './components/CartItemRow';
import { CartSummary } from './components/CartSummary';

export const CartPage = () => {
  const cartState = useStore((state) => state.cart);
  const cartItems = Array.isArray(cartState) ? cartState : (cartState?.items || []);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);

  const resolved = useResolvedTheme();
  const shouldReduceMotion = useReducedMotion();

  const { totalItemsCount, hasUnpricedItems } = getCartTotals();

  return (
    <div
      className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-normal"
      style={{
        ...resolved.cssVariables,
        backgroundColor: 'var(--collection-page-bg)',
        color: 'var(--collection-text)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol
            className="flex items-center space-x-2 text-xs uppercase tracking-widest"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            <li>
              <Link to="/" className="hover:opacity-80 transition-opacity">
                Portal
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
              Shopping Bag
            </li>
          </ol>
        </nav>

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
              Your Shopping Bag
            </h1>
            <p
              className="mt-2 text-sm sm:text-base font-sans max-w-2xl leading-relaxed"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              Unified selections across Amoga Wholesome Pantry, Wellness Tea, Heritage Sarees, and Silver Jewellery.
            </p>
          </div>
          {cartItems.length > 0 && (
            <div className="flex items-center gap-4">
              <span
                className="text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                  color: 'var(--collection-text)',
                }}
              >
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in bag
              </span>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs uppercase tracking-wider hover:text-red-700 transition-colors underline underline-offset-4 cursor-pointer"
                style={{ color: 'var(--collection-text-muted)' }}
              >
                Clear Bag
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {cartItems.length === 0 ? (
          /* Empty Bag State */
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-16 text-center max-w-3xl mx-auto"
          >
            <div
              className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6 shadow-xs"
              style={{
                backgroundColor: 'var(--collection-card-bg)',
                borderColor: 'var(--collection-border)',
                color: 'var(--collection-accent)',
              }}
            >
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2
              className="font-serif text-2xl sm:text-3xl mb-3"
              style={{ color: 'var(--collection-heading)' }}
            >
              Your shopping bag is currently empty
            </h2>
            <p
              className="text-sm sm:text-base mb-10 leading-relaxed max-w-xl mx-auto"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              Explore our artisanal collections to discover slow-crafted pantry provisions, thoughtfully selected wellness teas, heritage handloom weaves, and hallmarked pure silver adornments.
            </p>

            {/* Collection Discovery Hub: 4 houses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {/* 1. Food */}
              <Link
                to="/food"
                className="group p-5 rounded-2xl border hover:shadow-md transition-all flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                }}
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: 'rgba(63, 123, 67, 0.12)',
                      color: '#3F7B43',
                    }}
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <h3
                    className="font-serif text-base font-semibold transition-colors"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Wholesome Pantry
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Comforting soup mixes, nourishing millet blends and flavourful rice podis
                  </p>
                </div>
                <div
                  className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider gap-1"
                  style={{ color: '#3F7B43' }}
                >
                  <span>Explore Pantry</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* 2. Tea */}
              <Link
                to="/tea"
                className="group p-5 rounded-2xl border hover:shadow-md transition-all flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                }}
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: 'rgba(108, 132, 97, 0.14)',
                      color: '#6C8461',
                    }}
                  >
                    <Leaf className="w-5 h-5" />
                  </div>
                  <h3
                    className="font-serif text-base font-semibold transition-colors"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Wellness Tea
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Thoughtfully selected botanical teas and herbal infusions for your everyday ritual
                  </p>
                </div>
                <div
                  className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider gap-1"
                  style={{ color: '#6C8461' }}
                >
                  <span>Explore Tea</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* 3. Sarees */}
              <Link
                to="/sarees"
                className="group p-5 rounded-2xl border hover:shadow-md transition-all flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                }}
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: 'rgba(110, 38, 58, 0.12)',
                      color: '#6E263A',
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3
                    className="font-serif text-base font-semibold transition-colors"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Heritage Sarees
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    Kanchipuram, Banarasi zari & mulberry silks
                  </p>
                </div>
                <div
                  className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider gap-1"
                  style={{ color: '#6E263A' }}
                >
                  <span>Explore Sarees</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* 4. Jewellery */}
              <Link
                to="/jewellery"
                className="group p-5 rounded-2xl border hover:shadow-md transition-all flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--collection-card-bg)',
                  borderColor: 'var(--collection-border)',
                }}
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: 'rgba(115, 124, 134, 0.14)',
                      color: '#737C86',
                    }}
                  >
                    <Gem className="w-5 h-5" />
                  </div>
                  <h3
                    className="font-serif text-base font-semibold transition-colors"
                    style={{ color: 'var(--collection-heading)' }}
                  >
                    Silver Jewellery
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--collection-text-muted)' }}
                  >
                    92.5 Sterling silver neckpieces, jhumkas & cuffs
                  </p>
                </div>
                <div
                  className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider gap-1"
                  style={{ color: '#737C86' }}
                >
                  <span>Explore Silver</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Active Cart Grid */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {hasUnpricedItems && (
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-sm">Purchase Safeguard Notice</h2>
                    <p className="mt-1 leading-relaxed text-amber-800">
                      Items marked with bespoke or unapproved pricing cannot proceed through frontend checkout. Please remove them or await official catalogue appraisal.
                    </p>
                  </div>
                </div>
              )}

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

              {/* Bottom browsing banner: all 4 collections */}
              <div
                className="pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs"
                style={{ borderColor: 'var(--collection-border)' }}
              >
                <span style={{ color: 'var(--collection-text-muted)' }}>
                  Ready to discover more artisanal treasures?
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
