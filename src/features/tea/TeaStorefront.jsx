import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, PhoneCall } from 'lucide-react';
import teaHero from '../../assets/images/food-teas-hero.jpg';
import { Container } from '../../components/ui/Container';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';
import { TeaProductCard } from './components/TeaProductCard';
import { TEA_PRODUCTS } from './data/products';
import { CartDrawer } from '../food/components/CartDrawer';
import { WishlistDrawer } from '../food/components/WishlistDrawer';

export function TeaStorefront() {
  return (
    <div className="relative bg-[#FAF1BB] text-[#2C1E11] min-h-screen overflow-hidden">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* Decorative Botanical Side Animations (Left & Right Gutters) */}
      <BotanicalSideAnimations />

      {/* 1. Hero Section */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-16 sm:pb-24 border-b border-[#B88E38]/25 bg-gradient-to-b from-[#FAF1BB] via-[#FDF9E7] to-[#FAF1BB]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B88E38]/20 border border-[#B88E38]/40 text-[#8C6320] text-xs font-mono tracking-widest uppercase font-semibold">
                <Leaf className="w-3.5 h-3.5 text-[#B88E38]" />
                <span>Let's Make Tea Healthy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#2C1E11] leading-[1.08]">
                Discover Nature in <br />
                <span className="italic text-[#8C6320]">Every Steeping Cup</span>
              </h1>

              <p className="text-sm sm:text-base text-[#543B25] leading-relaxed max-w-xl">
                Five signature botanical brews crafted from natural sun-dried blossoms, therapeutic roots, and Ceylon spice chips without added sugar, synthetic colors, or artificial flavorings.
              </p>

              {/* Botanical Pillars */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="p-3 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">100% Whole</div>
                  <div className="text-[10px] text-[#7D5C3F] mt-0.5">Sun-Dried Petals</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">Zero Sugar</div>
                  <div className="text-[10px] text-[#7D5C3F] mt-0.5">Pure Herbs Only</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/25 shadow-sm text-center">
                  <div className="text-xs font-serif font-bold text-[#2C1E11]">Caffeine-Free</div>
                  <div className="text-[10px] text-[#7D5C3F] mt-0.5">Gentle Tisanes</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/tea/products"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shadow-md active:scale-95"
                >
                  <span>Explore All 5 Varieties</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#standee-selection"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/70 text-[#2C1E11] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all border border-[#B88E38]/30 shadow-sm"
                >
                  <span>Standee Reference</span>
                </a>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#B88E38]/30 aspect-square">
                <img
                  src={teaHero}
                  alt="Amoga Herbal Teas Display"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 text-white text-xs space-y-1">
                  <div className="font-serif font-semibold text-[#FAF1BB] text-sm">
                    Amoga Herbal Tea Standee Reference
                  </div>
                  <p className="text-[11px] text-white/80">
                    Butterfly Blue Pea &bull; Moringa Leaf &bull; Cinnamon &bull; Sarsaparilla &bull; Hibiscus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Standee Varieties Showcase Grid */}
      <section id="standee-selection" className="relative z-10 py-16 sm:py-24 bg-[#FDF9E7] border-b border-[#B88E38]/20">
        <Container>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#8C6320] font-semibold">
              The Five Botanical Pillars
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1E11]">
              Dedicated Herbal Tea Collection
            </h2>
            <p className="text-xs sm:text-sm text-[#543B25] leading-relaxed">
              Every tea in this collection is formulated from documented traditional Indian remedies, combining single-estate harvest flowers, leaves, and barks.
            </p>
          </div>

          {/* 5 Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {TEA_PRODUCTS.map((tea) => (
              <TeaProductCard key={tea.id} product={tea} />
            ))}
          </div>

          {/* Direct Wholesale / Order Contact Banner */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#FFFDF5] border border-[#B88E38]/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF1BB] border border-[#B88E38]/30 text-[#8C6320] flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[#2C1E11]">
                  Direct Tea Orders & Wholesale Enquiries
                </div>
                <div className="text-xs text-[#543B25]">
                  Place direct orders for retail tins or bespoke bulk infusions:
                  <span className="font-mono font-bold text-[#8C6320] ml-1.5">+91 9940018593 / +91 8056700646</span>
                </div>
              </div>
            </div>

            <Link
              to="/tea/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B88E38] text-[#2C1E11] text-xs font-bold uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shrink-0 shadow-sm"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* 3. Brewing Rituals & Botanical Guidance */}
      <section className="relative z-10 py-16 sm:py-20 bg-[#FAF1BB]/60">
        <Container>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif text-[#2C1E11]">
                The Botanical Steeping Ritual
              </h3>
              <p className="text-xs sm:text-sm text-[#543B25]">
                To extract full polyphenols and delicate aromas without scorching floral petals:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white/80 border border-[#B88E38]/20 space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF1BB] text-[#8C6320] font-mono font-bold flex items-center justify-center mx-auto text-sm">
                  01
                </div>
                <h4 className="font-serif font-semibold text-[#2C1E11] text-sm">Spring Water</h4>
                <p className="text-xs text-[#543B25] leading-relaxed">
                  Bring fresh filtered water to a gentle boil (85°C–95°C depending on delicate leaf vs woody bark).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 border border-[#B88E38]/20 space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF1BB] text-[#8C6320] font-mono font-bold flex items-center justify-center mx-auto text-sm">
                  02
                </div>
                <h4 className="font-serif font-semibold text-[#2C1E11] text-sm">Whole Infusion</h4>
                <p className="text-xs text-[#543B25] leading-relaxed">
                  Steep 1–2 teaspoons of whole calyces or root chips in covered cup for 4 to 6 minutes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 border border-[#B88E38]/20 space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF1BB] text-[#8C6320] font-mono font-bold flex items-center justify-center mx-auto text-sm">
                  03
                </div>
                <h4 className="font-serif font-semibold text-[#2C1E11] text-sm">Savor Mindfully</h4>
                <p className="text-xs text-[#543B25] leading-relaxed">
                  Enjoy pure, or add a drop of wild forest honey or a squeeze of fresh lemon for the blue pea color shift.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
