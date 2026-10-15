import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShoppingBag,
  Truck,
  MapPin,
  LogOut,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useCustomerStore } from '../../features/account/store/useCustomerStore';
import amogaLogo from '../../assets/images/amoga-logo.png';

/**
 * GlobalProfileMenu Component
 * 
 * Provides a unified, consistent customer account menu across all Amoga pages & collections:
 * - Wholesome Pantry, Wellness Tea, Heritage Sarees, Silver Jewellery
 * - Homepage (Gatekeeper), Product Detail Pages, Listing Pages, Cart, Checkout, Tracking
 * 
 * Accurately reflects real authentication state from useCustomerStore:
 * - Signed-out: Welcome message, Sign In CTA, Create Account, Track Order, My Orders, Need Help
 * - Signed-in: Customer name & email, My Profile, My Orders, Track Order, Saved Addresses, Sign Out
 */
export function GlobalProfileMenu({
  _collectionId,
  triggerClassName = '',
  buttonStyle = {},
  iconClassName = 'w-5 h-5',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, isAuthenticated, logout, initAuth, orders, addresses } = useCustomerStore();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Initialize auth state once on mount from persisted token
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleContactScroll = useCallback(
    (e) => {
      e.preventDefault();
      setIsOpen(false);
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/#contact');
      }
    },
    [navigate]
  );

  // Customer initials
  const initials = customer?.name
    ? customer.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('')
    : customer?.email
    ? customer.email.charAt(0).toUpperCase()
    : 'A';

  return (
    <div className="relative inline-block text-left">
      {/* Profile Icon Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isAuthenticated ? `Customer Account: ${customer?.name || 'Patron'}` : 'Customer Account & Profile Menu'}
        className={`relative p-2 rounded-full transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center justify-center text-current hover:bg-current/10 ${triggerClassName}`}
        style={buttonStyle}
      >
        {isAuthenticated ? (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#722F37] to-[#421319] text-[#F6EBD8] flex items-center justify-center font-serif text-xs font-bold shadow-sm border border-white/20">
            {initials}
          </div>
        ) : (
          <User className={iconClassName} />
        )}

        {/* Ambient indicator dot if signed in */}
        {isAuthenticated && (
          <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
        )}
      </button>

      {/* Profile Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop for touch focus */}
            <div
              className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              ref={menuRef}
              role="menu"
              aria-label="Customer Profile Navigation"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-20 sm:top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[340px] max-w-[360px] rounded-2xl bg-white text-[#1F0811] shadow-2xl border border-[#E5E0D5] py-2 z-50 overflow-hidden font-sans select-none"
              style={{
                boxShadow: '0 20px 40px -10px rgba(44, 14, 26, 0.18), 0 0 1px 1px rgba(0,0,0,0.06)',
              }}
            >
              {/* Header: Auth Status Overview */}
              {isAuthenticated ? (
                <div className="px-5 py-4 border-b border-[#EFECE6] bg-[#FAF8F5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#722F37] to-[#3B1117] text-[#F6EBD8] font-serif font-bold text-sm flex items-center justify-center shadow-inner shrink-0 border border-[#C5A46D]/40">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-serif font-bold text-sm text-[#1F0811] truncate">
                          {customer?.name || 'Valued Patron'}
                        </p>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8C6320] shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#7A7167] font-mono truncate">
                        {customer?.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 border-b border-[#EFECE6] bg-[#FAF8F5] text-center space-y-3">
                  <div className="flex items-center justify-center">
                    <img
                      src={amogaLogo}
                      alt="Amoga"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg text-[#1F0811]">
                      Welcome to Amoga
                    </h3>
                    <p className="text-xs text-[#7A7167] leading-relaxed max-w-xs mx-auto">
                      Sign in to access order history, live tracking & saved addresses.
                    </p>
                  </div>

                  <div className="pt-1 space-y-2">
                    <Link
                      to="/account/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider bg-[#722F37] text-[#F6EBD8] hover:bg-[#5E2229] transition-all shadow-xs active:scale-[0.99]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/account/login?mode=register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-2 px-4 rounded-xl text-center text-xs font-medium text-[#722F37] hover:bg-[#722F37]/10 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Menu Links */}
              <div className="py-2 px-2 text-xs space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/account?tab=profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">My Profile</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Personal details & account info</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </Link>

                    <Link
                      to="/account?tab=orders"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">My Orders</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Past purchases & history</p>
                        </div>
                      </div>
                      {orders?.length > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#722F37]/10 text-[#722F37] shrink-0 ml-2">
                          {orders.length}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      )}
                    </Link>

                    <Link
                      to="/track"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">Track Order</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Live parcel & atelier status</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </Link>

                    <Link
                      to="/account?tab=addresses"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">Saved Addresses</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Delivery residences</p>
                        </div>
                      </div>
                      {addresses?.length > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 shrink-0 ml-2">
                          {addresses.length}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      )}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/track"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">Track Order</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Check status with reference ID</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </Link>

                    <Link
                      to="/account/login?redirect=/account?tab=orders"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">My Orders</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Sign in required to view history</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#8C6320] font-semibold shrink-0 ml-2 px-2 py-0.5 rounded bg-[#8C6320]/10">
                        Sign In
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleContactScroll}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C0E1A] transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-white text-[#8C6320] flex items-center justify-center border border-[#E5E0D5] shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F0811] truncate">Need Help?</p>
                          <p className="text-[11px] text-[#7A7167] truncate">Customer care & inquiries</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5A46D] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Sign Out Bar (Only when Authenticated) */}
              {isAuthenticated && (
                <div className="pt-2 mt-1 border-t border-[#EFECE6] px-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
