import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { FOOD_PRODUCTS } from './data/products';
import { FOOD_CATEGORIES, getCategoryById } from './data/categories';
import { FoodProductCard } from './components/FoodProductCard';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';

export function FoodProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API with fallback
  const { products: apiProducts } = useProducts({
    collection: 'food',
    fallbackData: FOOD_PRODUCTS,
  });

  // URL state synchronization
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('featured');

  // Update URL parameters when filters change
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
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return apiProducts.filter((product) => {
      // Category Match
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      // Search Query Match (case insensitive across name, description, tags)
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.categoryName.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.catalogueTheme && product.catalogueTheme.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    }).sort((a, b) => {
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

  const activeCategoryMeta = getCategoryById(selectedCategory) || FOOD_CATEGORIES[0];

  return (
    <div className="bg-[#F1EDE4] text-[#172B1C] min-h-screen py-8 sm:py-12">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      <Container>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 text-xs font-mono text-[#557C36] mb-6"
        >
          <Link to="/" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Amoga Portal
          </Link>
          <span>/</span>
          <Link to="/food" className="hover:underline">
            Gourmet Food
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#172B1C]">
            {activeCategoryMeta.name}
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 sm:mb-12 max-w-3xl space-y-3">
          <div className="text-xs uppercase font-mono tracking-widest text-[#287A25] font-semibold">
            Product Catalogue &bull; {filteredProducts.length} Items
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#172B1C]">
            {activeCategoryMeta.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#405244] leading-relaxed">
            {activeCategoryMeta.description}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#172B1C]/10 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search soups, millets, podis, spices..."
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-[#F8F5EE] border border-[#172B1C]/15 focus:border-[#287A25] focus:bg-white focus:outline-none text-[#172B1C] transition-all shadow-inner"
                aria-label="Filter products by search term"
              />
              <Search className="w-4 h-4 text-[#557C36] absolute left-3 top-2.5 pointer-events-none" />
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
              <div className="flex items-center gap-1.5 text-xs text-[#557C36]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[#F8F5EE] border border-[#172B1C]/15 focus:border-[#287A25] text-[#172B1C] focus:outline-none shadow-sm"
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

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {FOOD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#287A25] text-white shadow-sm font-semibold'
                      : 'bg-[#E8E2D7] text-[#172B1C] hover:bg-[#DFD8CC]'
                  }`}
                >
                  {cat.shortName || cat.name}
                  <span className="ml-1.5 opacity-60 text-[10px] font-mono">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary Strip (if filtered) */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <div className="mb-6 flex items-center justify-between text-xs text-[#557C36] p-2.5 rounded-lg bg-[#E5DFD3]/70 border border-[#172B1C]/10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#172B1C]">Active Filter:</span>
              {selectedCategory !== 'all' && (
                <span className="bg-white px-2 py-0.5 rounded border border-black/10">
                  Category: {activeCategoryMeta.name}
                </span>
              )}
              {searchQuery && (
                <span className="bg-white px-2 py-0.5 rounded border border-black/10">
                  Query: "{searchQuery}"
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[#287A25] font-semibold underline hover:text-[#1E5C1B]"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-white border border-[#172B1C]/10 max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#E5DFD3] text-[#287A25] flex items-center justify-center mx-auto">
              <PackageSearch className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-medium text-[#172B1C]">
                No matching gourmet products
              </h3>
              <p className="text-xs text-[#405244]">
                We couldn't find any items matching your selected criteria. Try adjusting your search query or view all products.
              </p>
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-lg bg-[#287A25] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#1E5C1B]"
            >
              Reset Filters
            </button>
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
