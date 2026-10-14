import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import sareeModelHero from '../../../assets/images/saree-model-hero.jpg';
import { Container } from '../../../components/ui/Container';
import { useCollection } from '../../../hooks/useCollection';
import { CallToOrderAssistance } from '../../../components/common/CallToOrderAssistance';

export function SareeHero() {
  const { collection } = useCollection('sarees');

  const tagline = (collection?.tagline || 'Heritage Collection • Timeless Elegance').toUpperCase();
  const heading = collection?.heroHeading || 'The Heritage in Every Drape';
  const subheading = collection?.heroSubheading || '';
  const description = collection?.description || "Discover Amoga's curated collection of traditional silk sarees, crafted with timeless artistry, royal heritage, and unmatched elegance. From auspicious temple borders to shimmering festive weaves.";
  const heroImage = collection?.heroImage || sareeModelHero;

  const tc = collection?.themeConfig || {};
  const accentColor = collection?.accentColor || tc.accentColor || tc.primaryColor || '#C5A46D';
  const bgColor = tc.bgColor || '#2C0E1A';
  const textColor = tc.textColor || '#F6EBD8';
  const mutedText = tc.mutedTextColor || '#D4C2A7';

  return (
    <section
      className="relative overflow-hidden border-b transition-colors"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: `${accentColor}33`,
      }}
    >
      {/* Subtle Gold Ambient Glow */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: accentColor }}
      />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#451523]/40 rounded-full blur-2xl pointer-events-none" />

      <Container>
        <div className="pt-3 sm:pt-4 pb-12 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Decorative & Model Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Left Vertical Ribbon */}
            <div
              className="hidden sm:flex flex-col items-center gap-3 absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.25em] select-none opacity-70"
              style={{ color: accentColor }}
            >
              <span className="rotate-180 [writing-mode:vertical-rl]">Tradition in Every Thread</span>
              <span className="w-1.5 h-1.5 rotate-45 border" style={{ borderColor: accentColor }} />
            </div>

            {/* Main Portrait Card Frame */}
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden border-2 shadow-2xl bg-[#381222]"
              style={{ borderColor: `${accentColor}4D` }}
            >
              <img
                src={heroImage}
                alt="Amoga Heritage Kanchipuram Silk Saree Drape"
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
                      Temple Heritage
                    </div>
                    <div className="font-serif text-sm" style={{ color: textColor }}>
                      {subheading || 'Authentic Kanchipuram Drape'}
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded bg-[#451523] border"
                    style={{ color: accentColor, borderColor: `${accentColor}4D` }}
                  >
                    Pure Silk
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
            className="lg:col-span-7 space-y-6 lg:pl-6"
          >
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border text-xs font-mono uppercase tracking-widest shadow-2xs"
              style={{
                backgroundColor: '#451523B3',
                borderColor: `${accentColor}4D`,
                color: accentColor,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
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
              <div className="p-3 rounded-lg bg-[#381222]/80 border border-[#C5A46D]/20">
                <div className="text-xs font-mono text-[#C5A46D]">Master Looms</div>
                <div className="text-xs text-[#F6EBD8] mt-0.5">Temple & Ghat Weaves</div>
              </div>
              <div className="p-3 rounded-lg bg-[#381222]/80 border border-[#C5A46D]/20">
                <div className="text-xs font-mono text-[#C5A46D]">Zari Artistry</div>
                <div className="text-xs text-[#F6EBD8] mt-0.5">Classic Gold Thread</div>
              </div>
              <div className="p-3 rounded-lg bg-[#381222]/80 border border-[#C5A46D]/20">
                <div className="text-xs font-mono text-[#C5A46D]">Authenticity</div>
                <div className="text-xs text-[#F6EBD8] mt-0.5">Catalogue Verified</div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4">
              <Link
                to="/sarees/products"
                className="px-6 py-3.5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] font-medium text-xs uppercase tracking-wider hover:bg-[#d9bb85] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Explore Sarees</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <CallToOrderAssistance
                variant="hero"
                className="rounded-xl border-[#C5A46D]/40 text-[#F6EBD8] bg-[#451523]/80 hover:bg-[#581c2d]"
              />

              <a
                href="#collections"
                className="px-5 py-3.5 rounded-xl bg-[#451523] text-[#F6EBD8] border border-[#C5A46D]/30 font-medium text-xs uppercase tracking-wider hover:bg-[#581c2d] hover:border-[#C5A46D] transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#C5A46D]" />
                <span>View Collections</span>
              </a>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
