import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import sareeModelHero from '../../../assets/images/saree-model-hero.jpg';
import { Container } from '../../../components/ui/Container';

export function SareeHero() {
  return (
    <section className="relative overflow-hidden bg-[#2C0E1A] text-[#F6EBD8] border-b border-[#C5A46D]/20">
      {/* Subtle Gold Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A46D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#451523]/40 rounded-full blur-2xl pointer-events-none" />

      <Container>
        <div className="py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Decorative & Model Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Left Vertical Ribbon */}
            <div className="hidden sm:flex flex-col items-center gap-3 absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#C5A46D]/70 select-none">
              <span className="rotate-180 [writing-mode:vertical-rl]">Tradition in Every Thread</span>
              <span className="w-1.5 h-1.5 rotate-45 border border-[#C5A46D]" />
            </div>

            {/* Main Portrait Card Frame */}
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-2 border-[#C5A46D]/30 shadow-2xl bg-[#381222]">
              <img
                src={sareeModelHero}
                alt="Amoga Heritage Kanchipuram Silk Saree Drape"
                className="w-full h-auto aspect-[3/4] object-cover object-top"
              />

              {/* Bottom Subtle Caption Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#2C0E1A] via-[#2C0E1A]/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A46D]">
                      Temple Heritage
                    </div>
                    <div className="font-serif text-sm text-[#F6EBD8]">
                      Authentic Kanchipuram Drape
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#C5A46D] px-2 py-0.5 rounded bg-[#451523] border border-[#C5A46D]/30">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#451523] border border-[#C5A46D]/30 text-[#C5A46D] text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Heritage Collection &bull; Timeless Elegance</span>
            </div>

            {/* Editorial Title */}
            <div className="space-y-2">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#F6EBD8] leading-[1.1] tracking-tight">
                The Heritage <br />
                <span className="italic text-[#C5A46D]">in Every Drape</span>
              </h1>
            </div>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-[#D4C2A7] leading-relaxed max-w-xl font-sans">
              Discover Amoga's curated collection of traditional silk sarees, crafted with timeless artistry, royal heritage, and unmatched elegance. From auspicious temple borders to shimmering festive weaves.
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
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/sarees/products"
                className="px-6 py-3.5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] font-medium text-xs uppercase tracking-wider hover:bg-[#d9bb85] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Explore Sarees</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#collections"
                className="px-6 py-3.5 rounded-xl bg-[#451523] text-[#F6EBD8] border border-[#C5A46D]/30 font-medium text-xs uppercase tracking-wider hover:bg-[#581c2d] hover:border-[#C5A46D] transition-all flex items-center gap-2"
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
