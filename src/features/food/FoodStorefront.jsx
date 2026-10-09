import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FoodHero } from './components/FoodHero';
import { FoodBenefitsStrip } from './components/FoodBenefitsStrip';
import { FoodCategoryGrid } from './components/FoodCategoryGrid';
import { FoodProductCard } from './components/FoodProductCard';
import { SoupCollectionSection } from './components/SoupCollectionSection';
import { FoodPromoBanner } from './components/FoodPromoBanner';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { Container } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { getFeaturedProducts } from './data/products';

export function FoodStorefront() {
  const featuredProducts = getFeaturedProducts();
  const [activeTab, setActiveTab] = useState('all');

  const filteredFeatured =
    activeTab === 'all'
      ? featuredProducts
      : featuredProducts.filter((p) => p.category === activeTab);

  return (
    <div className="bg-[#F1EDE4] text-[#172B1C] min-h-screen">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* 1. Hero Section */}
      <FoodHero />

      {/* 2. Trust and Benefits Strip */}
      <FoodBenefitsStrip />

      {/* 3. Shop by Category */}
      <FoodCategoryGrid />

      {/* 4. Featured Products Showcase */}
      <section className="py-16 sm:py-20 bg-[#F1EDE4] border-b border-[#172B1C]/8">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              eyebrow="Crafted for Wholesome Living"
              title="Featured Delicacies"
              description="A curated selection of farm-fresh staples, wholesome ancient millets, and regional soup mixes."
              collection="food"
            />

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#E5DFD3]/70 border border-[#172B1C]/10">
              {[
                { id: 'all', label: 'All Featured' },
                { id: 'spices', label: 'Pantry Staples' },
                { id: 'soups', label: 'Soups' },
                { id: 'millets', label: 'Millets' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#287A25] text-white shadow-sm'
                      : 'text-[#172B1C] hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFeatured.map((product) => (
              <FoodProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/food/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#287A25] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1E5C1B] transition-all shadow-md active:scale-95"
            >
              <span>Explore Complete Catalogue (61 Items)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. Dedicated Soup ReadyMix Section (20-Recipe Range) */}
      <SoupCollectionSection />

      {/* 6. Promotional / Brand Heritage Banner */}
      <FoodPromoBanner />
    </div>
  );
}
