import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, SlidersHorizontal, PackageSearch, Sparkles } from 'lucide-react';
import { FoodProductCard } from './components/FoodProductCard';

import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';

const APPROVED_PANTRY_CATEGORIES = [
  { id: 'all', label: 'All Mixes' },
  { id: 'soups', label: 'Soup Mixes' },
  { id: 'millets', label: 'Millet Mixes' },
  { id: 'podis', label: 'Rice Podis' },
];

export function FoodProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API
  const { products: apiProducts, isLoading, error } = useProducts({
    collection: 'food',
  });

  // URL state synchronization
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const initialSort = searchParams.get('sort') || 'featured';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(initialSort);

  // Synchronize internal state with URL search params when navigated externally
  React.useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSortBy(searchParams.get('sort') || 'featured');
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== searchQuery.trim() && !searchQuery.startsWith(urlQ)) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  // Debounced URL sync so typing is completely smooth and does not overwrite spaces
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (!searchQuery.trim()) {
        newParams.delete('q');
      } else {
        newParams.set('q', searchQuery.trim());
      }
      setSearchParams(newParams, { replace: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL parameters when category changes
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    if (newSort === 'featured') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', newSort);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({}, { replace: true });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return (apiProducts || [])
      .filter((product) => {
        // Category Match
        const matchesCategory =
          selectedCategory === 'all' || (product.category || '').toLowerCase() === selectedCategory.toLowerCase();

        // Search Query Match (case insensitive across name, description, tags)
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(query)) ||
          (product.description && product.description.toLowerCase().includes(query));

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'price-asc') {
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return a.price - b.price;
        }
        if (sortBy === 'price-desc') {
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return b.price - a.price;
        }
        return 0; // Default featured order
      });
  }, [apiProducts, selectedCategory, searchQuery, sortBy]);

  const activeCategoryTitle =
    APPROVED_PANTRY_CATEGORIES.find((c) => c.id === selectedCategory)?.label ||
    'Traditional Blends & Mixes';

  return (
    <div className="bg-[#F8F6F0] text-[#292820] min-h-screen pt-2 sm:pt-3 pb-12">
      <Container>
        {/* Breadcrumb Navigation & Theme-Colored Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackButton
            collection="food"
            fallbackTo="/food"
            label="Back to Pantry"
          />

          <nav
            aria-label="Breadcrumbs"
            className="flex items-center gap-2 text-xs font-mono text-[#746F63]"
          >
            <Link to="/" className="hover:text-[#173B2A] flex items-center gap-1">
              Amoga Portal
            </Link>
            <span>/</span>
            <Link to="/food" className="hover:text-[#173B2A]">
              Wholesome Pantry
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#173B2A]">
              {activeCategoryTitle}
            </span>
          </nav>
        </div>

        {/* Inner-Page Header */}
        <div className="mb-8 sm:mb-12 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-[#3F7B43] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WHOLESOME PANTRY &bull; {filteredProducts.length} ITEMS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#173B2A]">
            Traditional Blends & Mixes
          </h1>
          <p className="text-xs sm:text-sm text-[#292820]/80 leading-relaxed font-sans">
            Explore a thoughtful selection of soup mixes, millet mixes and traditional rice podis, bringing convenience and familiar flavours to everyday meals.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search soup mixes, millets, or rice podis..."
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-[#F8F6F0] border border-[#E5E0D5] focus:border-[#173B2A] focus:bg-white focus:outline-none text-[#292820] transition-all shadow-inner"
                aria-label="Filter products by search term"
              />
              <Search className="w-4 h-4 text-[#746F63] absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-2.5 text-black/40 hover:text-black"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-[#746F63] font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="py-1.5 px-3 rounded-lg text-xs font-mono font-medium bg-[#F8F6F0] border border-[#E5E0D5] focus:border-[#173B2A] text-[#292820] focus:outline-none shadow-2xs cursor-pointer"
                aria-label="Sort product catalogue"
              >
                <option value="featured">Featured Order</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* 3 Categories Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {APPROVED_PANTRY_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#173B2A] text-white shadow-xs font-semibold'
                      : 'bg-[#F8F6F0] border border-[#E5E0D5] text-[#292820] hover:bg-[#FFFFFF] hover:text-[#173B2A]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#FFFFFF] border border-[#E5E0D5] rounded-3xl p-8 max-w-xl mx-auto shadow-2xs space-y-4">
            <PackageSearch className="w-12 h-12 text-[#746F63] mx-auto opacity-60" />
            <h2 className="text-xl font-serif text-[#173B2A]">
              {searchQuery || selectedCategory !== 'all' ? 'No Products Found' : 'No Pantry Products Currently Available'}
            </h2>
            <p className="text-xs text-[#746F63] leading-relaxed max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? "We couldn't find any blends matching your search or selected category in the Wholesome Pantry collection."
                : 'Our traditional pantry blends and mixes are currently being curated for the upcoming season.'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#173B2A] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#3F7B43] transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FoodProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
