import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Utensils, Wheat, Sparkles } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { SectionHeading } from '../../../components/ui/SectionHeading';

const PANTRY_CATEGORIES = [
  {
    id: 'soups',
    name: 'Soup Mixes',
    subtitle: 'Nourishing Broths & Botanical Leaves',
    description: 'A comforting collection featuring regional botanical leaves, fresh garden herbs, and nourishing comforting broths.',
    badge: '20 Recipes',
    icon: Utensils,
    href: '/food/products?category=soups',
  },
  {
    id: 'millets',
    name: 'Millet Mixes',
    subtitle: 'Ancient Grain Breakfast & Meal Blends',
    description: 'Wholesome breakfast mixes, nutritious meal bases, and savoury treats reimagining heritage millets for daily vitality.',
    badge: '10 Blends',
    icon: Wheat,
    href: '/food/products?category=millets',
  },
  {
    id: 'podis',
    name: 'Rice Podis',
    subtitle: 'Traditional Aromatic Accompaniments',
    description: 'A varied selection of regional leaf blends, aromatic roasted seeds, and flavourful accompaniments for warm rice.',
    badge: '25 Podis',
    icon: Sparkles,
    href: '/food/products?category=podis',
  },
];

export function FoodCategoryGrid() {
  return (
    <section className="py-14 sm:py-20 bg-[#F8F6F0] border-b border-[#E5E0D5]">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <SectionHeading
            eyebrow="THE GOODNESS OF TRADITION"
            title="Three Essential Pantry Ranges"
            description="Explore our three specialized traditional ranges crafted for everyday comfort and familiar home cooking."
            collection="food"
          />

          <Link
            to="/food/products"
            className="text-xs uppercase font-mono tracking-wider font-semibold text-[#173B2A] hover:text-[#3F7B43] flex items-center gap-1.5 shrink-0 hover:underline"
          >
            <span>View All Blends</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Categories Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {PANTRY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={cat.href}
                className="group relative rounded-2xl bg-[#FFFFFF] border border-[#E5E0D5] hover:border-[#173B2A] p-7 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] group-hover:bg-[#173B2A] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F8F6F0] border border-[#E5E0D5] text-[#173B2A] font-semibold">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-serif text-[#173B2A] group-hover:text-[#3F7B43] transition-colors mb-1.5">
                    {cat.name}
                  </h3>

                  <p className="text-xs font-mono text-[#746F63] mb-3">
                    {cat.subtitle}
                  </p>

                  <p className="text-xs text-[#292820]/80 leading-relaxed font-sans">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-[#E5E0D5]/60 flex items-center justify-between text-xs font-mono font-semibold text-[#173B2A] group-hover:text-[#3F7B43]">
                  <span className="uppercase tracking-wider">Explore {cat.name}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
