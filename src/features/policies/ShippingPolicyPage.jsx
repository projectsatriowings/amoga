import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { BackButton } from '../../components/ui/BackButton';
import { Truck, ShieldCheck, Clock, MapPin, PackageCheck, HelpCircle } from 'lucide-react';

export function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#292820] pt-6 pb-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <BackButton fallbackTo="/" label="Back to Atelier" />
          <nav className="text-xs font-mono text-[#8C8377] flex items-center gap-2">
            <Link to="/" className="hover:text-[#722F37]">Home</Link>
            <span>/</span>
            <span className="text-[#292820] font-semibold">Shipping Policy</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#722F37]/10 border border-[#722F37]/20 text-[#722F37] text-xs font-mono font-semibold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5" />
            <span>Pan-India Logistics & Delivery Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1A1817]">
            Shipping & Dispatch Policy
          </h1>
          <p className="text-sm sm:text-base text-[#656056] leading-relaxed">
            At Amoga, each order is prepared and handled with artisanal care. Review our dispatch schedules, courier partners, complimentary delivery thresholds, and delivery tracking protocols.
          </p>
        </div>

        {/* Grid of Key Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Complimentary Delivery</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              All orders across all four storefronts with a net value of ₹2,000 or above qualify for complimentary standard shipping across India.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#B88E38]/10 text-[#8C6320] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Prompt Atelier Dispatch</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              Standard pantry, botanical tea, and ready-to-ship heritage weaves are dispatched within 24 to 48 business hours from our fulfillment hub.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Tamper-Evident Packaging</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              Fragile sterling silver and delicate handloom silks are packaged in multi-layer archival protective cases to prevent in-transit moisture or physical damage.
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="max-w-4xl space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E5E0D5] shadow-sm">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#722F37]" />
              <span>1. Geographic Coverage & Serviceable PIN Codes</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Amoga ships to over 19,000 PIN codes across all Indian states and Union Territories through tier-1 logistics partners (Blue Dart, Delhivery, DTDC, and India Post Speed Post). During checkout, entering your 6-digit postal code validates courier serviceability and estimated delivery turnaround.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#722F37]" />
              <span>2. Estimated Delivery Timeframes</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#E5E0D5] rounded-xl overflow-hidden">
                <thead className="bg-[#F8F6F0] text-[#1A1817] font-semibold border-b border-[#E5E0D5]">
                  <tr>
                    <th className="p-3">Destination Region</th>
                    <th className="p-3">Typical Transit Window</th>
                    <th className="p-3">Carrier Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5] text-[#4A423B]">
                  <tr>
                    <td className="p-3 font-medium">South India Metros (Chennai, Bengaluru, Hyderabad)</td>
                    <td className="p-3">2 to 3 Business Days</td>
                    <td className="p-3">Express Surface / Air</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Rest of India Metros (Mumbai, Delhi NCR, Kolkata, Pune)</td>
                    <td className="p-3">3 to 5 Business Days</td>
                    <td className="p-3">Air Cargo / Express Surface</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Tier-2, Tier-3 Cities & Regional Districts</td>
                    <td className="p-3">4 to 7 Business Days</td>
                    <td className="p-3">Standard Registered Courier</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Special Destinations (North-East, J&K, Islands)</td>
                    <td className="p-3">6 to 10 Business Days</td>
                    <td className="p-3">India Post Speed Post / Air Cargo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#722F37]" />
              <span>3. Shipping Charges & Rates</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Standard orders below ₹2,000 carry a nominal flat fulfillment fee of ₹99 to cover secure protective packaging and regional freight. Orders with net payable value of ₹2,000 or greater receive automatic complimentary shipping applied at checkout.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <PackageCheck className="w-5 h-5 text-[#722F37]" />
              <span>4. Real-Time Consignment Tracking</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              As soon as your package is dispatched from our atelier, an authoritative consignment tracking number and direct tracking link are generated. You can track your order at any time using our dedicated <Link to="/track" className="text-[#722F37] font-semibold underline">Order Tracking Page</Link> with your unique order reference.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-[#722F37]" />
              <span>5. Dispatch Inquiries & Support</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              If your consignment is delayed beyond the expected transit window or if you need to update delivery instructions before dispatch, contact our concierge desk at <a href="mailto:support@amoga.com" className="text-[#722F37] font-semibold underline">support@amoga.com</a> or telephone <a href="tel:+919940018593" className="text-[#722F37] font-semibold underline">+91 99400 18593</a> (Mon–Sat, 9:00 AM – 7:00 PM IST).
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
