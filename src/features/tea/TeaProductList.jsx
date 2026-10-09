import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, Leaf, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { TEA_PRODUCTS } from './data/products';
import { TeaProductCard } from './components/TeaProductCard';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';
import { CartDrawer } from '../food/components/CartDrawer';
import { WishlistDrawer } from '../food/components/WishlistDrawer';
import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';

export function TeaProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API with fallback to verified catalogue
  const { products: apiProducts } = useProducts({
    collection: 'tea',
    fallbackData: TEA_PRODUCTS,
  });

  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('featured');

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete('q');
    } else {
      newParams.set('q', val.trim());
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const list = apiProducts && apiProducts.length > 0 ? apiProducts : TEA_PRODUCTS;

    let result = list.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.standeeNotes?.toLowerCase().includes(q) ||
        p.botanicalName?.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [apiProducts, searchQuery, sortBy]);

  return (
    <div className="relative bg-[#FAF1BB] text-[#2C1E11] min-h-screen py-8 sm:py-12 overflow-hidden">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* Decorative Botanical Side Animations */}
      <BotanicalSideAnimations />

      <Container className="relative z-10">
        {/* Breadcrumb / Collection Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tea"
            className="inline-flex items-center gap-1.5 text-xs text-[#8C6320] hover:text-[#2C1E11] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tea Collection Overview</span>
          </Link>

          <span className="text-xs font-mono text-[#8C6320] bg-white/60 px-3 py-1 rounded-full border border-[#B88E38]/20">
            {filteredProducts.length} Botanical {filteredProducts.length === 1 ? 'Brew' : 'Brews'} Available
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#8C6320]">
            <Leaf className="w-3.5 h-3.5 text-[#B88E38]" />
            <span>Dedicated Amoga Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1E11]">
            Artisanal Botanical Teas
          </h1>
          <p className="text-xs sm:text-sm text-[#543B25] max-w-2xl leading-relaxed">
            The five authenticated herbal varieties from the Amoga Herbal Tea Standee Reference: whole Hibiscus flowers, Butterfly Blue Pea, Ceylon Cinnamon, wild Sarsaparilla, and Moringa blossoms.
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-[#FDF9E7] border border-[#B88E38]/25 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search hibiscus, blue pea, cinnamon, nannari..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs bg-white border border-[#B88E38]/30 focus:border-[#B88E38] focus:outline-none text-[#2C1E11] placeholder:text-[#7D5C3F]/60 transition-all shadow-inner"
                aria-label="Filter herbal teas by keyword"
              />
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-3 text-[#7D5C3F] hover:text-[#2C1E11]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-[#543B25]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C6320]" />
                <span className="hidden sm:inline">Sort:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white border border-[#B88E38]/30 text-[#2C1E11] focus:border-[#B88E38] focus:outline-none font-medium cursor-pointer"
                aria-label="Sort teas"
              >
                <option value="featured">Featured Standee Order</option>
                <option value="name_asc">Alphabetical (A &rarr; Z)</option>
                <option value="name_desc">Alphabetical (Z &rarr; A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => (
              <TeaProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#FDF9E7] rounded-3xl border border-[#B88E38]/25 space-y-4">
            <PackageSearch className="w-12 h-12 text-[#8C6320] mx-auto opacity-70" />
            <h3 className="text-xl font-serif text-[#2C1E11]">No Botanical Teas Match Your Search</h3>
            <p className="text-xs text-[#543B25] max-w-md mx-auto">
              We couldn't find any tea matching <code className="font-mono text-[#8C6320]">"{searchQuery}"</code>.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-5 py-2.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-medium uppercase tracking-wider hover:bg-[#8C6320] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
