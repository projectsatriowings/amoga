import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Heart, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { CollectionLayout } from './components/CollectionLayout';
import { Container } from '../../components/ui/Container';
import { BackButton } from '../../components/ui/BackButton';
import { useStore } from '../../store/useStore';
import { formatINR } from '../../utils/pricing';

export function DynamicStorefront() {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlistItem, isInWishlist } = useStore();

  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadCollectionData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch collection details
        const colRes = await fetch('/api/collections');
        const colJson = await colRes.json();
        const matched = (colJson.data || []).find(
          (c) => c.slug === collectionSlug || c.id === collectionSlug
        );

        if (!matched) {
          throw new Error(`Collection '/${collectionSlug}' not found.`);
        }

        if (isMounted) setCollection(matched);

        // 2. Fetch products for this collection
        const prodRes = await fetch(`/api/products?collection=${matched.id}`);
        const prodJson = await prodRes.json();
        if (isMounted) {
          setProducts(prodJson.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (collectionSlug) {
      loadCollectionData();
    }

    return () => {
      isMounted = false;
    };
  }, [collectionSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#7A7167]">Loading collection experience...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-[#E5E0D5] text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="font-serif text-2xl text-[#1A1817]">Collection Not Found</h1>
          <p className="text-xs text-[#7A7167] leading-relaxed">
            The collection you are looking for does not exist or may have been unlisted.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#722F37] text-white rounded-full text-xs font-semibold hover:bg-[#5C242C] transition-colors"
            >
              <span>Return to Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accentColor = collection.accentColor || '#722F37';

  // Extract distinct subcategories
  const distinctCategories = Array.from(
    new Set(products.map((p) => p.categoryName || p.category).filter(Boolean))
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchFilter.trim() ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      (p.categoryName || p.category) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <CollectionLayout collectionId={collection.id}>
      {/* 1. Hero Showcase Section */}
      <section
        className="relative overflow-hidden border-b transition-colors py-16 sm:py-24"
        style={{
          backgroundColor: '#FAF8F5',
          borderColor: '#E5E0D5',
        }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E0D5] text-[11px] font-mono tracking-wider uppercase shadow-2xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span style={{ color: accentColor }} className="font-semibold">
                {collection.name}
              </span>
              <span className="text-[#A8A096]">&bull;</span>
              <span className="text-[#7A7167]">Curated Collection</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1817] tracking-tight leading-tight">
              {collection.tagline || collection.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#5C544C] max-w-xl mx-auto leading-relaxed">
              {collection.description ||
                'Discover Amoga\'s curated catalogue created with timeless dedication to quality, craftsmanship, and verified provenance.'}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <span
                className="text-xs font-mono px-3.5 py-1.5 rounded-full text-white font-semibold shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                {products.length} Registered Offerings
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Subcategory / Filter Navigation Bar */}
      <section className="bg-white border-b border-[#E5E0D5] py-4 sticky top-20 z-30 shadow-2xs">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'text-white shadow-xs font-semibold'
                    : 'bg-[#FAF8F5] text-[#5C544C] hover:bg-[#EFEAE1]'
                }`}
                style={selectedCategory === 'all' ? { backgroundColor: accentColor } : {}}
              >
                All ({products.length})
              </button>

              {distinctCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'text-white shadow-xs font-semibold'
                      : 'bg-[#FAF8F5] text-[#5C544C] hover:bg-[#EFEAE1]'
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: accentColor } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* In-Collection Search Input */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Search in ${collection.name}...`}
                className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded-full text-xs outline-none focus:ring-1"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Products Showcase Grid */}
      <section className="py-12 sm:py-16 bg-[#FAF8F5] min-h-[400px]">
        <Container>
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-3 bg-white p-8 rounded-2xl border border-[#E5E0D5]">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white"
                style={{ backgroundColor: accentColor }}
              >
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-[#1A1817]">
                {products.length === 0 ? 'Offerings Arriving Soon' : 'No Matching Offerings'}
              </h3>
              <p className="text-xs text-[#7A7167] leading-relaxed">
                {products.length === 0
                  ? `New artisanal selections for ${collection.name} are currently being curated by our master atelier.`
                  : 'Try clearing your category filter or search query to view all items.'}
              </p>
              {products.length === 0 && (
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: accentColor }}
                  >
                    <span>Browse All Amoga Universes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const inWishlist = isInWishlist(p.id);
                return (
                  <article
                    key={p.id}
                    className="group bg-white rounded-2xl border border-[#E5E0D5] hover:border-[#D5CEC2] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Product Image Area */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#F0ECE1]">
                      <img
                        src={p.image || '/placeholder-luxury.jpg'}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Wishlist Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlistItem(p);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
                          inWishlist
                            ? 'bg-rose-50 text-rose-600 shadow-sm'
                            : 'bg-white/80 hover:bg-white text-[#4A423B]'
                        }`}
                        aria-label="Toggle Wishlist"
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={inWishlist ? 'currentColor' : 'none'}
                        />
                      </button>

                      {p.badge && (
                        <span
                          className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full text-white shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>

                    {/* Product Details Area */}
                    <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">
                          {p.categoryName || p.category || collection.name}
                        </span>
                        <h3 className="font-serif text-base font-semibold text-[#1A1817] group-hover:text-[#722F37] transition-colors mt-0.5 line-clamp-1">
                          {p.name}
                        </h3>
                        {p.tagline && (
                          <p className="text-[11px] text-[#7A7167] italic line-clamp-1 mt-0.5">
                            {p.tagline}
                          </p>
                        )}
                      </div>

                      {/* Price and Cart Action */}
                      <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-sans text-base font-bold text-[#1A1817] tabular-nums">
                            {p.price ? formatINR(Number(p.price)) : 'Enquire'}
                          </span>
                          {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                            <span className="text-[10px] text-[#A8A096] line-through tabular-nums">
                              {formatINR(Number(p.originalPrice))}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addToCart(p, 1);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </CollectionLayout>
  );
}
