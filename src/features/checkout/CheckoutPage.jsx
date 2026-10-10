import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { CheckoutForm } from './components/CheckoutForm';
import { CheckoutOrderSummary } from './components/CheckoutOrderSummary';
import { ShoppingBag, ShieldAlert } from 'lucide-react';

export const CheckoutPage = () => {
  const cart = useStore((state) => state.cart);
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { hasUnpricedItems } = getCartTotals();
  const resolved = useResolvedTheme();

  // If cart is empty, redirect or prompt customer
  if (cartItems.length === 0) {
    return (
      <div
        className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-normal"
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
            No Items in Checkout
          </h1>
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            Your shopping bag is currently empty. Please select products from our collections before proceeding with checkout.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-md cursor-pointer hover:opacity-95"
            style={{
              backgroundColor: 'var(--collection-accent)',
              color: 'var(--collection-button-text, #FFFFFF)',
            }}
          >
            Go to Shopping Bag
          </Link>
        </div>
      </div>
    );
  }

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
            <li>
              <Link to="/cart" className="hover:opacity-80 transition-opacity">
                Bag
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
              Checkout & Delivery
            </li>
          </ol>
        </nav>

        {/* Page Title */}
        <div
          className="pb-6 border-b mb-8"
          style={{ borderColor: 'var(--collection-border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border inline-block"
              style={{
                backgroundColor: 'var(--collection-section-bg)',
                borderColor: 'var(--collection-border)',
                color: 'var(--collection-accent)',
              }}
            >
              {resolved.isMixed ? 'Amoga Unified Checkout' : `${resolved.theme.name} Checkout`}
            </span>
          </div>
          <h1
            className="font-serif text-3xl sm:text-4xl"
            style={{ color: 'var(--collection-heading)' }}
          >
            Delivery & Customer Details
          </h1>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: 'var(--collection-text-muted)' }}
          >
            Please enter your contact and destination details for this simulated checkout preview.
          </p>
        </div>

        {/* Safeguard Warning if unpriced items exist */}
        {hasUnpricedItems && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-sm">Action Required: Unpriced Items</h2>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Your cart contains items with pricing pending approval. You must return to your shopping bag and remove unpriced items before you can proceed to the final review.
              </p>
              <Link
                to="/cart"
                className="mt-2 inline-block text-xs font-semibold text-amber-900 underline underline-offset-4"
              >
                Review and Edit Bag
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
