import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

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
      <header className="sticky top-0 z-40 bg-[#F1EDE4]/95 backdrop-blur-md border-b border-[#172B1C]/10 transition-colors">
        {/* Top Announcement Bar */}
        <div className="bg-[#287A25] text-white text-[11px] font-medium py-1.5 px-4 text-center tracking-wider">
          <span>Pure Food &bull; Farm-Fresh &bull; Single-Origin Teas & Traditional Soup Mixes</span>
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
              <span className="hidden xl:inline text-xs font-serif italic text-[#557C36] pl-3 border-l border-[#172B1C]/15">
                Pure Food &bull; Better Life
              </span>
            </div>

            {/* Center: Primary Navigation */}
            <nav
              aria-label="Food Store Navigation"
              className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs uppercase tracking-wider font-medium text-[#172B1C]"
            >
              <Link
                to="/food"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#287A25] ${
                  location.pathname === '/food' && !location.search
                    ? 'font-bold text-[#287A25]'
                    : ''
                }`}
              >
                Home
              </Link>

              <Link
                to="/food/products"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#287A25] ${
                  location.pathname.startsWith('/food/products') && !location.search
                    ? 'font-bold text-[#287A25]'
                    : ''
                }`}
              >
                Shop
              </Link>

              {/* Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="px-3 py-1.5 rounded flex items-center gap-1 hover:text-[#287A25] transition-colors"
                  aria-expanded={categoriesDropdownOpen}
                >
                  <span>Categories</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 p-2 bg-[#F1EDE4] border border-[#172B1C]/10 rounded-xl shadow-xl z-50 text-left normal-case space-y-1">
                    {FOOD_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/food/products?category=${cat.id}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E5DFD3]/70 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#172B1C]">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-[#557C36]">
                            {cat.badge || `${cat.count} items`}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-black/40">
                          {cat.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <a
                href="#our-story"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#287A25]"
              >
                Our Story
              </a>

              <a
                href="#sustainability"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#287A25]"
              >
                Sustainability
              </a>

              <a
                href="#contact"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#287A25]"
              >
                Contact
              </a>
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
                  placeholder="Search for organic goodness..."
                  className="w-48 md:w-56 lg:w-64 pl-9 pr-3 py-2 rounded-full text-xs bg-white/80 border border-[#172B1C]/15 focus:outline-none focus:border-[#287A25] focus:ring-1 focus:ring-[#287A25] placeholder:text-black/40 text-[#172B1C] transition-all"
                  aria-label="Search for products"
                />
                <Search className="w-3.5 h-3.5 text-[#557C36] absolute left-3 pointer-events-none" />
              </form>

              {/* Account Profile Icon */}
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 text-[#172B1C] transition-colors focus-visible:ring-2 focus-visible:ring-[#287A25]"
                aria-label="Customer Account Information"
                title="Customer Support & Orders"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Wishlist Button with Badge */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-black/5 text-[#172B1C] transition-colors focus-visible:ring-2 focus-visible:ring-[#287A25]"
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
                className="relative p-2 rounded-full hover:bg-black/5 text-[#172B1C] transition-colors focus-visible:ring-2 focus-visible:ring-[#287A25]"
                aria-label={`Shopping Cart with ${cartCount} items`}
                title="Open Shopping Basket"
              >
                <ShoppingBag className="w-4 h-4 text-[#287A25]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#287A25] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-black/5 text-[#172B1C]"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#172B1C]/10 bg-[#F1EDE4] p-5 space-y-4">
            {/* Mobile Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-white border border-[#172B1C]/15 focus:outline-none focus:border-[#287A25]"
              />
              <Search className="w-4 h-4 text-[#557C36] absolute left-3 top-3 pointer-events-none" />
            </form>

            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/food"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#287A25] font-bold border-b border-black/5"
              >
                Food Home
              </Link>
              <Link
                to="/food/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-black/5"
              >
                All Products (Catalog)
              </Link>
              <div className="py-2 text-xs font-mono text-[#557C36] uppercase tracking-wider">
                Categories
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {FOOD_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/food/products?category=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded bg-white text-xs font-medium border border-black/5"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-mono text-[#557C36]"
              >
                &larr; Switch to Sarees or Jewellery (Gatekeeper)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Account Info Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#F1EDE4] text-[#172B1C] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#172B1C]/15 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#172B1C]/10">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#287A25]" />
                <h3 className="font-serif font-medium text-base">Amoga Customer Care</h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#405244] leading-relaxed">
              Customer accounts and authentication are reserved for Phase 4. For direct assistance, phone orders, and enquiry tracking:
            </p>
            <div className="p-3 rounded-lg bg-[#E5DFD3]/70 space-y-1 text-xs font-mono text-[#172B1C]">
              <div>Phone: +91 9940018593</div>
              <div>Direct: +91 8056700646</div>
              <div>Brand: Amoga Pure Gourmet</div>
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#287A25] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#1E5C1B]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
