import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';
import { useStore } from '../../../store/useStore';
import { Container } from '../../../components/ui/Container';

export function TeaHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, wishlist, openCart, openWishlist } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.items.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tea/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF1BB]/95 backdrop-blur-md border-b border-[#B88E38]/25 transition-colors">
        {/* Top Announcement Bar */}
        <div className="bg-[#B88E38] text-[#2C1E11] text-[11px] font-medium py-1.5 px-4 text-center tracking-wider">
          <span className="font-semibold">Let's Make Tea Healthy</span> &bull; Whole Sun-Dried Blossoms, Bark & Herbs
          <span className="hidden sm:inline ml-3 opacity-90">&bull; Direct Orders: +91 9940018593 / +91 8056700646</span>
        </div>

        <Container>
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Tagline */}
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/tea" className="flex items-center gap-3 group">
                <img
                  src={amogaLogo}
                  alt="Amoga Tea"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <div className="hidden xl:flex flex-col pl-3 border-l border-[#8C6320]/20">
                <span className="text-xs font-serif italic text-[#8C6320]">
                  Artisanal Botanical Infusions
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#543B25]/80">
                  Herbal Tea Collection
                </span>
              </div>
            </div>

            {/* Center: Search & Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-wider font-medium text-[#2C1E11]">
              <Link
                to="/tea"
                className={`transition-colors hover:text-[#8C6320] ${
                  location.pathname === '/tea'
                    ? 'text-[#8C6320] font-bold underline decoration-2 underline-offset-8'
                    : 'opacity-80'
                }`}
              >
                Overview
              </Link>
              <Link
                to="/tea/products"
                className={`transition-colors hover:text-[#8C6320] ${
                  location.pathname === '/tea/products'
                    ? 'text-[#8C6320] font-bold underline decoration-2 underline-offset-8'
                    : 'opacity-80'
                }`}
              >
                All 5 Brews
              </Link>
              <Link
                to="/"
                className="opacity-70 hover:opacity-100 hover:text-[#8C6320] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Gatekeeper</span>
              </Link>
            </nav>

            {/* Search Input */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex relative items-center w-56 lg:w-64"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hibiscus, cinnamon..."
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-[#FDF9E7] border border-[#B88E38]/30 focus:border-[#B88E38] focus:bg-white focus:outline-none text-[#2C1E11] placeholder:text-[#7D5C3F]/60 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3 pointer-events-none" />
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2.5 rounded-full hover:bg-black/5 text-[#2C1E11] transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E38]"
                aria-label={`Wishlist (${wishlistCount} items)`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8C6320] text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 rounded-full bg-[#B88E38]/15 hover:bg-[#B88E38]/25 text-[#2C1E11] transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E38] border border-[#B88E38]/30"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-full hover:bg-black/5 text-[#2C1E11]"
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#B88E38]/20 bg-[#FAF1BB] px-6 py-5 space-y-4 shadow-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search herbal teas..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#FDF9E7] border border-[#B88E38]/30 text-[#2C1E11]"
              />
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3 top-2.5" />
            </form>

            <div className="space-y-2 pt-2 text-sm font-medium uppercase tracking-wider text-[#2C1E11]">
              <Link
                to="/tea"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-[#B88E38]/10"
              >
                Tea Collection Overview
              </Link>
              <Link
                to="/tea/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-[#B88E38]/10"
              >
                All 5 Botanical Brews
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#8C6320] font-semibold"
              >
                &larr; Switch Collection (Gatekeeper Hub)
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
