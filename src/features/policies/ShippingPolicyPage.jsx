import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { BackButton } from '../../components/ui/BackButton';
import { Truck, ShieldCheck, Clock, MapPin, PackageCheck, HelpCircle, Info } from 'lucide-react';
import { useShippingConfig } from '../../hooks/useShippingConfig';

export function ShippingPolicyPage() {
  const { freeShippingThreshold, shippingThresholdOperator, businessApprovalPending } = useShippingConfig();
  const operatorText = shippingThresholdOperator === 'GT' ? 'above' : 'of or above';
  const formattedThreshold = `₹${freeShippingThreshold.toLocaleString('en-IN')}`;
  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#292820] pt-6 pb-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <BackButton fallbackTo="/" label="Back to Home" />
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
            <span>Pan-India Delivery Information</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1A1817]">
            Shipping Policy
          </h1>
          <p className="text-sm sm:text-base text-[#656056] leading-relaxed">
            At Amoga, each order is prepared and handled with care. Review our dispatch schedules, courier partners, free delivery thresholds, and order tracking details below.
          </p>
        </div>

        {/* Grid of Key Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Free Delivery</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              All orders across all four storefronts with a total value {operatorText} {formattedThreshold} qualify for free delivery across India.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#B88E38]/10 text-[#8C6320] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Quick Dispatch</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              Wholesome pantry items, wellness teas, and in-stock sarees and jewellery are shipped within 24 to 48 hours.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1817]">Safe & Secure Packaging</h2>
            <p className="text-xs text-[#656056] leading-relaxed">
              Silver jewellery and silk sarees are packaged securely in protective multi-layer packaging to prevent any damage during transit.
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="max-w-4xl space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E5E0D5] shadow-sm">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#722F37]" />
              <span>1. Delivery Coverage & Serviceable PIN Codes</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Amoga delivers to over 19,000 PIN codes across all Indian states and Union Territories through trusted courier partners (Blue Dart, Delhivery, DTDC, and India Post Speed Post). During checkout, entering your 6-digit PIN code confirms delivery availability and expected delivery time.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#722F37]" />
              <span>2. Expected Delivery Time</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#E5E0D5] rounded-xl overflow-hidden">
                <thead className="bg-[#F8F6F0] text-[#1A1817] font-semibold border-b border-[#E5E0D5]">
                  <tr>
                    <th className="p-3">Destination Region</th>
                    <th className="p-3">Expected Delivery Time</th>
                    <th className="p-3">Courier Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5] text-[#4A423B]">
                  <tr>
                    <td className="p-3 font-medium">South India Metros (Chennai, Bengaluru, Hyderabad)</td>
                    <td className="p-3">2 to 3 Business Days</td>
                    <td className="p-3">Express Air / Surface</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Rest of India Metros (Mumbai, Delhi NCR, Kolkata, Pune)</td>
                    <td className="p-3">3 to 5 Business Days</td>
                    <td className="p-3">Express Air / Surface</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Tier-2, Tier-3 Cities & Towns</td>
                    <td className="p-3">4 to 7 Business Days</td>
                    <td className="p-3">Standard Courier</td>
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
              <span>3. Delivery Charges</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              Standard orders below {formattedThreshold} are calculated according to courier weight and piece brackets (or flat standard shipping). Orders {operatorText} {formattedThreshold} receive complimentary delivery applied automatically at checkout.
            </p>
            {businessApprovalPending && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Authoritative store shipping policy threshold: <strong>{formattedThreshold}</strong> ({shippingThresholdOperator === 'GT' ? 'Greater Than' : 'Greater Than or Equal'}). Business owner sign-off on final promotion threshold is pending review.
                </span>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <PackageCheck className="w-5 h-5 text-[#722F37]" />
              <span>4. Track Your Order</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              As soon as your package is shipped, a courier tracking number and direct tracking link are sent to you. You can track your order at any time using our <Link to="/track" className="text-[#722F37] font-semibold underline">Track Order</Link> page with your Amoga order number.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E5E0D5] pt-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1817] flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-[#722F37]" />
              <span>5. Delivery Help & Customer Support</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4A423B] leading-relaxed">
              If your delivery is delayed or if you need to update your delivery address before dispatch, contact our customer support team at <a href="mailto:support@amoga.com" className="text-[#722F37] font-semibold underline">support@amoga.com</a> or call us at <a href="tel:+919940018593" className="text-[#722F37] font-semibold underline">+91 99400 18593</a> (Mon–Sat, 9:00 AM – 7:00 PM IST).
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
