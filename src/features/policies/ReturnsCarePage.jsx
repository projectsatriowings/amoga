import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { BackButton } from '../../components/ui/BackButton';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Truck,
  FileText,
  Clock,
  Camera,
  HelpCircle,
  PhoneCall,
  Scale,
} from 'lucide-react';

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
            <span className="text-[#292820] font-semibold">Returns & Customer Care</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#722F37]/10 border border-[#722F37]/20 text-[#722F37] text-xs font-mono font-semibold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Fair Commerce & Consumer Protection Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1A1817]">
            Return, Replacement & Product Care Policy
          </h1>
          <p className="text-sm sm:text-base text-[#656056] leading-relaxed">
            At Amoga, every silk weave, silver ornament, botanical tea, and stone-ground culinary mix is crafted and packed with meticulous dedication. If your order arrives damaged or incorrectly delivered, our transparent return and replacement protocols ensure swift, hassle-free resolution.
          </p>
        </div>

        {/* Statutory Rights Notice Banner */}
        <div className="p-5 rounded-2xl bg-white border border-[#D5CEC2] shadow-sm mb-10 flex items-start gap-4">
          <Scale className="w-5 h-5 text-[#722F37] shrink-0 mt-0.5" />
          <div className="text-xs text-[#4A423B] space-y-1">
            <h2 className="font-semibold text-sm text-[#1A1817]">
              Statutory Consumer Rights Assurance
            </h2>
            <p className="leading-relaxed">
              In accordance with the <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, no term in this policy seeks to exclude, limit, or waive your non-excludable statutory rights. You are entitled to a full replacement or refund for products that arrive defective, damaged in transit, deficient, spurious, or materially different from the described catalogue listing.
            </p>
          </div>
        </div>

        {/* Category Eligibility Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Heritage Sarees & Sterling Silver */}
          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/10 text-[#722F37] text-xs font-mono font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sarees & Sterling Silver</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              7-Day Delivery Return & Exchange
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Heritage handloom sarees and solid 925 sterling silver jewelry are eligible for return or exchange within <strong>7 days of delivery</strong>. Items must be in their unworn, unwashed, unaltered condition with original craft tags, security seal, and luxury presentation box intact.
            </p>
            <ul className="space-y-2.5 text-xs text-[#656056] pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>Complimentary insured reverse pickup scheduled from your delivery address</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>Choice of direct product replacement or 100% refund to original payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>Inspection completed within 24 to 48 hours of warehouse receipt</span>
              </li>
            </ul>
          </div>

          {/* Wholesome Pantry & Wellness Teas */}
          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3F7B43]/10 text-[#3F7B43] text-xs font-mono font-semibold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Food & Botanical Teas (FSSAI Regulated)</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#F8F6F0] px-2.5 py-1 rounded-lg border border-[#3F7B43]/20 shadow-2xs">
                <img
                  src="https://upload.wikimedia.org/wikipedia/en/e/e2/FSSAI_logo.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/fssai-logo.png';
                  }}
                  alt="FSSAI Logo"
                  className="h-4 w-auto object-contain"
                  loading="lazy"
                />
                <span className="font-mono text-xs font-bold text-[#172B1C]">Lic. No. 22425540000677</span>
              </div>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              Hygiene & Transit Damage Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Under Food Safety and Standards Authority of India (FSSAI) hygiene regulations, consumable pantry mixes, spices, and whole-leaf botanical teas cannot be accepted for routine return once opened. However, <strong>if packaging is punctured, torn, leaking, or damaged during transit</strong>, we guarantee immediate replacement or full refund.
            </p>
            <ul className="space-y-2.5 text-xs text-[#656056] pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>Report damaged food parcels within <strong>48 hours of delivery</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>Priority expedited re-dispatch within 24 hours of claim verification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7B43] shrink-0 mt-0.5" />
                <span>No requirement to physically return compromised food packages if unsafe</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5-Step Reporting Workflow */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E0D5] shadow-sm mb-12 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#722F37] font-semibold">
              Step-by-Step Protocol
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              How to Request a Return or Replacement
            </h2>
            <p className="text-xs text-[#656056]">
              You can initiate a return seamlessly directly from your customer account or through our customer concierge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#722F37] text-white flex items-center justify-center font-mono font-bold text-xs">
                1
              </div>
              <h3 className="font-semibold text-xs text-[#1A1817]">Access My Orders</h3>
              <p className="text-[11px] text-[#656056] leading-relaxed">
                Log in and navigate to <Link to="/account?tab=orders" className="text-[#722F37] underline font-medium">My Orders</Link>. Locate your delivered order.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#722F37] text-white flex items-center justify-center font-mono font-bold text-xs">
                2
              </div>
              <h3 className="font-semibold text-xs text-[#1A1817]">Select Items</h3>
              <p className="text-[11px] text-[#656056] leading-relaxed">
                Click <strong>"Request Return"</strong> and select the affected product(s) along with the quantity.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#722F37] text-white flex items-center justify-center font-mono font-bold text-xs">
                3
              </div>
              <h3 className="font-semibold text-xs text-[#1A1817]">Specify Reason</h3>
              <p className="text-[11px] text-[#656056] leading-relaxed">
                Select Damaged in Transit, Incorrect Item Delivered, or Broken Transit Seal, and describe the issue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#722F37] text-white flex items-center justify-center font-mono font-bold text-xs">
                4
              </div>
              <h3 className="font-semibold text-xs text-[#1A1817]">Attach Evidence</h3>
              <p className="text-[11px] text-[#656056] leading-relaxed">
                Upload clear photos of the defect and outer label. An unboxing video is welcome but <strong>never mandatory</strong> for genuine claims.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#722F37] text-white flex items-center justify-center font-mono font-bold text-xs">
                5
              </div>
              <h3 className="font-semibold text-xs text-[#1A1817]">Track Resolution</h3>
              <p className="text-[11px] text-[#656056] leading-relaxed">
                Receive an authoritative reference (e.g. <span className="font-mono text-[#722F37]">AMOGA-RET-2026-XXXXX</span>) to track pickup, inspection & refund status.
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Submission & Review Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#722F37]">
              <Camera className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                Evidence Guidelines & Video Policy
              </h3>
            </div>
            <p className="text-xs text-[#656056] leading-relaxed">
              To expedite prompt review, we request:
            </p>
            <ul className="text-xs text-[#4A423B] space-y-2 list-disc pl-4 leading-relaxed">
              <li>High-resolution photographs displaying the outer shipping label, packaging condition, and product defect.</li>
              <li>An unboxing video showing opening of the parcel from sealed condition is highly appreciated and speeds up immediate replacement dispatch.</li>
              <li><strong>Fairness Guarantee:</strong> Amoga will <strong>never</strong> automatically reject an otherwise authentic claim solely because an unboxing video was not recorded. We examine all provided evidence, courier tracking weights, and parcel transit telemetry fairly.</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#722F37]">
              <Clock className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                Refund & Replacement Timelines
              </h3>
            </div>
            <p className="text-xs text-[#656056] leading-relaxed">
              Once your return request is approved:
            </p>
            <ul className="text-xs text-[#4A423B] space-y-2 list-disc pl-4 leading-relaxed">
              <li><strong>Free Reverse Pickup:</strong> Attempted within 24 to 72 hours of approval in all serviceable PIN codes across India.</li>
              <li><strong>Replacement Dispatch:</strong> Shipped within 24 hours of claim approval, accompanied by a fresh India Post tracking number.</li>
              <li><strong>Refund Processing:</strong> Approved refunds are credited directly back to the original source (UPI, Card, Netbanking) within <strong>5 to 7 working days</strong> from verification. Cash-on-delivery orders are refunded via direct NEFT/IMPS bank transfer upon providing account details.</li>
            </ul>
          </div>
        </div>

        {/* Product Care Instructions Guide */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E5E0D5] shadow-sm mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#722F37] font-semibold">
              Longevity & Craft Preservation
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817] mt-1">
              Atelier Product Care & Maintenance Guides
            </h2>
          </div>

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

        {/* Customer Concierge & Support Card */}
        <div className="p-8 rounded-3xl bg-[#722F37]/5 border border-[#722F37]/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
              Need Assistance with a Delivery or Return Claim?
            </h3>
            <p className="text-xs text-[#656056]">
              Our dedicated Customer Support Concierge is available Monday to Saturday, 9:00 AM – 7:00 PM IST.
            </p>
            <p className="text-[11px] font-mono text-[#722F37] pt-1">
              Helpline: +91 9940018593 • +91 8056700646 • Email: amogastores05@gmail.com
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="mailto:amogastores05@gmail.com?subject=Amoga%20Return%20or%20Damage%20Claim"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#722F37] text-white text-xs font-semibold hover:bg-[#5E2229] transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Support</span>
            </a>
            <Link
              to="/account?tab=orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#D5CEC2] text-xs font-semibold text-[#4A423B] hover:bg-[#F8F6F0] transition-colors shadow-xs"
            >
              <span>My Orders</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
