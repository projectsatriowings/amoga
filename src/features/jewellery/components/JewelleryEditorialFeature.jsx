import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Compass, Sparkles } from 'lucide-react';
import modelHero from '../../../assets/images/jewellery-model-hero.jpg';
import necklaceHero from '../../../assets/images/jewellery-lumiere-necklace.jpg';
import { Container } from '../../../components/ui/Container';

export function JewelleryEditorialFeature() {
  return (
    <section className="py-16 sm:py-24 bg-[#242326] text-[#F7F3EB] border-b border-[#B9B8B5]/15 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Primary Model Portrait Inset */}
              <div className="col-span-8 rounded-2xl overflow-hidden border border-[#B9B8B5]/25 shadow-2xl bg-[#343238]">
                <img
                  src={modelHero}
                  alt="Editorial silver teardrop necklace drape"
                  className="w-full aspect-[4/5] object-cover"
                  loading="lazy"
                />
                <div className="p-3 bg-[#343238] border-t border-[#B9B8B5]/15 text-[11px] font-mono text-[#B9B8B5]">
                  Fig 1. &bull; Lumière Teardrop Silhouette
                </div>
              </div>

              {/* Secondary Detail Inset */}
              <div className="col-span-4 space-y-4">
                <div className="rounded-xl overflow-hidden border border-[#B9B8B5]/25 shadow-lg bg-[#343238]">
                  <img
                    src={necklaceHero}
                    alt="Pendant setting detail"
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="p-2 bg-[#343238] border-t border-[#B9B8B5]/15 text-[10px] font-mono text-[#B9B8B5]/80">
                    Solitary Zircon
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#343238]/80 border border-[#B9B8B5]/20 space-y-1">
                  <div className="text-[10px] font-mono text-[#B9B8B5] uppercase">Material Base</div>
                  <div className="text-xs font-serif text-[#F7F3EB]">Solid 925 Sterling</div>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="lg:col-span-6 space-y-6 lg:pl-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
              <span>Editorial Design Notes</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-[#F7F3EB] leading-tight">
              Anatomy of Silver: <br />
              <span className="italic text-[#B9B8B5]">Form, Finish & Light</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#B9B8B5] leading-relaxed">
              Every piece in the Amoga Sterling Silver collection is shaped for structural balance, tactile comfort, and subtle reflectivity. From the clean lines of linear bar pendants to the ergonomic curvature of our signature bands, silver is treated as a modern medium for quiet self-expression.
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#343238] text-[#B9B8B5] border border-[#B9B8B5]/20 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#F7F3EB]">Restrained Ergonomics</h4>
                  <p className="text-xs text-[#B9B8B5] mt-0.5">
                    Lightweight engineering with comfort-fit contours designed for seamless all-day wear.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#343238] text-[#B9B8B5] border border-[#B9B8B5]/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#F7F3EB]">Protective Surface Sealing</h4>
                  <p className="text-xs text-[#B9B8B5] mt-0.5">
                    Rhodium and anti-tarnish protective sealing that preserves the luminous metallic luster over time.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/jewellery/products"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#B9B8B5] hover:text-white transition-colors border-b border-[#B9B8B5]/40 pb-1"
              >
                <span>Browse Complete Jewellery Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
