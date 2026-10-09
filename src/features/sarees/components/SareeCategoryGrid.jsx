import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { SAREE_CATEGORIES } from '../data/categories';
import { Container } from '../../../components/ui/Container';

export function SareeCategoryGrid() {
  const categories = SAREE_CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <section id="collections" className="py-16 sm:py-24 bg-[#381222]/40 text-[#F6EBD8] border-b border-[#C5A46D]/15">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Textile Archives</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#F6EBD8]">
            Shop by Collection
          </h2>
          <p className="text-xs sm:text-sm text-[#D4C2A7]">
            Explore distinctive weaving traditions, from auspicious wedding silks to modern lightweight drapes.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/sarees/products?category=${cat.id}`}
              className={`group relative rounded-2xl overflow-hidden border border-[#C5A46D]/20 hover:border-[#C5A46D] transition-all duration-normal shadow-lg flex flex-col justify-end min-h-[260px] p-6 bg-[#2C0E1A] ${
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C0E1A] via-[#2C0E1A]/70 to-[#2C0E1A]/20 group-hover:via-[#2C0E1A]/60 transition-colors" />
              </div>

              {/* Card Content */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#451523]/90 text-[#C5A46D] border border-[#C5A46D]/30 backdrop-blur-sm">
                    {cat.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#D4C2A7]">
                    {cat.count} Design{cat.count > 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-[#F6EBD8] group-hover:text-[#C5A46D] transition-colors">
                  {cat.name}
                </h3>

                <p className="text-xs text-[#D4C2A7] leading-relaxed line-clamp-2">
                  {cat.tagline}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-xs text-[#C5A46D] font-mono uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  <span>Explore Weaves</span>
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
