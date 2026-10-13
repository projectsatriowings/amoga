import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, User, Truck, LogOut } from 'lucide-react';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { COLLECTIONS } from '../../data/collections';
import { IconButton } from '../ui/IconButton';
import { Container } from '../ui/Container';

import { useStore } from '../../store/useStore';
import { useCustomerStore } from '../../features/account/store/useCustomerStore';

export function AppHeader({ activeCollection }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const { customer, isAuthenticated, initAuth, logout } = useCustomerStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

  const isCheckoutRoute =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation') ||
    location.pathname === '/cart';

  // Dynamic header styles based on active collection
  const headerThemeStyles = {
    food: 'bg-[#F3F0E7]/95 text-[#173B2A] border-[#D9DCCD]',
    tea: 'bg-[#FAF1BB]/95 text-[#2C1E11] border-[#B88E38]/20',
    sarees: 'bg-[#F3EAE1]/95 text-[#3B111E] border-[#E0CFC0]',
    jewellery: 'bg-[#F0F1F1]/95 text-[#25272A] border-[#D6D9DC]',
    neutral: 'bg-[#F4F2EC]/95 text-[#292820] border-[#DCD6C7]',
    checkout: 'bg-[#F4F2EC]/95 text-[#292820] border-[#DCD6C7]',
    default: 'bg-[#0e0f12]/90 text-[#F4F4F2] border-white/10',
  };

  const activeThemeClass = activeCollection
    ? (headerThemeStyles[activeCollection.id] || headerThemeStyles[activeCollection.theme] || headerThemeStyles.neutral)
    : headerThemeStyles.default;

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-normal ease-smooth ${activeThemeClass}`}
    >
      <Container className="h-20 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
            title="Amoga Unified Home"
          >
            <img
              src={amogaLogo}
              alt="Amoga"
              className="h-10 md:h-12 w-auto object-contain shrink-0"
            />
          </Link>

          {activeCollection && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-current/20">
              <span className="text-xs uppercase tracking-widest opacity-60 font-medium">
                Collection
              </span>
              <span className="text-sm font-semibold tracking-wide">
                {activeCollection.name}
              </span>
            </div>
          )}
        </div>

        {/* Center: Collection Navigation */}
        <nav
          aria-label="Collections Navigation"
          className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-3"
        >
          <Link
            to="/"
            className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded transition-all ${
              location.pathname === '/'
                ? 'bg-white/10 font-semibold'
                : 'opacity-70 hover:opacity-100 hover:bg-white/5'
            }`}
          >
            Gatekeeper
          </Link>
          {COLLECTIONS.map((col, idx) => {
            const isActive = location.pathname.startsWith(col.path);
            return (
              <Link
                key={col.id}
                to={col.path}
                className={`group px-3.5 py-1.5 rounded text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'font-bold underline decoration-2 underline-offset-8 opacity-100'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">0{idx + 1}</span>
                <span>{col.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Customer Account Button & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs font-medium"
                title="Amoga Patron Account"
              >
                <div className="w-7 h-7 rounded-full bg-[#722F37] text-[#F6EBD8] flex items-center justify-center font-bold text-xs shadow-inner">
                  {customer?.name ? customer.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="hidden lg:inline max-w-[100px] truncate">
                  {customer?.name?.split(' ')[0] || 'Account'}
                </span>
              </button>
            ) : (
              <Link
                to="/account/login"
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center"
                title="Sign In / Register"
              >
                <User className="w-4 h-4 opacity-80 hover:opacity-100" />
              </Link>
            )}

            {/* Dropdown Menu */}
            {userMenuOpen && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-[#2C0E1A] shadow-xl border border-[#E5E0D5] py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-[#EFECE6]">
                  <p className="font-bold text-[#1F0811] truncate">{customer?.name}</p>
                  <p className="text-[11px] text-[#7A7167] font-mono truncate">{customer?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/account?tab=orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-[#4A423B] hover:text-[#1F0811] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#8C6320]" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/track"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-[#4A423B] hover:text-[#1F0811] transition-colors"
                  >
                    <Truck className="w-4 h-4 text-[#8C6320]" />
                    <span>Track Order</span>
                  </Link>

                  <Link
                    to="/account?tab=addresses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-[#4A423B] hover:text-[#1F0811] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#8C6320]" />
                    <span>Saved Residences</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#EFECE6]">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-700 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <IconButton
              icon={<Heart className="w-4 h-4" />}
              label={`Wishlist (${wishlistCount} items)`}
              variant="ghost"
              size="md"
              onClick={openWishlist}
              className="hidden sm:inline-flex"
            />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
                {wishlistCount}
              </span>
            )}
          </div>

          <div className="relative">
            <IconButton
              icon={<ShoppingBag className="w-4 h-4" />}
              label={`Cart (${cartCount} items)`}
              variant="ghost"
              size="md"
              onClick={openCart}
            />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#287A25] text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
                {cartCount}
              </span>
            )}
          </div>

          {/* Mobile hamburger */}
          <IconButton
            icon={mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          />
        </div>
      </Container>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-current/10 py-4 px-6 space-y-3 bg-inherit">
          <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono mb-2">
            Amoga Shopping Collections
          </div>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm uppercase tracking-wider font-medium opacity-80 hover:opacity-100"
          >
            Tri-Fold Gatekeeper
          </Link>
          {COLLECTIONS.map((col, idx) => (
            <Link
              key={col.id}
              to={col.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm uppercase tracking-wider font-medium border-b border-current/5"
            >
              <span>{col.name}</span>
              <span className="font-mono text-xs opacity-50">0{idx + 1}</span>
            </Link>
          ))}

          <div className="pt-3 border-t border-current/10 space-y-2">
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">
              Patron Services
            </div>
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-[#C5A46D]" />
                  <span>My Account ({customer?.name})</span>
                </Link>
                <Link
                  to="/account?tab=orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C5A46D]" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <Truck className="w-4 h-4 text-[#C5A46D]" />
                  <span>Track Order</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 py-2 text-sm text-rose-500 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/account/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-[#C5A46D]" />
                  <span>Sign In / Register</span>
                </Link>
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <Truck className="w-4 h-4 text-[#C5A46D]" />
                  <span>Track Order</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
