import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SareeProductCard } from './SareeProductCard';
import { Container } from '../../../components/ui/Container';
import { useProducts } from '../../../hooks/useProducts';

export function SareeFeaturedGrid() {
  const { products: apiProducts, isLoading } = useProducts({
    collection: 'sarees',
  });

  const featured = React.useMemo(() => {
    const list = apiProducts || [];
    const items = list.filter((p) => p.isFeatured || p.verified);
    return items.length > 0 ? items.slice(0, 4) : list.slice(0, 4);
  }, [apiProducts]);

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
            <Link
              to="/sarees/products"
              className="text-xs font-medium text-[#C5A46D] hover:underline flex items-center gap-1.5"
            >
              <span>View All Sarees</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cards Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-[#381222]/50 border border-[#C5A46D]/20 p-4 h-72 animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="py-16 text-center bg-[#381222]/40 border border-[#C5A46D]/20 rounded-3xl p-8 max-w-xl mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-[#C5A46D] mx-auto opacity-70" />
            <h3 className="text-xl font-serif text-[#F6EBD8]">New Heritage Weaves Arriving Soon</h3>
            <p className="text-xs text-[#D4C2A7] max-w-sm mx-auto leading-relaxed">
              Our curated collection of traditional silk and zari sarees is currently being prepared for the upcoming season.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <SareeProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
