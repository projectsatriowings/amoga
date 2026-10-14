import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import modelHero from '../../../assets/images/jewellery-model-hero.jpg';
import { Container } from '../../../components/ui/Container';
import { useCollection } from '../../../hooks/useCollection';
import { CallToOrderAssistance } from '../../../components/common/CallToOrderAssistance';

export function JewelleryHero() {
  const { collection } = useCollection('jewellery');

  const tagline = (collection?.tagline || 'Timeless Elegance • Pure Silver').toUpperCase();
  const heading = collection?.heroHeading || 'Silver, Sculpted with Meaning';
  const subheading = collection?.heroSubheading || '';
  const description = collection?.description || 'Explore a considered collection of silver jewellery for everyday elegance and special occasions. Handcrafted contours, minimalist geometry, and lasting precious-metal quality designed to be worn effortlessly.';
  const heroImage = collection?.heroImage || modelHero;

  const tc = collection?.themeConfig || {};
  const accentColor = collection?.accentColor || tc.accentColor || tc.primaryColor || '#B9B8B5';
  const bgColor = tc.bgColor || '#242326';
  const textColor = tc.textColor || '#F7F3EB';
  const mutedText = tc.mutedTextColor || '#B9B8B5';

  return (
    <section
      className="relative overflow-hidden border-b transition-colors"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: `${accentColor}26`,
      }}
    >
      {/* Subtle Ambient Silver Light */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-10"
        style={{ backgroundColor: accentColor }}
      />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#343238]/40 rounded-full blur-2xl pointer-events-none" />

      <Container>
        <div className="pt-3 sm:pt-4 pb-12 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Decorative & Model Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center order-2 lg:order-1"
          >
            {/* Left Vertical Ribbon */}
            <div
              className="hidden sm:flex flex-col items-center gap-3 absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.25em] select-none opacity-60"
              style={{ color: accentColor }}
            >
              <span className="rotate-180 [writing-mode:vertical-rl]">Crafted with Purity</span>
              <span className="w-1.5 h-1.5 rotate-45 border" style={{ borderColor: accentColor }} />
            </div>

            {/* Main Portrait Card Frame */}
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden border shadow-2xl bg-[#343238]"
              style={{ borderColor: `${accentColor}40` }}
            >
              <img
                src={heroImage}
                alt="Amoga Pure Silver Jewellery Editorial Showcase"
                className="w-full h-auto aspect-[3/4] object-cover object-top"
              />

              {/* Bottom Subtle Caption Overlay */}
              <div
                className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t via-black/60 to-transparent"
                style={{ from: bgColor }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accentColor }}>
                      Modern Heirlooms
                    </div>
                    <div className="font-serif text-sm" style={{ color: textColor }}>
                      {subheading || 'Pure 925 Sterling Silver'}
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded bg-[#343238] border"
                    style={{ color: accentColor, borderColor: `${accentColor}33` }}
                  >
                    Artisanal
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 lg:pl-6 order-1 lg:order-2"
          >
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border text-xs font-mono uppercase tracking-widest shadow-2xs"
              style={{
                backgroundColor: '#343238B3',
                borderColor: `${accentColor}4D`,
                color: accentColor,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
              <span>{tagline}</span>
            </div>

            {/* Editorial Title */}
            <div className="space-y-2">
              <h1
                className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight"
                style={{ color: textColor }}
              >
                {heading}
              </h1>
              {subheading && (
                <p className="font-serif italic text-base sm:text-lg opacity-90" style={{ color: accentColor }}>
                  {subheading}
                </p>
              )}
            </div>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base leading-relaxed max-w-xl font-sans" style={{ color: mutedText }}>
              {description}
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg">
              <div className="p-3 rounded-lg bg-[#343238]/80 border border-[#B9B8B5]/15">
                <div className="text-xs font-mono text-[#B9B8B5]">Solid 925</div>
                <div className="text-xs text-[#F7F3EB] mt-0.5">Precious Sterling Base</div>
              </div>
              <div className="p-3 rounded-lg bg-[#343238]/80 border border-[#B9B8B5]/15">
                <div className="text-xs font-mono text-[#B9B8B5]">Anti-Tarnish</div>
                <div className="text-xs text-[#F7F3EB] mt-0.5">Protective Coating</div>
              </div>
              <div className="p-3 rounded-lg bg-[#343238]/80 border border-[#B9B8B5]/15">
                <div className="text-xs font-mono text-[#B9B8B5]">Restrained Form</div>
                <div className="text-xs text-[#F7F3EB] mt-0.5">Minimalist Geometry</div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/jewellery/products"
                className="px-6 py-3.5 rounded-xl bg-[#B9B8B5] text-[#242326] font-medium text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Explore Jewellery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <CallToOrderAssistance variant="hero" />

              <a
                href="#featured"
                className="px-6 py-3.5 rounded-xl bg-[#343238] text-[#F7F3EB] border border-[#B9B8B5]/25 font-medium text-xs uppercase tracking-wider hover:bg-[#3E3C44] hover:border-[#B9B8B5] transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#B9B8B5]" />
                <span>Discover the Collection</span>
              </a>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
