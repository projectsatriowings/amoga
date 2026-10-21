import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FoodHero } from './components/FoodHero';
import { FoodBenefitsStrip } from './components/FoodBenefitsStrip';
import { FoodCategoryGrid } from './components/FoodCategoryGrid';
import { FoodProductCard } from './components/FoodProductCard';
import { SoupCollectionSection } from './components/SoupCollectionSection';
import { FoodPromoBanner } from './components/FoodPromoBanner';
import { Container } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useProducts } from '../../hooks/useProducts';
import { ExploreCollectionsSection } from '../collections';
import { Sparkles } from 'lucide-react';

export function FoodStorefront() {
  const { products: apiProducts, isLoading } = useProducts({
    collection: 'food',
  });
  const [activeTab, setActiveTab] = useState('all');

  const featuredProducts = React.useMemo(() => {
    const list = apiProducts || [];
    const featured = list.filter((p) => p.isFeatured || p.featured);
    return featured.length > 0 ? featured : list.slice(0, 8);
  }, [apiProducts]);

  const filteredFeatured =
    activeTab === 'all'
      ? featuredProducts
      : featuredProducts.filter((p) => (p.category || '').toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="bg-[#F8F6F0] text-[#292820] min-h-screen">
      {/* 1. Hero Section */}
      <FoodHero />

      {/* 2. Trust and Benefits Strip */}
      <FoodBenefitsStrip />

      {/* 3. Shop by Category (Soup Mixes, Millet Mixes, Rice Podis) */}
      <FoodCategoryGrid />

      {/* 4. Featured Products Showcase */}
      <section className="py-16 sm:py-20 bg-[#F8F6F0] border-b border-[#E5E0D5]">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              eyebrow="THE GOODNESS OF TRADITION"
              title="Traditional Blends & Mixes"
              description="Explore a thoughtful selection of soup mixes, millet mixes and traditional rice podis, bringing convenience and familiar flavours to everyday meals."
              collection="food"
            />

            {/* Filter Tabs for the 3 Categories */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs">
              {[
                { id: 'all', label: 'All Mixes' },
                { id: 'soups', label: 'Soup Mixes' },
                { id: 'millets', label: 'Millet Mixes' },
                { id: 'podis', label: 'Rice Podis' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#173B2A] text-white shadow-xs'
                      : 'text-[#292820] hover:text-[#173B2A] hover:bg-[#F8F6F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid or Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-[#E5E0D5] p-4 h-72 animate-pulse" />
              ))}
            </div>
          ) : filteredFeatured.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#E5E0D5] rounded-3xl p-8 max-w-xl mx-auto space-y-3">
              <Sparkles className="w-8 h-8 text-[#173B2A] mx-auto opacity-70" />
              <h3 className="text-xl font-serif text-[#292820]">Pantry Blends Being Curated</h3>
              <p className="text-xs text-[#7A7167] max-w-sm mx-auto leading-relaxed">
                Fresh batches of soup mixes, millet recipes, and traditional rice podis are currently being catalogued. Check back soon or browse categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFeatured.map((product) => (
                <FoodProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/food/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-[#173B2A] text-[#173B2A] hover:bg-[#173B2A] hover:text-white text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <span>Explore Complete Pantry Blends</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. Dedicated Soup ReadyMix Section */}
      <SoupCollectionSection />

      {/* 6. Promotional / Brand Heritage Banner */}
      <FoodPromoBanner />

      {/* 7. Explore Collections Showcase */}
      <ExploreCollectionsSection currentCollectionId="food" />
    </div>
  );
}
