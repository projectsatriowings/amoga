import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Compass } from 'lucide-react';
import foodHeroImg from '../../../assets/images/gatekeeper-food.jpg';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export function FoodHero() {
  return (
    <section className="relative overflow-hidden bg-[#FDFBF7] py-10 sm:py-14 lg:py-20 border-b border-[#172B1C]/8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Messaging */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#287A25]/10 border border-[#287A25]/20 text-[#287A25] text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Organic & Natural</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#172B1C] leading-[1.08] tracking-tight">
              Pure Goodness <br />
              <span className="italic font-normal text-[#287A25]">from Nature</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#405244] max-w-xl leading-relaxed">
              Discover Amoga's selection of thoughtfully presented food products, herbal teas, and comforting soup mixes crafted for daily vitality and honest flavour.
            </p>

            {/* Trust Pill Benefits */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {[
                '100% Organic Ingredients',
                'No Artificial Additives',
                'Sustainably Sourced',
              ].map((pill) => (
                <div
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAE6D9]/60 border border-[#172B1C]/10 text-xs font-medium text-[#172B1C]"
                >
                  <Check className="w-3.5 h-3.5 text-[#287A25]" />
                  <span>{pill}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to="/food/products">
                <Button
                  variant="primary"
                  size="lg"
                  collection="food"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop Food
                </Button>
              </Link>

              <Link to="/">
                <Button
                  variant="outline"
                  size="lg"
                  collection="food"
                  leftIcon={<Compass className="w-4 h-4" />}
                >
                  Explore Collections
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: High-Quality Culinary Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#172B1C]/10 bg-[#EAE6D9]/50 aspect-[4/3] sm:aspect-square">
              <img
                src={foodHeroImg}
                alt="Amoga Gourmet Food Collection"
                className="w-full h-full object-cover object-center filter saturate-[1.05]"
              />

              {/* Decorative Subtle Stamp */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#172B1C]/10 text-[11px] font-serif italic text-[#172B1C]">
                Real Food &bull; Real Health
              </div>

              {/* Bottom Feature Pill */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C5A46D]">
                    Featured Delicacy
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    Farm-Fresh Organic Harvest & Soups
                  </div>
                </div>
                <Link
                  to="/food/products?category=soups"
                  className="text-xs text-[#C5A46D] hover:underline flex items-center gap-1 font-mono"
                >
                  <span>20 Soups</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
