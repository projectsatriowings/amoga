import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Sparkles, Compass } from 'lucide-react';
import teaHero from '../../assets/images/food-teas-hero.jpg';
import { Container } from '../../components/ui/Container';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';
import { TeaProductCard } from './components/TeaProductCard';

import { useProducts } from '../../hooks/useProducts';
import { useCollection } from '../../hooks/useCollection';
import { ExploreCollectionsSection } from '../collections';

export function TeaStorefront() {
  const { collection } = useCollection('tea');
  const { products: apiProducts, isLoading } = useProducts({
    collection: 'tea',
  });

  const tagline = (collection?.tagline || 'BOTANICAL WELLNESS').toUpperCase();
  const heading = (collection?.heroHeading || collection?.name || 'WELLNESS TEA').toUpperCase();
  const subheading = collection?.heroSubheading || '';
  const description = collection?.description || 'Discover thoughtfully selected botanical teas and herbal infusions for your everyday tea ritual.';
  const heroImage = collection?.heroImage || teaHero;

  const tc = collection?.themeConfig || {};
  const accentColor = collection?.accentColor || tc.accentColor || tc.primaryColor || '#65815A';
  const bgColor = tc.bgColor || '#FAF1BB';
  const textColor = tc.textColor || '#2C1E11';

  const displayProducts = React.useMemo(() => {
    return apiProducts || [];
  }, [apiProducts]);

  return (
    <div
      className="relative min-h-screen overflow-hidden transition-colors"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Decorative Botanical Side Animations (Left & Right Gutters) */}
      <BotanicalSideAnimations />

      {/* 1. Hero Section */}
      <section
        className="relative z-10 pt-3 sm:pt-4 pb-14 sm:pb-20 border-b border-[#B88E38]/25 transition-colors"
        style={{
          background: `linear-gradient(to bottom, ${bgColor}, #F8EEA6, ${bgColor})`,
        }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow text */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-mono tracking-widest uppercase font-semibold shadow-2xs"
                style={{
                  backgroundColor: `${accentColor}25`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                <Leaf className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>{tagline}</span>
              </div>

              {/* Hero Heading */}
              <div className="space-y-2">
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-[1.08] tracking-tight uppercase"
                  style={{ color: textColor }}
                >
                  {heading}
                </h1>
                {subheading && (
                  <p className="text-base sm:text-lg font-serif italic opacity-85" style={{ color: textColor }}>
                    {subheading}
                  </p>
                )}
              </div>

              {/* Hero Description */}
              <p className="text-base sm:text-lg leading-relaxed max-w-xl font-sans" style={{ color: `${textColor}D9` }}>
                {description}
              </p>

              {/* Botanical Ritual Pillars */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">Whole Leaf</div>
                  <div className="text-[10px] text-[#7D5C3F] font-mono mt-0.5">Sun-Dried Petals</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">Pure Botanicals</div>
                  <div className="text-[10px] text-[#7D5C3F] font-mono mt-0.5">Honest Blends</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">Daily Ritual</div>
                  <div className="text-[10px] text-[#7D5C3F] font-mono mt-0.5">Gentle Infusions</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/tea/products"
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[#2C1E11] text-[#FAF1BB] hover:bg-[#8C6320] hover:text-white text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md"
                >
                  <span>SHOP TEA</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFFDF5] border border-[#B88E38]/30 text-[#2C1E11] hover:bg-white hover:border-[#8C6320]/50 text-xs font-mono font-medium tracking-wider uppercase transition-all shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5 text-[#8C6320]" />
                  <span>Shop Collections</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#B88E38]/30 bg-[#FFFDF5] aspect-square">
                <img
                  src={heroImage}
                  alt="Amoga Wellness Tea Collection"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 text-white text-xs space-y-1">
                  <div className="font-serif font-semibold text-[#FAF1BB] text-sm">
                    Botanical Tea Rituals
                  </div>
                  <p className="text-[11px] text-white/80 font-sans">
                    Single Estate Leaves &bull; Botanical Infusions &bull; Ayurvedic Herbs & Spices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Featured Varieties Grid */}
      <section className="relative z-10 py-16 sm:py-20 bg-[#FAF1BB] border-b border-[#B88E38]/20">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#8C6320] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BOTANICAL WELLNESS SELECTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2C1E11]">
                Botanical Teas & Herbal Infusions
              </h2>
              <p className="text-xs sm:text-sm text-[#543B25] mt-1 max-w-xl">
                Explore our selection of botanical teas and herbal infusions, bringing distinctive ingredients and comforting tea rituals to your everyday routine.
              </p>
            </div>

            <Link
              to="/tea/products"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8C6320] hover:text-[#2C1E11] flex items-center gap-1.5 hover:underline"
            >
              <span>View All Varieties</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-[#FFFDF5]/60 border border-[#B88E38]/20 p-4 h-72 animate-pulse" />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF5]/80 border border-[#B88E38]/25 rounded-3xl p-8 max-w-xl mx-auto space-y-3">
              <Sparkles className="w-8 h-8 text-[#8C6320] mx-auto opacity-70" />
              <h3 className="text-xl font-serif text-[#2C1E11]">Our Tea Catalogue is Being Curated</h3>
              <p className="text-xs text-[#543B25] max-w-sm mx-auto leading-relaxed">
                New botanical blends and herbal infusions are currently being prepared. Check back shortly or explore our other collections below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {displayProducts.slice(0, 6).map((product) => (
                <TeaProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 3. Explore Collections Showcase */}
      <ExploreCollectionsSection currentCollectionId="tea" />
    </div>
  );
}
