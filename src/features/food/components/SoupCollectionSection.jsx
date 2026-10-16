import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import soupImg from '../../../assets/images/food-soups-hero.jpg';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { FOOD_PRODUCTS } from '../data/products';

export function SoupCollectionSection() {
  const soupProducts = FOOD_PRODUCTS.filter((p) => p.category === 'soups');

  return (
    <section className="py-16 sm:py-24 bg-[#172B1C] text-[#F1EDE4] relative overflow-hidden">
      {/* Subtle organic background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#F1EDE4_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Collection Imagery & Trio */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-square">
              <img
                src={soupImg}
                alt="Amoga Soup ReadyMix Collection"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-white">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A46D]">
                  The Soup Collection / 2026
                </div>
                <div className="text-sm font-medium">
                  Twenty Distinctive Soups. One Memorable Collection.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Collection Story & 20-Recipe Preview */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#C5A46D] text-xs font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Traditional Indian Soup Mixes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#F1EDE4] leading-tight">
              Soup Ready Mix <br />
              <span className="italic font-normal text-[#C5A46D]">
                Twenty Distinctive Bowls
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#EAE6D9]/80 leading-relaxed max-w-xl">
              From bright lemon coriander and nutritious moringa leaves to comforting creamy garlic mushroom and traditional thippili, every soup mix is easy to prepare for healthy everyday meals.
            </p>

            {/* 20-Product Recipe Tags Pill Cloud */}
            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-[#C5A46D] mb-3">
                All 20 Signature Varieties in Catalogue:
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                {soupProducts.map((soup, idx) => (
                  <Link
                    key={soup.id}
                    to={`/food/products/${soup.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#C5A46D] hover:bg-white/10 text-xs text-[#F1EDE4] transition-all"
                  >
                    <span className="font-mono text-[10px] opacity-50">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{soup.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA to Soup Catalogue */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link to="/food/products?category=soups">
                <Button
                  variant="primary"
                  size="md"
                  collection="sarees"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop All 20 Soups
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
