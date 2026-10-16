import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { CheckoutForm } from './components/CheckoutForm';
import { CheckoutOrderSummary } from './components/CheckoutOrderSummary';
import { ShoppingBag, ShieldAlert, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import { BackButton } from '../../components/ui/BackButton';

export const CheckoutPage = () => {
  const getCheckoutItems = useStore((state) => state.getCheckoutItems);
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);
  const checkoutContext = useStore((state) => state.checkoutContext);
  const resolved = useResolvedTheme();

  const checkoutItems = getCheckoutItems();
  const { hasUnpricedItems } = getCheckoutTotals();

  const isBuyNow = checkoutContext?.type === 'buy_now';

  // If no items are in checkout context (empty bag or 0 items selected)
  if (checkoutItems.length === 0) {
    return (
      <div
        className="min-h-screen pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-normal"
        style={{
          ...resolved.cssVariables,
          backgroundColor: 'var(--collection-page-bg)',
          color: 'var(--collection-text)',
        }}
      >
        <div
          className="max-w-xl mx-auto text-center py-16 rounded-2xl p-8 border shadow-sm"
          style={{
            backgroundColor: 'var(--collection-card-bg)',
            borderColor: 'var(--collection-border)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: 'var(--collection-section-bg)',
              borderColor: 'var(--collection-border)',
              color: 'var(--collection-accent)',
            }}
          >
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1
            className="font-serif text-2xl mb-2"
            style={{ color: 'var(--collection-heading)' }}
          >
            No Items Selected for Checkout
          </h1>
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            You have not selected any items from your cart for purchase. Please return to your cart and select the products you wish to order.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-md cursor-pointer hover:opacity-95"
            style={{
              backgroundColor: 'var(--collection-accent)',
              color: 'var(--collection-button-text, #FFFFFF)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Cart</span>
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Breadcrumb Navigation & Return to Cart */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackButton fallbackTo="/cart" label="Back to Cart" />

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
              <li>
                <Link to="/cart" className="hover:opacity-80 transition-opacity">
                  Cart
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
                Delivery Address
              </li>
            </ol>
          </nav>

          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider hover:underline"
            style={{ color: 'var(--collection-accent)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* Page Title */}
        <div
          className="pb-6 border-b mb-8"
          style={{ borderColor: 'var(--collection-border)' }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isBuyNow ? (
              <span
                className="text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1"
                style={{
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  borderColor: 'rgba(234, 88, 12, 0.3)',
                  color: '#C2410C',
                }}
              >
                <Zap className="w-3 h-3" />
                Buy Now &bull; Immediate Single Item Checkout
              </span>
            ) : (
              <span
                className="text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--collection-section-bg)',
                  borderColor: 'var(--collection-border)',
                  color: 'var(--collection-accent)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                Selective Checkout &bull; {checkoutItems.length} {checkoutItems.length === 1 ? 'Product' : 'Products'} Selected
              </span>
            )}
          </div>
          <h1
            className="font-serif text-3xl sm:text-4xl"
            style={{ color: 'var(--collection-heading)' }}
          >
            Delivery Address
          </h1>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            {isBuyNow
              ? 'Complete your single item purchase. Your cart remains untouched.'
              : 'Purchasing only your selected items. Unselected items remain saved in your cart.'}
          </p>
        </div>

        {/* Safeguard Warning if unpriced items exist */}
        {hasUnpricedItems && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-sm">Action Required: Unpriced Items</h2>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Your checkout contains items with pricing pending approval. Please return to your cart and uncheck or remove unpriced items before you can proceed.
              </p>
              <Link
                to="/cart"
                className="mt-2 inline-block text-xs font-semibold text-amber-900 underline underline-offset-4"
              >
                Review Cart Selection
              </Link>
            </div>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Column (8 cols on desktop) */}
          <div className="lg:col-span-8 w-full">
            <CheckoutForm />
          </div>

          {/* Sticky Summary Column (4 cols on desktop) */}
          <div className="lg:col-span-4 w-full">
            <CheckoutOrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
};
