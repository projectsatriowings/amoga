import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Sparkles, Compass } from 'lucide-react';
import teaHero from '../../assets/images/food-teas-hero.jpg';
import { Container } from '../../components/ui/Container';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';
import { TeaProductCard } from './components/TeaProductCard';
import { TEA_PRODUCTS } from './data/products';
import { CartDrawer } from '../food/components/CartDrawer';
import { WishlistDrawer } from '../food/components/WishlistDrawer';
import { useProducts } from '../../hooks/useProducts';

export function TeaStorefront() {
  const { products: apiProducts } = useProducts({
    collection: 'tea',
    fallbackData: TEA_PRODUCTS,
  });

  const displayProducts = React.useMemo(() => {
    const raw = apiProducts && apiProducts.length > 0 ? apiProducts : TEA_PRODUCTS;
    return raw.map((p) => {
      const fallback = TEA_PRODUCTS.find((f) => f.slug === p.slug || f.id === p.id);
      return fallback ? { ...fallback, ...p } : p;
    });
  }, [apiProducts]);

  return (
    <div className="relative bg-[#F8F6F0] text-[#292820] min-h-screen overflow-hidden">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* Decorative Botanical Side Animations (Left & Right Gutters) */}
      <BotanicalSideAnimations />

      {/* 1. Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-16 sm:pb-24 border-b border-[#E5E0D5] bg-gradient-to-b from-[#F8F6F0] via-[#FAF6EE] to-[#F8F6F0]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow text */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#65815A]/10 border border-[#65815A]/25 text-[#173B2A] text-xs font-mono tracking-widest uppercase font-semibold">
                <Leaf className="w-3.5 h-3.5 text-[#65815A]" />
                <span>BOTANICAL WELLNESS</span>
              </div>

              {/* Hero Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#173B2A] leading-[1.08] tracking-tight uppercase">
                WELLNESS TEA
              </h1>

              {/* Hero Description */}
              <p className="text-base sm:text-lg text-[#292820]/80 leading-relaxed max-w-xl font-sans">
                Discover thoughtfully selected botanical teas and herbal infusions for your everyday tea ritual.
              </p>

              {/* Botanical Ritual Pillars */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs text-center">
                  <div className="text-xs font-serif font-bold text-[#173B2A]">Whole Leaf</div>
                  <div className="text-[10px] text-[#746F63] font-mono mt-0.5">Sun-Dried Petals</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs text-center">
                  <div className="text-xs font-serif font-bold text-[#173B2A]">Pure Botanicals</div>
                  <div className="text-[10px] text-[#746F63] font-mono mt-0.5">Honest Blends</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-2xs text-center">
                  <div className="text-xs font-serif font-bold text-[#173B2A]">Daily Ritual</div>
                  <div className="text-[10px] text-[#746F63] font-mono mt-0.5">Gentle Infusions</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/tea/products"
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border-2 border-[#173B2A] text-[#173B2A] hover:bg-[#173B2A] hover:text-[#F8F6F0] text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <span>EXPLORE COLLECTION</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFFFFF] border border-[#E5E0D5] text-[#292820] hover:bg-[#F8F6F0] hover:border-[#173B2A]/30 text-xs font-mono font-medium tracking-wider uppercase transition-all"
                >
                  <Compass className="w-3.5 h-3.5 text-[#65815A]" />
                  <span>All Collections</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E5E0D5] bg-[#FFFFFF] aspect-square">
                <img
                  src={teaHero}
                  alt="Amoga Wellness Tea Collection"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-[#173B2A]/90 backdrop-blur-md border border-white/15 text-white text-xs space-y-1">
                  <div className="font-serif font-semibold text-[#EAE2D3] text-sm">
                    Botanical Tea Rituals
                  </div>
                  <p className="text-[11px] text-white/80 font-sans">
                    Butterfly Blue Pea &bull; Moringa Leaf &bull; Cinnamon &bull; Sarsaparilla &bull; Hibiscus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Featured Varieties Grid */}
      <section className="relative z-10 py-16 sm:py-20 bg-[#F8F6F0] border-b border-[#E5E0D5]">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#65815A] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BOTANICAL WELLNESS SELECTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#173B2A]">
                Botanical Teas & Herbal Infusions
              </h2>
              <p className="text-xs sm:text-sm text-[#746F63] mt-1 max-w-xl">
                Explore our selection of botanical teas and herbal infusions, bringing distinctive ingredients and comforting tea rituals to your everyday routine.
              </p>
            </div>

            <Link
              to="/tea/products"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-[#173B2A] hover:text-[#65815A] flex items-center gap-1.5 hover:underline"
            >
              <span>View All Varieties</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayProducts.slice(0, 6).map((product) => (
              <TeaProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
