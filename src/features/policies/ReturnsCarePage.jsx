import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { BackButton } from '../../components/ui/BackButton';
import { RotateCcw, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

export function ReturnsCarePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#292820] pt-6 pb-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <BackButton fallbackTo="/" label="Back to Home" />
          <nav className="text-xs font-mono text-[#8C8377] flex items-center gap-2">
            <Link to="/" className="hover:text-[#722F37]">Home</Link>
            <span>/</span>
            <span className="text-[#292820] font-semibold">Returns and Product Care</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#722F37]/10 border border-[#722F37]/20 text-[#722F37] text-xs font-mono font-semibold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Customer Protection & Product Care</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1A1817]">
            Returns and Product Care
          </h1>
          <p className="text-sm sm:text-base text-[#656056] leading-relaxed">
            We hold ourselves to the highest standards of authentic quality. Read our return policies, transit defect resolution protocols, and maintenance guides for handloom silks, sterling silver jewellery, and pantry goods.
          </p>
        </div>

        {/* Return & Exchange Policy by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Heritage Sarees & Sterling Silver */}
          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/10 text-[#722F37] text-xs font-mono font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sarees & Silver Jewellery</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              7-Day Return & Exchange Window
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Traditional sarees and 925 sterling silver jewellery may be requested for exchange or return within <strong>7 days</strong> of delivery, provided items remain in their original unworn condition with tags intact.
            </p>
            <ul className="space-y-2 text-xs text-[#656056] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0" />
                <span>Free reverse pickup from your delivery address</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0" />
                <span>Full refund or replacement upon quality check</span>
              </li>
            </ul>
          </div>

          {/* Wholesome Pantry & Wellness Teas */}
          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3F7B43]/10 text-[#3F7B43] text-xs font-mono font-semibold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Food & Botanical Teas</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              Hygiene & Transit Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              For consumer food safety and hygiene regulations, unopened and opened edible pantry mixes, botanical teas, and spice podis cannot be returned once delivered. However, if a seal is compromised or damaged during transit, we provide an immediate no-questions-asked replacement or refund.
            </p>
            <ul className="space-y-2 text-xs text-[#656056] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0" />
                <span>100% replacement guarantee for damaged transit seals</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0" />
                <span>Expedited re-dispatch within 24 hours of notification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Product Care Instructions Guide */}
        <div className="max-w-4xl space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E5E0D5] shadow-sm mb-12">
          <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
            Product Care & Maintenance Guides
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2 p-5 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5]">
              <h3 className="font-serif text-base font-semibold text-[#1A1817]">Traditional Silk Sarees</h3>
              <ul className="text-xs text-[#656056] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Dry clean only by specialized saree cleaners.</li>
                <li>Store folded inside breathable unbleached cotton muslin cloth.</li>
                <li>Periodically air the saree in indirect shade to prevent zari tarnish.</li>
                <li>Avoid spraying perfume, deodorants, or water mist directly on zari work.</li>
              </ul>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5]">
              <h3 className="font-serif text-base font-semibold text-[#1A1817]">925 Sterling Silver Jewellery</h3>
              <ul className="text-xs text-[#656056] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Store in individual zip-lock bags or lined velvet pouches away from moisture.</li>
                <li>Wipe gently with the microfiber polishing cloth provided after wear.</li>
                <li>Keep away from direct chlorinated water, sweat, and household chemicals.</li>
                <li>Clean with mild soapy warm water using an ultra-soft brush when needed.</li>
              </ul>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5]">
              <h3 className="font-serif text-base font-semibold text-[#1A1817]">Traditional Food & Millet Mixes</h3>
              <ul className="text-xs text-[#656056] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Transfer contents to an airtight stainless steel or glass jar after opening.</li>
                <li>Store in a cool, dry pantry shelf away from direct kitchen steam.</li>
                <li>Always use a clean, thoroughly dry spoon to avoid moisture clumping.</li>
                <li>Best consumed within 6 months of packaging date for maximum flavor aroma.</li>
              </ul>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5]">
              <h3 className="font-serif text-base font-semibold text-[#1A1817]">Herbal Teas & Infusions</h3>
              <ul className="text-xs text-[#656056] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Reseal foil pouch tightly or store in opaque airtight tea canisters.</li>
                <li>Protect whole flower blossoms (such as Blue Pea & Hibiscus) from sunlight.</li>
                <li>Brew with freshly boiled water (90°C–95°C) to release delicate polyphenols.</li>
                <li>Do not refrigerate open dry loose leaf tea as condensation spoils flavor.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Return Customer Support Contact */}
        <div className="max-w-4xl p-6 sm:p-8 rounded-2xl bg-[#722F37]/5 border border-[#722F37]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
              Need to initiate a return or exchange?
            </h3>
            <p className="text-xs text-[#656056]">
              Contact our customer support team with your order number and delivery details.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="mailto:support@amoga.com?subject=Return%20Request"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#722F37] text-white text-xs font-semibold hover:bg-[#5E2229] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Customer Support</span>
            </a>
            <Link
              to="/account?tab=orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#D5CEC2] text-xs font-semibold text-[#4A423B] hover:bg-[#F8F6F0] transition-colors"
            >
              <span>My Orders</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
