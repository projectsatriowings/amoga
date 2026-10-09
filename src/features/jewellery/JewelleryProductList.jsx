import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  Home,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { JEWELLERY_PRODUCTS } from './data/products';
import { JEWELLERY_CATEGORIES } from './data/categories';
import { JewelleryProductCard } from './components/JewelleryProductCard';
import { CartDrawer } from '../food/components/CartDrawer';
import { WishlistDrawer } from '../food/components/WishlistDrawer';
import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';

export function JewelleryProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API with fallback
  const { products: apiProducts } = useProducts({
    collection: 'jewellery',
    fallbackData: JEWELLERY_PRODUCTS,
  });

  // Read URL query parameters
  const currentCategory = searchParams.get('category') || 'all';
  const currentQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState('featured');
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [prevQuery, setPrevQuery] = useState(currentQuery);

  // Sync search input with URL query without useEffect cascading render
  if (prevQuery !== currentQuery) {
    setPrevQuery(currentQuery);
    setSearchInput(currentQuery);
  }

  const handleCategoryChange = (categoryId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', categoryId);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('q', searchInput.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
    setSortBy('featured');
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...apiProducts];

    // Category filter
    if (currentCategory && currentCategory !== 'all') {
      result = result.filter((p) => p.category === currentCategory);
    }

    // Search query filter (search by name, tagline, description, specs)
    if (currentQuery.trim()) {
      const q = currentQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tagline && p.tagline.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.specs?.material && p.specs.material.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc') {
      // Sort priced items first in ascending order, then unpriced items
      result.sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
    } else if (sortBy === 'price-desc') {
      // Sort priced items first in descending order, then unpriced items
      result.sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;
      });
    } else {
      // 'featured': verified and featured items first
      result.sort((a, b) => {
        if (a.isFeatured === b.isFeatured) return 0;
        return a.isFeatured ? -1 : 1;
      });
    }

    return result;
  }, [apiProducts, currentCategory, currentQuery, sortBy]);

  const activeCategoryObj =
    JEWELLERY_CATEGORIES.find((c) => c.id === currentCategory) || JEWELLERY_CATEGORIES[0];

  return (
    <div className="bg-[#242326] text-[#F7F3EB] min-h-screen py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Catalogue Breadcrumb"
          className="flex items-center gap-2 text-xs font-mono mb-8 text-[#B9B8B5]"
        >
          <Link to="/" className="hover:underline flex items-center gap-1 text-[#B9B8B5]/80">
            <Home className="w-3.5 h-3.5" />
            <span>Portal</span>
          </Link>
          <span>/</span>
          <Link to="/jewellery" className="hover:underline text-[#B9B8B5]/80">
            Silver Jewellery
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#F7F3EB]">Catalogue</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
            <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
            <span>Solid Sterling Silver Archive</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F7F3EB]">
              {activeCategoryObj.name}
            </h1>
            <span className="text-xs font-mono text-[#B9B8B5] px-3 py-1 rounded bg-[#343238] border border-[#B9B8B5]/20 self-start sm:self-auto">
              Showing {filteredProducts.length} of {JEWELLERY_PRODUCTS.length} Pieces
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#B9B8B5] max-w-2xl font-sans">
            {activeCategoryObj.tagline ||
              'Explore our curated collection of verified sterling silver rings, necklaces, and modern heirlooms.'}
          </p>
        </div>

        {/* Filter and Search Bar Controls */}
        <div className="mb-8 p-4 rounded-xl bg-[#343238]/80 border border-[#B9B8B5]/20 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by piece name, stone, or style..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg text-xs bg-[#242326] border border-[#B9B8B5]/25 focus:outline-none focus:border-[#C6AD82] text-[#F7F3EB] placeholder:text-[#F7F3EB]/40"
              />
              <Search className="w-4 h-4 text-[#B9B8B5] absolute left-3 top-3 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('q');
                    setSearchParams(nextParams);
                  }}
                  className="absolute right-2.5 top-2.5 text-[#F7F3EB]/50 hover:text-[#F7F3EB]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#B9B8B5] shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 px-3 rounded-lg text-xs bg-[#242326] border border-[#B9B8B5]/25 text-[#F7F3EB] focus:outline-none focus:border-[#C6AD82]"
                aria-label="Sort pieces"
              >
                <option value="featured">Curated & Featured</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="price-asc">Price: Low to High (Verified)</option>
                <option value="price-desc">Price: High to Low (Verified)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#B9B8B5]/15 scrollbar-thin">
            <span className="text-xs font-mono text-[#B9B8B5] flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>

            {JEWELLERY_CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#B9B8B5] text-[#242326] font-semibold'
                      : 'bg-[#242326] text-[#F7F3EB] hover:bg-[#3E3C44] border border-[#B9B8B5]/15'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {(currentCategory !== 'all' || currentQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs text-[#B9B8B5] hover:text-white hover:bg-white/10 shrink-0 ml-auto flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 rounded-2xl bg-[#343238]/50 border border-[#B9B8B5]/20 text-center space-y-4 max-w-lg mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-[#242326] flex items-center justify-center mx-auto text-[#B9B8B5]">
              <ShoppingBag className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl text-[#F7F3EB]">
                No Jewellery Found
              </h3>
              <p className="text-xs text-[#B9B8B5]">
                We couldn't find any pieces matching &ldquo;{currentQuery}&rdquo; in the selected category.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-xl bg-[#B9B8B5] text-[#242326] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredProducts.map((product) => (
              <JewelleryProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>

      {/* Shopping Drawers */}
      <CartDrawer />
      <WishlistDrawer />
    </div>
  );
}
