import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FOOD_CATEGORIES } from '../data/categories';
import { Container } from '../../../components/ui/Container';
import { SectionHeading } from '../../../components/ui/SectionHeading';

export function FoodCategoryGrid() {
  const categories = FOOD_CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <section className="py-14 sm:py-20 bg-[#FDFBF7] border-b border-[#172B1C]/8">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <SectionHeading
            eyebrow="Explore Culinary Categories"
            title="Shop by Range"
            description="Explore our specialized culinary categories — from medicinal botanical leaf soups to ancient breakfast millets."
            collection="food"
          />

          <Link
            to="/food/products"
            className="text-xs uppercase font-mono tracking-wider font-semibold text-[#287A25] hover:underline flex items-center gap-1.5 shrink-0"
          >
            <span>View All 66 Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/food/products?category=${cat.id}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-[#172B1C]/10 shadow-sm hover:shadow-md hover:border-[#287A25] transition-all flex flex-col justify-between p-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#287A25]/10 text-[#287A25] font-semibold">
                    {cat.badge || `${cat.count} items`}
                  </span>
                  <span className="text-xs font-mono text-black/40">
                    {cat.count} items
                  </span>
                </div>

                <h3 className="text-xl font-serif text-[#172B1C] group-hover:text-[#287A25] transition-colors">
                  {cat.name}
                </h3>

                <p className="text-xs text-[#557C36] leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs font-medium text-[#287A25]">
                <span className="underline underline-offset-4">Explore Collection</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
