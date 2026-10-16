import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export function FoodPromoBanner() {
  return (
    <section className="py-12 sm:py-16 bg-[#F1EDE4]">
      <Container>
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#172B1C] via-[#213F27] to-[#172B1C] text-white p-8 sm:p-12 shadow-xl border border-[#287A25]/30">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wholesome Indian Pantry</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif leading-tight">
              Honouring Ancient Culinary Traditions for Modern Living
            </h2>

            <p className="text-xs sm:text-sm text-[#EAE6D9]/80 leading-relaxed">
              Explore Amoga's complete selection of twenty regional soup recipes, five single-origin herbal brews, ancient breakfast millets, and stone-ground spices.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link to="/food/products">
                <Button
                  variant="primary"
                  size="md"
                  collection="food"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop All Pantry Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
