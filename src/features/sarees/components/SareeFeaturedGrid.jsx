import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SareeProductCard } from './SareeProductCard';
import { getFeaturedSarees } from '../data/products';
import { Container } from '../../../components/ui/Container';

export function SareeFeaturedGrid() {
  const featured = getFeaturedSarees();

  return (
    <section className="py-16 sm:py-24 bg-[#2C0E1A] text-[#F6EBD8] border-b border-[#C5A46D]/15">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Traditional Silk Sarees Collection</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#F6EBD8]">
              Featured Heritage Weaves
            </h2>
            <p className="text-xs sm:text-sm text-[#D4C2A7] leading-relaxed">
              Approved flagship weaves showcasing authentic zari borders, temple motifs, and fluid drapes. Each piece is catalogue verified.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs font-mono text-[#C5A46D] px-3 py-1 rounded bg-[#381222] border border-[#C5A46D]/20">
              01 &mdash; 04 Verified
            </span>
            <Link
              to="/sarees/products"
              className="text-xs font-medium text-[#C5A46D] hover:underline flex items-center gap-1.5"
            >
              <span>View All ({12})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <SareeProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
