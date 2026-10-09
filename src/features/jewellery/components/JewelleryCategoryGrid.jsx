import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { JEWELLERY_CATEGORIES } from '../data/categories';
import { Container } from '../../../components/ui/Container';

export function JewelleryCategoryGrid() {
  const categories = JEWELLERY_CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <section id="categories" className="py-16 sm:py-24 bg-[#343238]/40 text-[#F7F3EB] border-b border-[#B9B8B5]/15">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
            <Layers className="w-3.5 h-3.5" />
            <span>Form & Silhouette</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#F7F3EB]">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-[#B9B8B5]">
            From delicate everyday solitaire rings to statement pendants, explore each silhouette crafted in solid sterling silver.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/jewellery/products?category=${cat.id}`}
              className={`group relative rounded-2xl overflow-hidden border border-[#B9B8B5]/20 hover:border-[#B9B8B5] transition-all duration-normal shadow-lg flex flex-col justify-end min-h-[260px] p-6 bg-[#242326] ${
                idx === 0 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Background Image with Dark Vignette */}
              <div className="absolute inset-0">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#242326] via-[#242326]/75 to-[#242326]/20 group-hover:via-[#242326]/60 transition-colors" />
              </div>

              {/* Card Content */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#343238]/90 text-[#B9B8B5] border border-[#B9B8B5]/25 backdrop-blur-sm">
                    {cat.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#B9B8B5]/80">
                    {cat.count} Piece{cat.count > 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-[#F7F3EB] group-hover:text-[#B9B8B5] transition-colors">
                  {cat.name}
                </h3>

                <p className="text-xs text-[#B9B8B5] leading-relaxed line-clamp-2">
                  {cat.tagline}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-xs text-[#B9B8B5] font-mono uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  <span>Explore Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
