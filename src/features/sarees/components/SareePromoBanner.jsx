import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight, Phone } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export function SareePromoBanner() {
  return (
    <section className="py-12 bg-gradient-to-r from-[#451523] via-[#381222] to-[#451523] text-[#F6EBD8] border-b border-[#C5A46D]/20">
      <Container>
        <div className="rounded-2xl p-6 sm:p-10 border border-[#C5A46D]/30 bg-[#2C0E1A]/60 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-[#C5A46D]">
              <Crown className="w-3.5 h-3.5" />
              <span>Amoga Bridal & Trousseau Curation</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#F6EBD8]">
              Private Consultations for Ceremonial Weaves
            </h3>
            <p className="text-xs sm:text-sm text-[#D4C2A7] font-sans">
              Connect with our silk specialists for bridal trousseau selections, customized color matching, and handloom provenance verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              to="/sarees/products?category=wedding"
              className="px-5 py-2.5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] text-xs font-medium uppercase tracking-wider hover:bg-[#d9bb85] transition-colors flex items-center gap-2 shadow-md"
            >
              <span>Explore Wedding Silks</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="tel:+919940018593"
              className="px-5 py-2.5 rounded-xl bg-[#381222] text-[#F6EBD8] border border-[#C5A46D]/30 text-xs font-medium uppercase tracking-wider hover:bg-[#451523] transition-colors flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>Call Concierge</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
