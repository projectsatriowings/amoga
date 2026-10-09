import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Feather, Compass, Award } from 'lucide-react';
import sareeMacroZari from '../../../assets/images/saree-macro-zari.jpg';
import sareeBanarasi from '../../../assets/images/saree-banarasi.jpg';
import { Container } from '../../../components/ui/Container';

export function EditorialTextileFeature() {
  return (
    <section className="py-16 sm:py-24 bg-[#2C0E1A] text-[#F6EBD8] border-b border-[#C5A46D]/15 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Showcase (Images) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Primary Macro Shot */}
              <div className="col-span-8 rounded-2xl overflow-hidden border border-[#C5A46D]/30 shadow-2xl bg-[#381222]">
                <img
                  src={sareeMacroZari}
                  alt="Detailed handloom gold zari peacock embroidery on burgundy silk"
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="p-3 bg-[#381222] border-t border-[#C5A46D]/20 text-[11px] font-mono text-[#C5A46D]">
                  Fig 1. &bull; Gold Zari Peacock Motif Detail
                </div>
              </div>

              {/* Secondary Texture Inset */}
              <div className="col-span-4 space-y-4">
                <div className="rounded-xl overflow-hidden border border-[#C5A46D]/30 shadow-lg bg-[#381222]">
                  <img
                    src={sareeBanarasi}
                    alt="Banarasi floral brocade weft texture"
                    className="w-full aspect-[3/4] object-cover"
                    loading="lazy"
                  />
                  <div className="p-2 bg-[#381222] border-t border-[#C5A46D]/20 text-[10px] font-mono text-[#D4C2A7]">
                    Kadhwa Jaal
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#451523]/80 border border-[#C5A46D]/25 space-y-1">
                  <div className="text-[10px] font-mono text-[#C5A46D] uppercase">Specification</div>
                  <div className="text-xs font-serif text-[#F6EBD8]">6.3 Metre Drape with Blouse</div>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="lg:col-span-6 space-y-6 lg:pl-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
              <Feather className="w-3.5 h-3.5" />
              <span>Editorial Textile Notes</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-[#F6EBD8] leading-tight">
              Anatomy of the Weave: <br />
              <span className="italic text-[#C5A46D]">Zari, Texture & Grace</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#D4C2A7] leading-relaxed">
              Every saree in the Amoga collection is selected for structural integrity, warp-and-weft balance, and traditional design language. From the interlocking borders of temple weaves to the delicate shimmer of tissue silk, each textile balances weight, drape fluidity, and tactile richness.
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#381222] text-[#C5A46D] border border-[#C5A46D]/20 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#F6EBD8]">Warp & Weft Balance</h4>
                  <p className="text-xs text-[#D4C2A7] mt-0.5">
                    High-density yarn counts ensure enduring form and natural body that holds pleats effortlessly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#381222] text-[#C5A46D] border border-[#C5A46D]/20 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#F6EBD8]">Authentic Zari Workmanship</h4>
                  <p className="text-xs text-[#D4C2A7] mt-0.5">
                    Intricate border and pallu motifs created with electroplated metallic threads and traditional jaal patterns.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/sarees/products"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C5A46D] hover:text-[#d9bb85] transition-colors border-b border-[#C5A46D]/40 pb-1"
              >
                <span>Browse Complete Handloom Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
