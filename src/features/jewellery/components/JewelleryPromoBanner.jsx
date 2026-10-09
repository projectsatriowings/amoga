import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Phone } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export function JewelleryPromoBanner() {
  return (
    <section className="py-12 bg-gradient-to-r from-[#242326] via-[#343238] to-[#242326] text-[#F7F3EB] border-b border-[#B9B8B5]/15">
      <Container>
        <div className="rounded-2xl p-6 sm:p-10 border border-[#B9B8B5]/20 bg-[#242326]/70 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-[#B9B8B5]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
              <span>Amoga Silver Concierge</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#F7F3EB]">
              Personalized Sizing & Gifting Consultations
            </h3>
            <p className="text-xs sm:text-sm text-[#B9B8B5] font-sans">
              Connect with our silver specialists for ring size recommendations, chain length advice, and bespoke packaging for memorable milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              to="/jewellery/products?category=rings"
              className="px-5 py-2.5 rounded-xl bg-[#B9B8B5] text-[#242326] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-2 shadow-md"
            >
              <span>Explore Silver Rings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="tel:+919940018593"
              className="px-5 py-2.5 rounded-xl bg-[#343238] text-[#F7F3EB] border border-[#B9B8B5]/25 text-xs font-medium uppercase tracking-wider hover:bg-[#3E3C44] transition-colors flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-[#B9B8B5]" />
              <span>Call Concierge</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
