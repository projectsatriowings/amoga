import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, UtensilsCrossed, Sparkles, Gem, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { CartItemRow } from './components/CartItemRow';
import { CartSummary } from './components/CartSummary';

export const CartPage = () => {
  const cart = useStore((state) => state.cart);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const clearCart = useStore((state) => state.clearCart);

  const { totalItemsCount, hasUnpricedItems } = getCartTotals();

  return (
    <div className="min-h-screen bg-amoga-paper pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs uppercase tracking-widest text-amoga-charcoal/60">
            <li>
              <Link to="/" className="hover:text-amoga-burgundy transition-colors">
                Portal
              </Link>
            </li>
            <li>
              <span className="text-amoga-charcoal/40">/</span>
            </li>
            <li className="text-amoga-burgundy font-medium" aria-current="page">
              Shopping Bag
            </li>
          </ol>
        </nav>

        {/* Page Title & Context */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-amoga-brass/20 gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-amoga-charcoal">
              Your Shopping Bag
            </h1>
            <p className="mt-2 text-sm sm:text-base text-amoga-charcoal/70 font-sans max-w-2xl">
              Unified selections across Amoga Gourmet Food, Heritage Handloom Sarees, and Artisan Silver Jewellery.
            </p>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-amoga-charcoal/60 bg-amoga-ivory px-3 py-1.5 rounded-full border border-amoga-brass/20">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in bag
              </span>
              <button
                onClick={clearCart}
                className="text-xs uppercase tracking-widest text-amoga-charcoal/50 hover:text-rose-700 transition-colors underline underline-offset-4"
              >
                Clear Bag
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {cart.length === 0 ? (
          /* Empty Bag State */
          <div className="py-20 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-amoga-ivory border border-amoga-brass/30 flex items-center justify-center mx-auto mb-6 text-amoga-burgundy/60 shadow-sm">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-amoga-charcoal mb-3">
              Your shopping bag is currently empty
            </h2>
            <p className="text-sm sm:text-base text-amoga-charcoal/70 mb-10 leading-relaxed">
              Explore our artisanal collections to discover slow-crafted gourmet provisions, heritage handloom weaves, and hallmarked pure silver adornments.
            </p>

            {/* Collection Discovery Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <Link
                to="/food"
                className="group p-5 rounded-2xl bg-white border border-[#2D5A27]/20 hover:border-[#2D5A27] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#2D5A27]/10 text-[#2D5A27] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg text-amoga-charcoal group-hover:text-[#2D5A27] transition-colors">
                    Gourmet Food
                  </h3>
                  <p className="text-xs text-amoga-charcoal/60 mt-1">
                    Artisanal treats, pure filter coffee & botanical teas
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[#2D5A27] uppercase tracking-wider gap-1">
                  <span>Explore Food</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/sarees"
                className="group p-5 rounded-2xl bg-white border border-[#7A1C2E]/20 hover:border-[#7A1C2E] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#7A1C2E]/10 text-[#7A1C2E] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg text-amoga-charcoal group-hover:text-[#7A1C2E] transition-colors">
                    Heritage Sarees
                  </h3>
                  <p className="text-xs text-amoga-charcoal/60 mt-1">
                    Kanchipuram, Banarasi zari & pure mulberry silks
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[#7A1C2E] uppercase tracking-wider gap-1">
                  <span>Explore Sarees</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/jewellery"
                className="group p-5 rounded-2xl bg-white border border-[#3A4556]/20 hover:border-[#3A4556] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#3A4556]/10 text-[#3A4556] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Gem className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg text-amoga-charcoal group-hover:text-[#3A4556] transition-colors">
                    Silver Jewellery
                  </h3>
                  <p className="text-xs text-amoga-charcoal/60 mt-1">
                    92.5 Sterling silver neckpieces, jhumkas & bangles
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[#3A4556] uppercase tracking-wider gap-1">
                  <span>Explore Silver</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
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
                {cart.map((item) => (
                  <CartItemRow key={item.lineId} item={item} />
                ))}
              </div>

              {/* Bottom browsing banner */}
              <div className="pt-6 border-t border-amoga-brass/20 flex flex-wrap items-center justify-between gap-4 text-xs">
                <span className="text-amoga-charcoal/60">
                  Ready to discover more treasures?
                </span>
                <div className="flex items-center gap-4 uppercase tracking-widest font-semibold">
                  <Link to="/food" className="text-[#2D5A27] hover:underline underline-offset-4">
                    + Food
                  </Link>
                  <Link to="/sarees" className="text-[#7A1C2E] hover:underline underline-offset-4">
                    + Sarees
                  </Link>
                  <Link to="/jewellery" className="text-[#3A4556] hover:underline underline-offset-4">
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
