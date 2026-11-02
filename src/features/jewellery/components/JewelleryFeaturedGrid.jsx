import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { JewelleryProductCard } from './JewelleryProductCard';
import { Container } from '../../../components/ui/Container';
import { useProducts } from '../../../hooks/useProducts';

export function JewelleryFeaturedGrid() {
  const { products: apiProducts, isLoading } = useProducts({
    collection: 'jewellery',
  });

  const featured = React.useMemo(() => {
    const list = apiProducts || [];
    const items = list.filter((p) => p.isFeatured || p.verified);
    return items.length > 0 ? items.slice(0, 5) : list.slice(0, 5);
  }, [apiProducts]);

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
            <Link
              to="/jewellery/products"
              className="text-xs font-medium text-[#B9B8B5] hover:text-white hover:underline flex items-center gap-1.5"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cards Responsive Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl bg-[#343238]/60 border border-[#B9B8B5]/20 p-4 h-72 animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="py-16 text-center bg-[#343238]/40 border border-[#B9B8B5]/20 rounded-3xl p-8 max-w-xl mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-[#C6AD82] mx-auto opacity-70" />
            <h3 className="text-xl font-serif text-[#F7F3EB]">Sterling Silver Collection in Preparation</h3>
            <p className="text-xs text-[#B9B8B5] max-w-sm mx-auto leading-relaxed">
              Our 925 hallmarked sterling silver jewellery collection is currently being curated. Check back soon for new handcrafted arrivals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {featured.map((product) => (
              <JewelleryProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
