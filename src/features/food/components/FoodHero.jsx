import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Sparkles, Check } from 'lucide-react';
import foodHeroImg from '../../../assets/images/gatekeeper-food.jpg';
import { Container } from '../../../components/ui/Container';
import { useCollection } from '../../../hooks/useCollection';

export function FoodHero() {
  const { collection } = useCollection('food');

  const tagline = (collection?.tagline || 'THE GOODNESS OF TRADITION').toUpperCase();
  const heading = (collection?.heroHeading || collection?.name || 'WHOLESOME PANTRY').toUpperCase();
  const subheading = collection?.heroSubheading || 'Traditional blends for everyday nourishment.';
  const description = collection?.description || 'Discover traditional Indian blends made for everyday cooking, from comforting soup mixes to nourishing millet blends and flavourful rice podis.';
  const heroImage = collection?.heroImage || foodHeroImg;

  const tc = collection?.themeConfig || {};
  const accentColor = collection?.accentColor || tc.accentColor || tc.primaryColor || '#3F7B43';
  const headingColor = tc.secondaryColor || '#173B2A';
  const bgColor = tc.bgColor || '#F8F6F0';
  const textColor = tc.textColor || '#292820';

  return (
    <section
      className="relative overflow-hidden py-12 sm:py-16 lg:py-24 border-b border-[#E5E0D5] transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Messaging */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Eyebrow Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-mono font-semibold tracking-widest uppercase shadow-2xs"
              style={{
                backgroundColor: `${accentColor}1A`,
                borderColor: `${accentColor}33`,
                color: accentColor,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tagline}</span>
            </div>

            {/* Large Uppercase Collection Heading */}
            <div className="space-y-2">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-[1.08] tracking-tight uppercase"
                style={{ color: headingColor }}
              >
                {heading}
              </h1>
              {subheading && (
                <p className="text-base sm:text-lg font-serif italic opacity-90" style={{ color: headingColor }}>
                  {subheading}
                </p>
              )}
            </div>

            {/* Approved Hero Description */}
            <p className="text-base sm:text-lg max-w-xl leading-relaxed font-sans" style={{ color: `${textColor}CC` }}>
              {description}
            </p>

            {/* Category Highlights */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {[
                'Soup Mixes',
                'Millet Mixes',
                'Rice Podis',
              ].map((pill) => (
                <div
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E5E0D5] text-xs font-medium text-[#173B2A] shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 text-[#3F7B43]" />
                  <span>{pill}</span>
                </div>
              ))}
            </div>

            {/* Rounded Outlined CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/food/products"
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border-2 border-[#173B2A] text-[#173B2A] hover:bg-[#173B2A] hover:text-[#F8F6F0] text-xs font-mono font-semibold tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-sm"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFFFFF] border border-[#E5E0D5] text-[#292820] hover:bg-[#F8F6F0] hover:border-[#173B2A]/30 text-xs font-mono font-medium tracking-wider uppercase transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-[#3F7B43]" />
                <span>All Collections</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Refined Food Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E5E0D5] bg-[#FFFFFF] aspect-[4/3] sm:aspect-square">
              <img
                src={heroImage}
                alt="Amoga Wholesome Pantry Collection"
                className="w-full h-full object-cover object-center"
              />

              {/* Decorative Subtle Stamp */}
              <div className="absolute top-4 right-4 bg-[#FFFFFF]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs border border-[#E5E0D5] text-[11px] font-serif italic text-[#173B2A]">
                Traditional Blends &bull; Everyday Cooking
              </div>

              {/* Bottom Feature Pill */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#173B2A]/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#E5E0D5]">
                    Wholesome Pantry Blends
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    Soup Mixes, Millets & Rice Podis
                  </div>
                </div>
                <Link
                  to="/food/products?category=soups"
                  className="text-xs text-[#F8F6F0] hover:underline flex items-center gap-1 font-mono font-semibold"
                >
                  <span>Explore</span>
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
