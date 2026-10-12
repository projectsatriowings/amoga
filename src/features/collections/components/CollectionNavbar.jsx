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
import { getCollectionTheme } from '../themeConfig';
import { CollectionCategoryMenu } from './CollectionCategoryMenu';

export function CollectionNavbar({ collectionId = 'food' }) {
  const theme = getCollectionTheme(collectionId);
  const palette = theme?.palette || {};
  const categories = theme?.categories || [];

  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const dropdownButtonRef = useRef(null);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

  // Active navigation states
  const isHomeActive =
    location.pathname === theme.homePath && !location.hash.includes('contact');
  const isCategoriesActive = location.pathname.startsWith(theme.productsPath);
  const isContactActive = location.hash.includes('contact');

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

      if (location.pathname === theme.homePath) {
        scrollToTarget();
      } else {
        navigate(`${theme.homePath}#contact`);
      }
    },
    [location.pathname, navigate, theme.homePath]
  );

  // Auto-scroll if page loads or changes with #contact hash
  useEffect(() => {
    if (
      location.pathname === theme.homePath &&
      (location.hash === '#contact' || window.location.hash === '#contact')
    ) {
      const timer = setTimeout(() => {
        const contactEl = document.getElementById('contact');
        if (contactEl) {
          contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash, theme.homePath]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `${theme.productsPath}?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchQuery('');
      setMobileMenuOpen(false);
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
            <div className="flex items-center gap-4 shrink-0">
              <Link to={theme.homePath} className="flex items-center gap-3 group">
                <img
                  src={amogaLogo}
                  alt={theme.name}
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <span
                className="hidden xl:inline text-xs font-serif italic pl-3 border-l"
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
                  className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs border transition-colors outline-none focus:ring-1"
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
              </form>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
                aria-label="View Wishlist"
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
              <Link
                to="/cart"
                className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
                aria-label="View Shopping Cart"
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
              </Link>

              {/* Customer Care / Account Modal Trigger */}
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Customer Care & Assistance"
              >
                <User className="w-5 h-5" />
              </button>

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
              {/* Mobile Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalogue..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none"
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
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg border-t transition-colors"
                  style={{
                    borderColor: palette.border || '#E5E0D5',
                    color: palette.heading || '#173B2A',
                  }}
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
                </Link>

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

                <div className="pt-3">
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

      {/* Account / Concierge Modal */}
      {accountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div
            className="rounded-2xl max-w-sm w-full p-6 space-y-4 border shadow-2xl transition-all"
            style={{
              backgroundColor: palette.cardBg || '#FFFFFF',
              borderColor: palette.border || '#E5E0D5',
              color: palette.text || '#292820',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User
                  className="w-5 h-5"
                  style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
                />
                <h3
                  className="font-serif font-medium text-base"
                  style={{ color: palette.heading || '#173B2A' }}
                >
                  {theme.name} Concierge
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed font-sans opacity-80">
              For direct telephone order placement, bespoke assistance, and dispatch tracking:
            </p>
            <div
              className="p-3.5 rounded-xl border space-y-1.5 text-xs font-mono"
              style={{
                backgroundColor: palette.bg || '#F8F6F0',
                borderColor: palette.border || '#E5E0D5',
                color: palette.heading || '#173B2A',
              }}
            >
              <div>Phone: {theme.contact?.phone1}</div>
              <div>Direct: {theme.contact?.phone2}</div>
              <div>Email: {theme.contact?.email1}</div>
              <div>Hours: {theme.contact?.hours}</div>
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="w-full py-2.5 rounded-xl text-white text-xs font-medium uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: palette.heading || palette.accent || '#173B2A',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
