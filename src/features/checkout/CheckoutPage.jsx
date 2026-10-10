import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { CheckoutForm } from './components/CheckoutForm';
import { CheckoutOrderSummary } from './components/CheckoutOrderSummary';
import { ShoppingBag, ShieldAlert } from 'lucide-react';

export const CheckoutPage = () => {
  const cart = useStore((state) => state.cart);
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { hasUnpricedItems } = getCartTotals();

  // If cart is empty, redirect or prompt customer
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-amoga-paper pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl p-8 border border-amoga-brass/20 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amoga-ivory border border-amoga-brass/30 flex items-center justify-center mx-auto mb-4 text-amoga-burgundy">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl text-amoga-charcoal mb-2">
            No Items in Checkout
          </h1>
          <p className="text-sm text-amoga-charcoal/70 mb-6">
            Your shopping bag is currently empty. Please select products from our collections before proceeding with checkout.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-amoga-burgundy text-amoga-ivory text-sm font-medium hover:bg-amoga-burgundy/90 transition-all shadow-md"
          >
            Go to Shopping Bag
          </Link>
        </div>
      </div>
    );
  }

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
            <li>
              <Link to="/cart" className="hover:text-amoga-burgundy transition-colors">
                Bag
              </Link>
            </li>
            <li>
              <span className="text-amoga-charcoal/40">/</span>
            </li>
            <li className="text-amoga-burgundy font-medium" aria-current="page">
              Checkout & Delivery
            </li>
          </ol>
        </nav>

        {/* Page Title */}
        <div className="pb-6 border-b border-amoga-brass/20 mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-amoga-charcoal">
            Delivery & Customer Details
          </h1>
          <p className="mt-1 text-sm text-amoga-charcoal/70">
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
          {/* Main Form Column (8 cols) */}
          <div className="lg:col-span-8">
            <CheckoutForm />
          </div>

          {/* Sticky Summary Column (4 cols) */}
          <div className="lg:col-span-4">
            <CheckoutOrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
};
