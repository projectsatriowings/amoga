import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, User, Truck, LogOut } from 'lucide-react';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { COLLECTIONS } from '../../data/collections';
import { Container } from '../ui/Container';

import { useStore } from '../../store/useStore';
import { useCustomerStore } from '../../features/account/store/useCustomerStore';
import { GlobalProfileMenu } from './GlobalProfileMenu';

export function AppHeader({ activeCollection }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const { customer, isAuthenticated, logout } = useCustomerStore();

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

  const announcementBgMap = {
    food: '#173B2A',
    tea: '#2C1E11',
    sarees: '#35121F',
    jewellery: '#1B1C1F',
  };
  const activeAnnounceBg = activeCollection?.id && announcementBgMap[activeCollection.id]
    ? announcementBgMap[activeCollection.id]
    : '#173B2A';

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-normal ease-smooth shadow-xs ${activeThemeClass}`}
    >
      {/* Top Announcement Bar */}
      <div
        className="min-h-[34px] py-1.5 px-4 text-center text-[11px] font-medium tracking-wider border-b transition-colors flex items-center justify-center text-white"
        style={{
          backgroundColor: activeAnnounceBg,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <span>Free Pan-India Delivery on Orders Above ₹999</span>
        <span className="hidden sm:inline ml-3 opacity-80">
          • Call Us: +91 9940018593
        </span>
      </div>

      <Container className="h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0 select-none">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded shrink-0 group"
            title="Amoga Main Portal"
          >
            <img
              src={amogaLogo}
              alt="Amoga"
              className="h-10 sm:h-11 w-auto max-w-[145px] sm:max-w-[160px] object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* Center: Collection Navigation */}
        <nav
          aria-label="Collections Navigation"
          className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0"
        >
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={openWishlist}
            className="relative h-9 w-9 p-0 flex items-center justify-center rounded-full hover:bg-current/10 text-current transition-colors cursor-pointer shrink-0"
            aria-label="View Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full bg-red-600 flex items-center justify-center font-mono pointer-events-none">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={openCart}
            className="relative h-9 w-9 p-0 flex items-center justify-center rounded-full hover:bg-current/10 text-current transition-colors cursor-pointer shrink-0"
            aria-label="My Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full bg-[#287A25] flex items-center justify-center font-mono pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Customer Account Global Profile Menu */}
          <GlobalProfileMenu triggerClassName="hover:bg-current/10 text-current" />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 w-9 p-0 flex items-center justify-center rounded-lg hover:bg-current/10 text-current cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-current/10 py-4 px-6 space-y-3 bg-inherit">
          <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono mb-2">
            Shop Collections
          </div>

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
              Account Services
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
                  <span>Sign In / Create Account</span>
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
