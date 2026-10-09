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
import { SAREE_CATEGORIES } from '../data/categories';

export function SareeHeader() {
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
      navigate(`/sarees/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#2C0E1A]/95 backdrop-blur-md border-b border-[#C5A46D]/20 transition-colors text-[#F6EBD8]">
        {/* Top Announcement Bar */}
        <div className="bg-[#451523] text-[#C5A46D] text-[11px] font-medium py-1.5 px-4 text-center tracking-wider border-b border-[#C5A46D]/15">
          <span>Heritage Handlooms &bull; Authentic Silkmark Silks &bull; Master Loom Craftsmanship</span>
          <span className="hidden sm:inline ml-3 text-[#F6EBD8]/70">&bull; Concierge: +91 9940018593</span>
        </div>

        <Container>
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Collection Tag */}
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/sarees" className="flex items-center gap-3 group">
                <img
                  src={amogaLogo}
                  alt="Amoga Heritage Sarees"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <span className="hidden xl:inline text-xs font-serif italic text-[#C5A46D] pl-3 border-l border-[#C5A46D]/25">
                Heritage Sarees &bull; Timeless Weaves
              </span>
            </div>

            {/* Center: Primary Navigation */}
            <nav
              aria-label="Saree Navigation"
              className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs uppercase tracking-wider font-medium text-[#F6EBD8]"
            >
              <Link
                to="/sarees"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#C5A46D] ${
                  location.pathname === '/sarees' && !location.search
                    ? 'font-bold text-[#C5A46D] border-b border-[#C5A46D]'
                    : ''
                }`}
              >
                Home
              </Link>

              <Link
                to="/sarees/products"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#C5A46D] ${
                  location.pathname === '/sarees/products' && !location.search
                    ? 'font-bold text-[#C5A46D] border-b border-[#C5A46D]'
                    : ''
                }`}
              >
                All Sarees
              </Link>

              <Link
                to="/sarees/products?category=silk"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C5A46D]"
              >
                Silk Sarees
              </Link>

              <Link
                to="/sarees/products?category=traditional"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C5A46D]"
              >
                Traditional Collections
              </Link>

              <Link
                to="/sarees/products?category=festive"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C5A46D]"
              >
                Festive Collection
              </Link>

              {/* Collections Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="px-3 py-1.5 rounded flex items-center gap-1 hover:text-[#C5A46D] transition-colors"
                  aria-expanded={categoriesDropdownOpen}
                >
                  <span>More Weaves</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 p-2 bg-[#381222] border border-[#C5A46D]/30 rounded-xl shadow-2xl z-50 text-left normal-case space-y-1">
                    {SAREE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/sarees/products?category=${cat.id}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#451523] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#F6EBD8]">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-[#C5A46D]">
                            {cat.badge || `${cat.count} items`}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#C5A46D]/60">
                          {cat.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
                  placeholder="Search silk weaves, zari..."
                  className="w-44 md:w-52 lg:w-60 pl-9 pr-3 py-2 rounded-full text-xs bg-[#381222]/80 border border-[#C5A46D]/30 focus:outline-none focus:border-[#C5A46D] focus:ring-1 focus:ring-[#C5A46D] placeholder:text-[#F6EBD8]/40 text-[#F6EBD8] transition-all"
                  aria-label="Search sarees"
                />
                <Search className="w-3.5 h-3.5 text-[#C5A46D] absolute left-3 pointer-events-none" />
              </form>

              {/* Account Profile Icon */}
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 text-[#F6EBD8] transition-colors focus-visible:ring-2 focus-visible:ring-[#C5A46D]"
                aria-label="Customer Concierge"
                title="Customer Care & Bridal Concierge"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Wishlist Button with Badge */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-white/10 text-[#F6EBD8] transition-colors focus-visible:ring-2 focus-visible:ring-[#C5A46D]"
                aria-label={`Wishlist with ${wishlistCount} saved sarees`}
                title="View Saved Sarees"
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#C5A46D] text-[#2C0E1A] text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button with Count Badge */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-white/10 text-[#F6EBD8] transition-colors focus-visible:ring-2 focus-visible:ring-[#C5A46D]"
                aria-label={`Shopping Bag with ${cartCount} items`}
                title="Open Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A46D]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#C5A46D] text-[#2C0E1A] text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/10 text-[#F6EBD8]"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#C5A46D]/20 bg-[#381222] p-5 space-y-4">
            {/* Mobile Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search silk weaves..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-[#2C0E1A] border border-[#C5A46D]/30 focus:outline-none focus:border-[#C5A46D] text-[#F6EBD8]"
              />
              <Search className="w-4 h-4 text-[#C5A46D] absolute left-3 top-3 pointer-events-none" />
            </form>

            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/sarees"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#C5A46D] font-bold border-b border-white/5"
              >
                Sarees Home
              </Link>
              <Link
                to="/sarees/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-white/5"
              >
                All Sarees (Catalogue)
              </Link>
              <div className="py-2 text-xs font-mono text-[#C5A46D] uppercase tracking-wider">
                Weave Collections
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {SAREE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/sarees/products?category=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded bg-[#451523] text-xs font-medium border border-[#C5A46D]/20 text-[#F6EBD8]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-mono text-[#C5A46D]"
              >
                &larr; Switch Collection (Gatekeeper Hub)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Account Info Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#381222] text-[#F6EBD8] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#C5A46D]/30 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#C5A46D]/20">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#C5A46D]" />
                <h3 className="font-serif font-medium text-base">Amoga Silk Concierge</h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#D4C2A7] leading-relaxed">
              For bespoke bridal drapes, custom color orders, and video shopping consultations:
            </p>
            <div className="p-3 rounded-lg bg-[#451523] space-y-1 text-xs font-mono text-[#F6EBD8] border border-[#C5A46D]/20">
              <div>Phone: +91 9940018593</div>
              <div>Bespoke: +91 8056700646</div>
              <div>Brand: Amoga Heritage Sarees</div>
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#C5A46D] text-[#2C0E1A] text-xs font-medium uppercase tracking-wider hover:bg-[#d9bb85] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
