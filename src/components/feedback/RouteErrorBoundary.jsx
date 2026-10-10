import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react';
import { AppShell } from '../layout/AppShell';

export function RouteErrorBoundary() {
  const error = useRouteError();

  // Log diagnostic error information in development
  React.useEffect(() => {
    if (error) {
      console.error('[Amoga Route Error Caught]:', error);
    }
  }, [error]);

  const errorMessage =
    error?.statusText ||
    error?.message ||
    'An unexpected runtime issue occurred while loading this page.';

  // Safeguard: Never expose sensitive database traces or internals to shoppers
  const isInternal =
    errorMessage.includes('prisma') ||
    errorMessage.includes('SQL') ||
    errorMessage.includes('password') ||
    errorMessage.includes('token') ||
    errorMessage.includes('secret');

  const customerFacingMessage = isInternal
    ? 'A temporary system issue occurred. Please refresh the page or return to your shopping bag.'
    : errorMessage;

  return (
    <AppShell>
      <div className="min-h-[70vh] bg-amoga-paper pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-amoga-brass/25 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-widest text-amoga-burgundy font-semibold block mb-2">
            Checkout Safeguard
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl text-amoga-charcoal mb-3">
            Unable to Load Page
          </h1>

          <p className="text-sm text-amoga-charcoal/70 mb-8 leading-relaxed">
            {customerFacingMessage}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amoga-burgundy text-amoga-ivory text-sm font-medium hover:bg-amoga-burgundy/90 transition-all shadow-md shadow-amoga-burgundy/15"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <Link
              to="/cart"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amoga-ivory text-amoga-burgundy border border-amoga-brass/30 text-sm font-medium hover:bg-amoga-brass/15 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Bag</span>
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amoga-brass/20 text-amoga-charcoal/70 text-sm font-medium hover:text-amoga-charcoal transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
