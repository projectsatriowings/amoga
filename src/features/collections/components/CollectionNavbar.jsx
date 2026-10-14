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
  Truck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';
import { useStore } from '../../../store/useStore';
import { useCustomerStore } from '../../account/store/useCustomerStore';
import { Container } from '../../../components/ui/Container';
import { getCollectionTheme } from '../themeConfig';
import { CollectionCategoryMenu } from './CollectionCategoryMenu';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { GlobalProfileMenu } from '../../../components/layout/GlobalProfileMenu';

export function CollectionNavbar({ collectionId = 'food' }) {
  const theme = getCollectionTheme(collectionId);
  const palette = theme?.palette || {};
  const categories = theme?.categories || [];

  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const { customer, isAuthenticated, logout } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useBodyScrollLock(Boolean(mobileMenuOpen));

  const dropdownButtonRef = useRef(null);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

  // Active navigation states
  const isHomeActive =
    location.pathname === theme.homePath && !location.hash.includes('contact');
  const isCategoriesActive = location.pathname.startsWith(theme.productsPath);
  const isContactActive = location.hash.includes('contact');

  const scrolledForHashRef = useRef(false);

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
        }
      };

      if (location.pathname === theme.homePath) {
        scrollToTarget();
      } else {
        navigate(`${theme.homePath}#contact`);
      }
    },
    [location.pathname, navigate, theme.homePath]
  );

  // One-time auto-scroll if user arrives via #contact link
  useEffect(() => {
    if (location.pathname === theme.homePath && location.hash === '#contact') {
      if (!scrolledForHashRef.current) {
        scrolledForHashRef.current = true;
        const timer = setTimeout(() => {
          const contactEl = document.getElementById('contact');
          if (contactEl) {
            contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          // Clean hash so subsequent cart updates or drawer state changes never re-trigger contact scroll
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      scrolledForHashRef.current = false;
    }
  }, [location.pathname, location.hash, theme.homePath]);

  // Keep navbar search query in sync with page URL query when on products page
  useEffect(() => {
    if (location.pathname === theme.productsPath) {
      const urlQ = new URLSearchParams(location.search).get('q') || '';
      if (urlQ !== searchQuery.trim() && !searchQuery.startsWith(urlQ)) {
        setSearchQuery(urlQ);
      }
    }
  }, [location.pathname, location.search, theme.productsPath]);

  // Live filter as user types
  useEffect(() => {
    if (location.pathname === theme.productsPath) {
      const timer = setTimeout(() => {
        const sp = new URLSearchParams(location.search);
        if (searchQuery.trim()) {
          sp.set('q', searchQuery.trim());
        } else {
          sp.delete('q');
        }
        const newSearch = sp.toString() ? `?${sp.toString()}` : '';
        if (location.search !== newSearch) {
          navigate(`${theme.productsPath}${newSearch}`, { replace: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length >= 2) {
      // Auto-navigate to products listing when typing search words from other pages
      const timer = setTimeout(() => {
        navigate(`${theme.productsPath}?q=${encodeURIComponent(searchQuery.trim())}`);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, location.pathname, location.search, theme.productsPath, navigate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `${theme.productsPath}?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setMobileMenuOpen(false);
    } else if (location.pathname === theme.productsPath) {
      navigate(theme.productsPath, { replace: true });
    }
  };

  const handleClearNavbarSearch = () => {
    setSearchQuery('');
    if (location.pathname === theme.productsPath) {
      const sp = new URLSearchParams(location.search);
      sp.delete('q');
      const newSearch = sp.toString() ? `?${sp.toString()}` : '';
      navigate(`${theme.productsPath}${newSearch}`, { replace: true });
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors"
        style={{
          backgroundColor: palette.headerBg || '#FFFFFF',
          borderColor: palette.border || '#E5E0D5',
          color: palette.headerText || palette.text || '#292820',
        }}
      >
        {/* Top Announcement Bar */}
        <div
          className="text-[11px] font-medium py-1.5 px-4 text-center tracking-wider border-b transition-colors"
          style={{
            backgroundColor: palette.announcementBg || '#173B2A',
            color: palette.announcementText || '#FFFFFF',
            borderColor: palette.border || '#E5E0D5',
          }}
        >
          <span>{theme.announcement}</span>
          <span className="hidden sm:inline ml-3 opacity-80">
            • Concierge: {theme.conciergePhone}
          </span>
        </div>

        <Container>
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Collection Subtitle */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/"
                title="Return to AMOGA Main Portal"
                className="flex items-center gap-3 group"
              >
                <img
                  src={amogaLogo}
                  alt="AMOGA Main Portal"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <span
                className="hidden sm:inline text-xs font-serif italic pl-3 border-l"
                style={{
                  color: palette.accent || palette.accentGold || '#3F7B43',
                  borderColor: palette.border || '#E5E0D5',
                }}
              >
                {theme.subtitle}
              </span>
            </div>

            {/* Center: Standardized Navigation: HOME | CATEGORIES ▾ | CONTACT */}
            <nav
              aria-label={`${theme.name} Primary Navigation`}
              className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
            >
              {/* 1. HOME */}
              <Link
                to={theme.homePath}
                className="px-3.5 py-2 rounded-lg transition-all relative font-semibold"
                style={{
                  color: isHomeActive
                    ? palette.accent || palette.accentGold || '#3F7B43'
                    : palette.headerText || palette.text || '#292820',
                }}
              >
                <span>Home</span>
                {isHomeActive && (
                  <motion.div
                    layoutId={`nav-active-${collectionId}`}
                    className="absolute bottom-0 left-3 right-3 h-0.5"
                    style={{
                      backgroundColor:
                        palette.accent || palette.accentGold || '#3F7B43',
                    }}
                  />
                )}
              </Link>

              {/* 2. CATEGORIES ▾ */}
              <div className="relative">
                <button
                  ref={dropdownButtonRef}
                  type="button"
                  aria-expanded={categoriesDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setCategoriesDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all font-semibold outline-none focus-visible:ring-2"
                  style={{
                    color: isCategoriesActive || categoriesDropdownOpen
                      ? palette.accent || palette.accentGold || '#3F7B43'
                      : palette.headerText || palette.text || '#292820',
                  }}
                >
                  <span>Categories</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      categoriesDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <CollectionCategoryMenu
                  isOpen={categoriesDropdownOpen}
                  onClose={() => setCategoriesDropdownOpen(false)}
                  categories={categories}
                  palette={palette}
                  anchorRef={dropdownButtonRef}
                />
              </div>

              {/* 3. CONTACT */}
              <button
                type="button"
                onClick={handleContactClick}
                className="px-3.5 py-2 rounded-lg transition-all relative font-semibold hover:opacity-85"
                style={{
                  color: isContactActive
                    ? palette.accent || palette.accentGold || '#3F7B43'
                    : palette.headerText || palette.text || '#292820',
                }}
              >
                <span>Contact</span>
                {isContactActive && (
                  <div
                    className="absolute bottom-0 left-3 right-3 h-0.5"
                    style={{
                      backgroundColor:
                        palette.accent || palette.accentGold || '#3F7B43',
                    }}
                  />
                )}
              </button>
            </nav>

            {/* Right: Search Bar, Actions & Modal Triggers */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Product Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex relative items-center w-48 lg:w-56"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalogue..."
                  className="w-full pl-9 pr-7 py-1.5 rounded-full text-xs border transition-colors outline-none focus:ring-1"
                  style={{
                    backgroundColor: palette.cardBg || '#FFFFFF',
                    borderColor: palette.border || '#E5E0D5',
                    color: palette.text || '#292820',
                  }}
                />
                <Search
                  className="w-3.5 h-3.5 absolute left-3 pointer-events-none"
                  style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearNavbarSearch}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-800 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="View Wishlist"
                style={{ color: palette.headerText || palette.text || '#FFFFFF' }}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono"
                    style={{
                      backgroundColor:
                        palette.accent || palette.accentGold || '#3F7B43',
                    }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="View Shopping Cart"
                style={{ color: palette.headerText || palette.text || '#FFFFFF' }}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono"
                    style={{
                      backgroundColor:
                        palette.accent || palette.accentGold || '#3F7B43',
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Customer Account Global Profile Menu */}
              <GlobalProfileMenu
                collectionId={collectionId}
                buttonStyle={{ color: palette.headerText || palette.text || '#FFFFFF' }}
                triggerClassName="hover:bg-white/10"
              />

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-lg hover:bg-black/5"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </Container>

        {/* Responsive Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="lg:hidden border-t px-4 py-5 space-y-4 overflow-hidden"
              style={{
                backgroundColor: palette.cardBg || '#FFFFFF',
                borderColor: palette.border || '#E5E0D5',
                color: palette.text || '#292820',
              }}
            >
              {/* Mobile Back Button Action (Only on sub-pages) */}
              {location.pathname !== theme.homePath && (
                <div className="pb-3 border-b flex items-center justify-between" style={{ borderColor: palette.border || '#E5E0D5' }}>
                  <BackButton
                    collection={collectionId}
                    fallbackTo={theme.homePath}
                    label="Back"
                  />
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
                    {theme.name}
                  </span>
                </div>
              )}

              {/* Mobile Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalogue..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs border outline-none"
                  style={{
                    backgroundColor: palette.inputBg || '#FFFFFF',
                    borderColor: palette.inputBorder || '#E5E0D5',
                    color: palette.text || '#292820',
                  }}
                />
                <Search
                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                  style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearNavbarSearch}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-800 p-1 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Minimal Nav: Home | Categories | Contact */}
              <div className="space-y-1 text-sm font-medium">
                {/* 1. Home */}
                <Link
                  to={theme.homePath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg border-b transition-colors"
                  style={{
                    borderColor: palette.border || '#E5E0D5',
                    color: isHomeActive
                      ? palette.accent || palette.accentGold || '#3F7B43'
                      : palette.heading || '#173B2A',
                    fontWeight: isHomeActive ? 700 : 500,
                  }}
                >
                  Home
                </Link>

                {/* 2. Categories Expandable Accordion */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-left font-medium hover:bg-black/5"
                    style={{ color: palette.heading || '#173B2A' }}
                  >
                    <span
                      className="text-xs font-mono uppercase tracking-wider font-semibold"
                      style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                    >
                      Categories
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mobileCategoriesOpen ? 'rotate-180' : ''
                      }`}
                      style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                    />
                  </button>

                  {mobileCategoriesOpen && (
                    <div className="pl-2 pr-1 pt-1 space-y-1">
                      {categories.map((cat) => {
                        const isAll = cat.id === 'all';
                        const isItemActive = isAll
                          ? location.pathname.endsWith('/products') && !location.search
                          : location.search.includes(`category=${cat.id}`);

                        return (
                          <Link
                            key={cat.id}
                            to={cat.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-lg text-xs border transition-colors"
                            style={{
                              backgroundColor: isItemActive
                                ? palette.heading || '#173B2A'
                                : palette.cardBg || '#FFFFFF',
                              color: isItemActive
                                ? palette.announcementText || '#FFFFFF'
                                : palette.text || '#292820',
                              borderColor: palette.border || '#E5E0D5',
                              fontWeight: isItemActive ? 600 : 400,
                            }}
                          >
                            <span>{cat.name}</span>
                            {cat.count !== undefined && (
                              <span
                                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: isItemActive
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : palette.accentLight || 'rgba(0, 0, 0, 0.05)',
                                  color: isItemActive
                                    ? '#FFFFFF'
                                    : palette.heading || '#173B2A',
                                }}
                              >
                                {cat.count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Shopping Bag / Cart */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg border-t transition-colors cursor-pointer text-left"
                  style={{
                    borderColor: palette.border || '#E5E0D5',
                    color: palette.heading || '#173B2A',
                  }}
                  aria-label="Open Shopping Bag"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shopping Bag</span>
                  </span>
                  {cartCount > 0 && (
                    <span
                      className="text-white text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{
                        backgroundColor:
                          palette.accent || palette.accentGold || '#3F7B43',
                      }}
                    >
                      {cartCount} items
                    </span>
                  )}
                </button>

                {/* 3. Contact */}
                <button
                  type="button"
                  onClick={handleContactClick}
                  className="w-full text-left block py-2.5 px-3 rounded-lg border-t transition-colors"
                  style={{
                    borderColor: palette.border || '#E5E0D5',
                    color: isContactActive
                      ? palette.accent || palette.accentGold || '#3F7B43'
                      : palette.heading || '#173B2A',
                    fontWeight: isContactActive ? 700 : 500,
                  }}
                >
                  Contact
                </button>

                {/* Account Services in Mobile Drawer */}
                <div className="pt-2 border-t space-y-1 text-xs" style={{ borderColor: palette.border || '#E5E0D5' }}>
                  <div className="text-[10px] uppercase tracking-widest font-mono opacity-60 px-3 py-1">
                    Patron Account
                  </div>
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/account?tab=profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      >
                        <User className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>My Profile ({customer?.name || 'Account'})</span>
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      >
                        <ShoppingBag className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/track"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      >
                        <Truck className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>Track Order</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-left font-medium cursor-pointer"
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
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      >
                        <User className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>Sign In</span>
                      </Link>
                      <Link
                        to="/account/login?mode=register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium opacity-80"
                      >
                        <Sparkles className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>Create Account</span>
                      </Link>
                      <Link
                        to="/track"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      >
                        <Truck className="w-4 h-4" style={{ color: palette.accent || palette.accentGold || '#C5A46D' }} />
                        <span>Track Order</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className="pt-2 border-t" style={{ borderColor: palette.border || '#E5E0D5' }}>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-xs font-mono"
                    style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                  >
                    &larr; Switch Collection (Gatekeeper)
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
