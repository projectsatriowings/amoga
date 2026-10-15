import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, Leaf, SlidersHorizontal, PackageSearch, Sparkles } from 'lucide-react';
import { TEA_PRODUCTS } from './data/products';
import { TeaProductCard } from './components/TeaProductCard';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';

import { Container } from '../../components/ui/Container';
import { useProducts } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';

export function TeaProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend API with fallback to verified catalogue
  const { products: apiProducts } = useProducts({
    collection: 'tea',
    fallbackData: TEA_PRODUCTS,
  });

  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'featured';
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(initialSort);

  // Sync searchQuery and sortBy when searchParams change externally
  React.useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== searchQuery.trim() && !searchQuery.startsWith(urlQ)) {
      setSearchQuery(urlQ);
    }
    const urlSort = searchParams.get('sort') || 'featured';
    setSortBy(urlSort);
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

  const handleSearchChange = (val) => {
    setSearchQuery(val);
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

  const clearAllFilters = () => {
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({}, { replace: true });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const rawList = apiProducts && apiProducts.length > 0 ? apiProducts : TEA_PRODUCTS;
    const list = rawList.map((p) => {
      const fallback = TEA_PRODUCTS.find((f) => f.slug === p.slug || f.id === p.id);
      return fallback ? { ...fallback, ...p } : p;
    });

    let result = list.filter((p) => {
      // Category Filter
      if (selectedCategory && selectedCategory !== 'all') {
        const cat = selectedCategory.toLowerCase();
        const isCatMatch =
          (cat === 'flower' && (p.slug.includes('pea') || p.slug.includes('hibiscus') || p.categoryName?.toLowerCase().includes('flower'))) ||
          (cat === 'leaf' && (p.slug.includes('moringa') || p.categoryName?.toLowerCase().includes('leaf'))) ||
          (cat === 'herbal' && (p.slug.includes('cinnamon') || p.slug.includes('sarsaparilla') || p.categoryName?.toLowerCase().includes('root') || p.categoryName?.toLowerCase().includes('spice')));
        if (!isCatMatch) return false;
      }

      // Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.botanicalName?.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'name-asc' || sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc' || sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc' || sortBy === 'price_asc') {
      result.sort((a, b) => {
        if (a.price === null || a.price === undefined) return 1;
        if (b.price === null || b.price === undefined) return -1;
        return a.price - b.price;
      });
    } else if (sortBy === 'price-desc' || sortBy === 'price_desc') {
      result.sort((a, b) => {
        if (a.price === null || a.price === undefined) return 1;
        if (b.price === null || b.price === undefined) return -1;
        return b.price - a.price;
      });
    }

    return result;
  }, [apiProducts, selectedCategory, searchQuery, sortBy]);


  return (
    <div className="relative bg-[#FAF1BB] text-[#2C1E11] min-h-screen pt-2 sm:pt-3 pb-12 overflow-hidden">
      {/* Decorative Botanical Side Animations */}
      <BotanicalSideAnimations />

      <Container className="relative z-10">
        {/* Breadcrumb / Collection Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <BackButton
            collection="tea"
            fallbackTo="/tea"
            label="Back to Wellness Tea"
          />

          <span className="text-xs font-mono text-[#2C1E11] bg-[#FFFDF5]/75 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#B88E38]/30 shadow-xs">
            {filteredProducts.length} Botanical {filteredProducts.length === 1 ? 'Variety' : 'Varieties'} Available
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#8C6320]">
            <Sparkles className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>BOTANICAL WELLNESS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1E11]">
            Botanical Teas & Herbal Infusions
          </h1>
          <p className="text-xs sm:text-sm text-[#543B25] leading-relaxed font-sans">
            Explore our selection of botanical teas and herbal infusions, bringing distinctive ingredients and comforting tea rituals to your everyday routine.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#B88E38]/30 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search botanical teas, petals, or herbal infusions..."
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-[#FFFDF5] border border-[#B88E38]/30 focus:border-[#8C6320] focus:bg-white focus:outline-none text-[#2C1E11] transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#8C6320] absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-2.5 text-black/40 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-[#543B25] font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="py-1.5 px-3 rounded-lg text-xs font-mono font-medium bg-[#FFFDF5] border border-[#B88E38]/30 focus:border-[#8C6320] text-[#2C1E11] focus:outline-none shadow-sm cursor-pointer"
                aria-label="Sort botanical teas"
              >
                <option value="featured">Featured Rituals</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#FFFDF5] border border-[#B88E38]/30 rounded-3xl p-8 max-w-xl mx-auto shadow-sm space-y-4">
            <PackageSearch className="w-12 h-12 text-[#8C6320] mx-auto opacity-60" />
            <h2 className="text-xl font-serif text-[#2C1E11]">
              No Botanical Varieties Found
            </h2>
            <p className="text-xs text-[#543B25] leading-relaxed max-w-sm mx-auto">
              We couldn't find any teas matching "{searchQuery}". Try searching for hibiscus, blue pea, or cinnamon.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-mono uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shadow-sm"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <TeaProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
