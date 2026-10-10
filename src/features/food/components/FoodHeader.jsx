import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';
import { useStore } from '../../../store/useStore';
import { Container } from '../../../components/ui/Container';
import { FOOD_CATEGORIES } from '../data/categories';

export function FoodHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

  // Active navigation states
  const isHomeActive = location.pathname === '/food' && !location.hash.includes('contact');
  const isCategoriesActive = location.pathname.startsWith('/food/products');
  const isContactActive = location.hash.includes('contact');

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!categoriesDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setCategoriesDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCategoriesDropdownOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [categoriesDropdownOpen]);

  // Handle smooth scroll to contact section
  const handleContactClick = useCallback(
    (e) => {
      if (e) e.preventDefault();
      setMobileMenuOpen(false);
      setCategoriesDropdownOpen(false);

      const scrollToTarget = () => {
        const contactEl = document.getElementById('contact');
        if (contactEl) {
          contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.location.hash !== '#contact') {
            window.history.pushState(null, '', '#contact');
          }
        }
      };

      if (location.pathname === '/food') {
        scrollToTarget();
      } else {
        navigate('/food#contact');
      }
    },
    [location.pathname, navigate]
  );

  // Auto-scroll if page loads or changes with #contact hash
  useEffect(() => {
    if (location.pathname === '/food' && (location.hash === '#contact' || window.location.hash === '#contact')) {
      const timer = setTimeout(() => {
        const contactEl = document.getElementById('contact');
        if (contactEl) {
          contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/food/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F8F6F0]/95 backdrop-blur-md border-b border-[#E5E0D5] transition-colors">
        {/* Top Announcement Bar */}
        <div className="bg-[#173B2A] text-[#F8F6F0] text-[11px] font-medium py-1.5 px-4 text-center tracking-wider">
          <span>Traditional Soup Mixes &bull; Nourishing Millet Blends &bull; Flavourful Rice Podis</span>
          <span className="hidden sm:inline ml-3 opacity-90">&bull; Orders Support: +91 9940018593</span>
        </div>

        <Container>
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Tagline */}
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/food" className="flex items-center gap-3 group">
                <img
                  src={amogaLogo}
                  alt="Amoga Wholesome Pantry"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <span className="hidden xl:inline text-xs font-serif italic text-[#3F7B43] pl-3 border-l border-[#173B2A]/15">
                The Goodness of Tradition
              </span>
            </div>

            {/* Center: Primary Navigation (Home | Categories ▾ | Contact) */}
            <nav
              aria-label="Wholesome Pantry Store Navigation"
              className="hidden lg:flex items-center gap-2 xl:gap-3 text-xs uppercase tracking-wider font-medium text-[#173B2A]"
            >
              {/* 1. Home */}
              <Link
                to="/food"
                className={`px-4 py-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F7B43] ${
                  isHomeActive
                    ? 'font-bold text-[#173B2A] bg-[#173B2A]/10 shadow-2xs'
                    : 'hover:text-[#3F7B43] hover:bg-[#173B2A]/5'
                }`}
              >
                Home
              </Link>

              {/* 2. Categories Dropdown */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  id="categories-dropdown-btn"
                  onClick={() => setCategoriesDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={categoriesDropdownOpen}
                  aria-controls="categories-dropdown-menu"
                  className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F7B43] ${
                    isCategoriesActive || categoriesDropdownOpen
                      ? 'font-bold text-[#173B2A] bg-[#173B2A]/10 shadow-2xs'
                      : 'hover:text-[#3F7B43] hover:bg-[#173B2A]/5'
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      categoriesDropdownOpen ? 'rotate-180 text-[#3F7B43]' : 'opacity-70'
                    }`}
                  />
                </button>

                {/* Dropdown Menu (All Mixes, Soup Mixes, Millet Mixes, Rice Podis) */}
                <AnimatePresence>
                  {categoriesDropdownOpen && (
                    <motion.div
                      ref={dropdownRef}
                      id="categories-dropdown-menu"
                      role="menu"
                      aria-labelledby="categories-dropdown-btn"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6, scale: 0.98 }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full left-0 mt-2 w-72 p-2 bg-[#F8F6F0] border border-[#E5E0D5] rounded-2xl shadow-xl z-50 text-left normal-case space-y-1"
                    >
                      {FOOD_CATEGORIES.map((cat) => {
                        const isAll = cat.id === 'all';
                        const targetPath = isAll ? '/food/products' : `/food/products?category=${cat.id}`;
                        const isItemActive = isAll
                          ? location.pathname === '/food/products' && !location.search
                          : location.search.includes(`category=${cat.id}`);

                        return (
                          <Link
                            key={cat.id}
                            to={targetPath}
                            role="menuitem"
                            onClick={() => setCategoriesDropdownOpen(false)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                              isItemActive
                                ? 'bg-[#173B2A] text-white shadow-xs'
                                : 'hover:bg-[#EAE4D9]/80 text-[#173B2A]'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold">
                                {cat.name}
                              </div>
                              <div className={`text-[10px] mt-0.5 ${isItemActive ? 'text-[#F8F6F0]/80' : 'text-[#3F7B43]'}`}>
                                {isAll ? 'Complete collection (55 items)' : cat.badge || `${cat.count} items`}
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isItemActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#E5E0D5]/60 text-[#292820]/70'
                            }`}>
                              {cat.count}
                            </span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Contact */}
              <button
                type="button"
                onClick={handleContactClick}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F7B43] ${
                  isContactActive
                    ? 'font-bold text-[#173B2A] bg-[#173B2A]/10 shadow-2xs'
                    : 'hover:text-[#3F7B43] hover:bg-[#173B2A]/5'
                }`}
              >
                Contact
              </button>
            </nav>

            {/* Right: Search Input & Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative hidden sm:flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pantry mixes & recipes..."
                  className="w-48 md:w-56 lg:w-64 pl-9 pr-3 py-2 rounded-full text-xs bg-white/90 border border-[#E5E0D5] focus:outline-none focus:border-[#173B2A] focus:ring-1 focus:ring-[#173B2A] placeholder:text-[#292820]/45 text-[#173B2A] transition-all"
                  aria-label="Search Wholesome Pantry products"
                />
                <Search className="w-3.5 h-3.5 text-[#3F7B43] absolute left-3 pointer-events-none" />
              </form>

              {/* Account / Support Icon */}
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 text-[#173B2A] transition-colors focus-visible:ring-2 focus-visible:ring-[#3F7B43]"
                aria-label="Customer Account Information"
                title="Customer Support & Orders"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Wishlist Button with Badge */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-black/5 text-[#173B2A] transition-colors focus-visible:ring-2 focus-visible:ring-[#3F7B43]"
                aria-label={`Wishlist with ${wishlistCount} saved items`}
                title="View Saved Favourites"
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button with Count Badge */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-black/5 text-[#173B2A] transition-colors focus-visible:ring-2 focus-visible:ring-[#3F7B43]"
                aria-label={`Shopping Cart with ${cartCount} items`}
                title="Open Shopping Basket"
              >
                <ShoppingBag className="w-4 h-4 text-[#173B2A]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#3F7B43] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-black/5 text-[#173B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F7B43]"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
              className="lg:hidden border-t border-[#E5E0D5] bg-[#F8F6F0] p-5 space-y-4 overflow-hidden"
            >
              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pantry mixes & recipes..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-white border border-[#E5E0D5] focus:outline-none focus:border-[#173B2A]"
                />
                <Search className="w-4 h-4 text-[#3F7B43] absolute left-3 top-3 pointer-events-none" />
              </form>

              {/* Minimal Nav: Home | Categories | Contact */}
              <div className="space-y-1 text-sm font-medium">
                {/* 1. Home */}
                <Link
                  to="/food"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2.5 px-3 rounded-lg border-b border-[#E5E0D5]/50 ${
                    isHomeActive ? 'text-[#173B2A] font-bold bg-[#173B2A]/10' : 'text-[#173B2A]'
                  }`}
                >
                  Home
                </Link>

                {/* 2. Categories Expandable Accordion */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-left text-[#173B2A] font-medium hover:bg-black/5"
                  >
                    <span className="text-xs font-mono uppercase tracking-wider text-[#3F7B43] font-semibold">
                      Categories
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#3F7B43] transition-transform duration-200 ${
                        mobileCategoriesOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileCategoriesOpen && (
                    <div className="pl-2 pr-1 pt-1 space-y-1">
                      {FOOD_CATEGORIES.map((cat) => {
                        const isAll = cat.id === 'all';
                        const targetPath = isAll ? '/food/products' : `/food/products?category=${cat.id}`;
                        const isItemActive = isAll
                          ? location.pathname === '/food/products' && !location.search
                          : location.search.includes(`category=${cat.id}`);

                        return (
                          <Link
                            key={cat.id}
                            to={targetPath}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                              isItemActive
                                ? 'bg-[#173B2A] text-white font-semibold'
                                : 'bg-white border border-[#E5E0D5]/70 text-[#173B2A]'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isItemActive ? 'bg-white/20 text-white' : 'bg-[#E5E0D5]/60 text-[#292820]/70'
                            }`}>
                              {cat.count}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Contact */}
                <button
                  type="button"
                  onClick={handleContactClick}
                  className={`w-full text-left block py-2.5 px-3 rounded-lg border-t border-[#E5E0D5]/50 ${
                    isContactActive ? 'text-[#173B2A] font-bold bg-[#173B2A]/10' : 'text-[#173B2A]'
                  }`}
                >
                  Contact
                </button>

                <div className="pt-3">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-xs font-mono text-[#3F7B43]"
                  >
                    &larr; Switch Collection (Gatekeeper)
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Account Info Modal */}
      {accountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-[#F8F6F0] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#E5E0D5] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#3F7B43]" />
                <h3 className="font-serif font-medium text-base text-[#173B2A]">
                  Wholesome Pantry Customer Care
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 text-[#173B2A]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#292820]/80 leading-relaxed font-sans">
              For direct telephone order placement, bulk pantry orders, and dispatch tracking:
            </p>
            <div className="p-3.5 rounded-xl bg-white border border-[#E5E0D5] space-y-1.5 text-xs font-mono text-[#173B2A]">
              <div>Phone: +91 9940018593</div>
              <div>Direct: +91 8056700646</div>
              <div>Desk: orders@amoga.com</div>
              <div>Hours: Mon–Sat, 9 AM – 7 PM IST</div>
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#173B2A] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#25553D] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
