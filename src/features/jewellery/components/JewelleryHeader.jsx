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
import { JEWELLERY_CATEGORIES } from '../data/categories';

export function JewelleryHeader() {
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
      navigate(`/jewellery/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#242326]/95 backdrop-blur-md border-b border-[#B9B8B5]/15 transition-colors text-[#F7F3EB]">
        {/* Top Announcement Bar */}
        <div className="bg-[#1A191C] text-[#B9B8B5] text-[11px] font-medium py-1.5 px-4 text-center tracking-wider border-b border-[#B9B8B5]/10">
          <span>Solid 925 Sterling Silver &bull; Sculpted Minimal Geometry &bull; Complimentary Insured Shipping</span>
          <span className="hidden sm:inline ml-3 text-[#F7F3EB]/60">&bull; Concierge: +91 9940018593</span>
        </div>

        <Container>
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Collection Tag */}
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/jewellery" className="flex items-center gap-3 group">
                <img
                  src={amogaLogo}
                  alt="Amoga Silver Jewellery"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <span className="hidden xl:inline text-xs font-serif italic text-[#B9B8B5] pl-3 border-l border-[#B9B8B5]/20">
                Silver Jewellery &bull; Modern Heirlooms
              </span>
            </div>

            {/* Center: Primary Navigation */}
            <nav
              aria-label="Jewellery Navigation"
              className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs uppercase tracking-wider font-medium text-[#F7F3EB]"
            >
              <Link
                to="/jewellery"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#C6AD82] ${
                  location.pathname === '/jewellery' && !location.search
                    ? 'font-bold text-[#C6AD82] border-b border-[#C6AD82]'
                    : ''
                }`}
              >
                Home
              </Link>

              <Link
                to="/jewellery/products"
                className={`px-3 py-1.5 rounded transition-colors hover:text-[#C6AD82] ${
                  location.pathname === '/jewellery/products' && !location.search
                    ? 'font-bold text-[#C6AD82] border-b border-[#C6AD82]'
                    : ''
                }`}
              >
                All Jewellery
              </Link>

              <Link
                to="/jewellery/products?category=rings"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C6AD82]"
              >
                Rings
              </Link>

              <Link
                to="/jewellery/products?category=necklaces"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C6AD82]"
              >
                Necklaces & Pendants
              </Link>

              <Link
                to="/jewellery/products?category=earrings"
                className="px-3 py-1.5 rounded transition-colors hover:text-[#C6AD82]"
              >
                Earrings
              </Link>

              {/* More Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="px-3 py-1.5 rounded flex items-center gap-1 hover:text-[#C6AD82] transition-colors"
                  aria-expanded={categoriesDropdownOpen}
                >
                  <span>More Pieces</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 p-2 bg-[#343238] border border-[#B9B8B5]/20 rounded-xl shadow-2xl z-50 text-left normal-case space-y-1">
                    {JEWELLERY_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/jewellery/products?category=${cat.id}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#3E3C44] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#F7F3EB]">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-[#B9B8B5]">
                            {cat.badge || `${cat.count} items`}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#B9B8B5]/60">
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
                  placeholder="Search rings, silver..."
                  className="w-44 md:w-52 lg:w-60 pl-9 pr-3 py-2 rounded-full text-xs bg-[#343238]/80 border border-[#B9B8B5]/25 focus:outline-none focus:border-[#C6AD82] focus:ring-1 focus:ring-[#C6AD82] placeholder:text-[#F7F3EB]/40 text-[#F7F3EB] transition-all"
                  aria-label="Search jewellery"
                />
                <Search className="w-3.5 h-3.5 text-[#B9B8B5] absolute left-3 pointer-events-none" />
              </form>

              {/* Account Profile Icon */}
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 text-[#F7F3EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#C6AD82]"
                aria-label="Customer Care"
                title="Customer Care & Silver Sizing Concierge"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Wishlist Button with Badge */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 rounded-full hover:bg-white/10 text-[#F7F3EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#C6AD82]"
                aria-label={`Wishlist with ${wishlistCount} saved items`}
                title="View Saved Jewellery"
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#B9B8B5] text-[#242326] text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button with Count Badge */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-white/10 text-[#F7F3EB] transition-colors focus-visible:ring-2 focus-visible:ring-[#C6AD82]"
                aria-label={`Shopping Bag with ${cartCount} items`}
                title="Open Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-[#B9B8B5]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#B9B8B5] text-[#242326] text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/10 text-[#F7F3EB]"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#B9B8B5]/15 bg-[#343238] p-5 space-y-4">
            {/* Mobile Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jewellery..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-[#242326] border border-[#B9B8B5]/25 focus:outline-none focus:border-[#C6AD82] text-[#F7F3EB]"
              />
              <Search className="w-4 h-4 text-[#B9B8B5] absolute left-3 top-3 pointer-events-none" />
            </form>

            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/jewellery"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#C6AD82] font-bold border-b border-white/5"
              >
                Jewellery Home
              </Link>
              <Link
                to="/jewellery/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-white/5"
              >
                All Jewellery (Catalogue)
              </Link>
              <div className="py-2 text-xs font-mono text-[#B9B8B5] uppercase tracking-wider">
                Categories
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {JEWELLERY_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/jewellery/products?category=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded bg-[#242326] text-xs font-medium border border-[#B9B8B5]/15 text-[#F7F3EB]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-mono text-[#B9B8B5]"
              >
                &larr; Switch Collection (Gatekeeper Hub)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Account Info Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#343238] text-[#F7F3EB] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#B9B8B5]/25 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#B9B8B5]/20">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#B9B8B5]" />
                <h3 className="font-serif font-medium text-base">Amoga Silver Concierge</h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#B9B8B5] leading-relaxed font-sans">
              For ring sizing guidance, customized gifting, and silver care advice:
            </p>
            <div className="p-3 rounded-lg bg-[#242326] space-y-1 text-xs font-mono text-[#F7F3EB] border border-[#B9B8B5]/20">
              <div>Phone: +91 9940018593</div>
              <div>Concierge: +91 8056700646</div>
              <div>Brand: Amoga Silver Jewellery</div>
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#B9B8B5] text-[#242326] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
