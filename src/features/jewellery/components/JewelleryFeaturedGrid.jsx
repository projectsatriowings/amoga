import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { JewelleryProductCard } from './JewelleryProductCard';
import { getFeaturedJewellery } from '../data/products';
import { Container } from '../../../components/ui/Container';

export function JewelleryFeaturedGrid() {
  const featured = getFeaturedJewellery();

  return (
    <section id="featured" className="py-16 sm:py-24 bg-[#242326] text-[#F7F3EB] border-b border-[#B9B8B5]/15">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
              <span>Featured Collection</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#F7F3EB]">
              Sculpted Silver Signatures
            </h2>
            <p className="text-xs sm:text-sm text-[#B9B8B5] leading-relaxed">
              Approved flagship designs featuring pure 925 sterling silver bands, fluid pendant linkages, and subtle micro-pavé highlights.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs font-mono text-[#B9B8B5] px-3 py-1 rounded bg-[#343238] border border-[#B9B8B5]/20">
              01 &mdash; 05 Signatures
            </span>
            <Link
              to="/jewellery/products"
              className="text-xs font-medium text-[#B9B8B5] hover:text-white hover:underline flex items-center gap-1.5"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 5 Cards Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {featured.map((product) => (
            <JewelleryProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
