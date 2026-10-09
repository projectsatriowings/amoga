import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, PhoneCall } from 'lucide-react';
import teaImg from '../../../assets/images/food-teas-hero.jpg';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { FOOD_PRODUCTS } from '../data/products';

export function HerbalTeaSection() {
  const teaProducts = FOOD_PRODUCTS.filter((p) => p.category === 'teas');

  return (
    <section className="py-16 sm:py-24 bg-[#F5F1E8] border-b border-[#172B1C]/8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Tea Standee Narrative & Varieties */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#287A25]/10 border border-[#287A25]/20 text-[#287A25] text-xs font-mono tracking-widest uppercase font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              <span>Let's Make Tea Healthy</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#172B1C] leading-tight">
              Discover Nature in <br />
              <span className="italic text-[#287A25]">Every Cup</span>
            </h2>

            <p className="text-sm sm:text-base text-[#405244] leading-relaxed max-w-xl">
              Five signature botanical brews crafted from natural sun-dried blossoms, therapeutic herbs, and Ceylon spice chips without added sugar or synthetic additives.
            </p>

            {/* 5 Standee Tea Varieties Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {teaProducts.map((tea) => (
                <Link
                  key={tea.id}
                  to={`/food/products/${tea.slug}`}
                  className="p-3.5 rounded-xl bg-white border border-[#172B1C]/10 hover:border-[#287A25] shadow-sm transition-all group"
                >
                  <div className="text-sm font-semibold text-[#172B1C] group-hover:text-[#287A25]">
                    {tea.name}
                  </div>
                  {tea.standeeNotes && (
                    <div className="text-[11px] text-[#557C36] mt-0.5">
                      {tea.standeeNotes}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Direct Order Contact Bar from Standee */}
            <div className="p-4 rounded-xl bg-[#EAE6D9] border border-[#172B1C]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#172B1C] font-medium">
                <PhoneCall className="w-4 h-4 text-[#287A25]" />
                <span>Orders & Wholesale Desk: +91 9940018593 / +91 8056700646</span>
              </div>
              <Link to="/food/products?category=teas">
                <Button variant="primary" size="sm" collection="food" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Browse Herbal Teas
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Cups Display */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#172B1C]/10 aspect-square">
              <img
                src={teaImg}
                alt="Amoga Herbal Teas Display"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-5 left-5 right-5 p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs">
                <span className="font-semibold block text-[#C5A46D]">Artisanal Botanical Infusions</span>
                <span>Butterfly Blue Pea &bull; Moringa Leaf &bull; Cinnamon &bull; Hibiscus</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
