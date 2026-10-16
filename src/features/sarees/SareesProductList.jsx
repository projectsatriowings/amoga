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
import { SAREE_PRODUCTS } from './data/products';
import { SAREE_CATEGORIES } from './data/categories';
import { SareeProductCard } from './components/SareeProductCard';

import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';

export function SareesProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API with fallback
  const { products: apiProducts } = useProducts({
    collection: 'sarees',
    fallbackData: SAREE_PRODUCTS,
  });

  // Read URL query parameters
  const currentCategory = searchParams.get('category') || 'all';
  const currentQuery = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'featured';
  const [sortBy, setSortBy] = useState(currentSort);
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [prevQuery, setPrevQuery] = useState(currentQuery);

  // Sync search input & sort with URL query when navigation changes externally
  if (prevQuery !== currentQuery) {
    setPrevQuery(currentQuery);
    setSearchInput(currentQuery);
  }
  React.useEffect(() => {
    setSortBy(searchParams.get('sort') || 'featured');
  }, [searchParams]);

  // Debounced URL sync so typing never causes re-renders or delays
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        nextParams.set('q', searchInput.trim());
      } else {
        nextParams.delete('q');
      }
      setSearchParams(nextParams, { replace: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (categoryId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', categoryId);
    }
    setSearchParams(nextParams);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const nextParams = new URLSearchParams(searchParams);
    if (newSort === 'featured') {
      nextParams.delete('sort');
    } else {
      nextParams.set('sort', newSort);
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
    setSearchParams(nextParams, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
    setSortBy('featured');
  };

  // Filter and sort products reactively based on live searchInput
  const filteredProducts = useMemo(() => {
    let result = [...apiProducts];

    // Category filter
    if (currentCategory && currentCategory !== 'all') {
      result = result.filter((p) => (p.category || '').toLowerCase() === currentCategory.toLowerCase());
    }

    // Search query filter (search by name, tagline, description, and specs)
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tagline && p.tagline.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.specs?.fabric && p.specs.fabric.toLowerCase().includes(q))
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
  }, [apiProducts, currentCategory, searchInput, sortBy]);

  const activeCategoryObj =
    SAREE_CATEGORIES.find((c) => c.id === currentCategory) || SAREE_CATEGORIES[0];

  return (
    <div className="bg-[#2C0E1A] text-[#F6EBD8] min-h-screen pt-2 sm:pt-3 pb-12">
      <Container>
        {/* Breadcrumb Navigation & Theme-Colored Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <BackButton
            collection="sarees"
            fallbackTo="/sarees"
            label="Back to Sarees"
          />

          <nav
            aria-label="Catalogue Breadcrumb"
            className="flex items-center gap-2 text-xs font-mono text-[#C5A46D]"
          >
            <Link to="/" className="hover:underline flex items-center gap-1 text-[#D4C2A7]">
              <Home className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <span>/</span>
            <Link to="/sarees" className="hover:underline text-[#D4C2A7]">
              Heritage Sarees
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#F6EBD8]">Catalogue</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authentic Handloom Archive</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F6EBD8]">
              {activeCategoryObj.name}
            </h1>
            <span className="text-xs font-mono text-[#C5A46D] px-3 py-1 rounded bg-[#381222] border border-[#C5A46D]/20 self-start sm:self-auto">
              Showing {filteredProducts.length} of {apiProducts.length} Sarees
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#D4C2A7] max-w-2xl font-sans">
            {activeCategoryObj.tagline ||
              'Discover beautiful sarees with traditional designs, authentic zari work, and fine craftsmanship.'}
          </p>
        </div>

        {/* Filter and Search Bar Controls */}
        <div className="mb-8 p-4 rounded-xl bg-[#381222]/90 border border-[#C5A46D]/25 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by saree name, fabric, or design..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg text-xs bg-[#2C0E1A] border border-[#C5A46D]/30 focus:outline-none focus:border-[#C5A46D] text-[#F6EBD8] placeholder:text-[#F6EBD8]/40"
              />
              <Search className="w-4 h-4 text-[#C5A46D] absolute left-3 top-3 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('q');
                    setSearchParams(nextParams, { replace: true });
                  }}
                  className="absolute right-2.5 top-2.5 text-[#F6EBD8]/50 hover:text-[#F6EBD8]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#C5A46D] shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="py-2 px-3 rounded-lg text-xs bg-[#2C0E1A] border border-[#C5A46D]/30 text-[#F6EBD8] focus:outline-none focus:border-[#C5A46D]"
                aria-label="Sort products"
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#C5A46D]/15 scrollbar-thin">
            <span className="text-xs font-mono text-[#C5A46D] flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>

            {SAREE_CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#C5A46D] text-[#2C0E1A] font-semibold'
                      : 'bg-[#2C0E1A] text-[#F6EBD8] hover:bg-[#451523] border border-[#C5A46D]/20'
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
                className="px-2.5 py-1.5 rounded-lg text-xs text-[#C5A46D] hover:text-white hover:bg-white/10 shrink-0 ml-auto flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 rounded-2xl bg-[#381222]/50 border border-[#C5A46D]/20 text-center space-y-4 max-w-lg mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-[#451523] flex items-center justify-center mx-auto text-[#C5A46D]">
              <ShoppingBag className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl text-[#F6EBD8]">
                No Sarees Match Your Search
              </h3>
              <p className="text-xs text-[#D4C2A7]">
                We couldn't find any sarees matching &ldquo;{currentQuery}&rdquo; in the selected category.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] text-xs font-medium uppercase tracking-wider hover:bg-[#d9bb85] transition-colors"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <SareeProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
