import React from 'react';
import { Truck, ShieldCheck, Leaf, PhoneCall } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export function FoodBenefitsStrip() {
  const benefits = [
    {
      icon: <Leaf className="w-5 h-5 text-[#287A25]" />,
      title: 'Thoughtfully Selected',
      description: 'Pure, authentic farm-grown botanicals and pantry staples.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#287A25]" />,
      title: 'Information You Can Trust',
      description: 'Accurate recipe formulations and uncompromised ingredients.',
    },
    {
      icon: <Truck className="w-5 h-5 text-[#287A25]" />,
      title: 'Free Shipping Over ₹999',
      description: 'Carefully packaged and delivered straight to your doorstep.',
    },
    {
      icon: <PhoneCall className="w-5 h-5 text-[#287A25]" />,
      title: 'Direct Customer Care',
      description: 'Dedicated phone order and culinary assistance: +91 9940018593.',
    },
  ];

  return (
    <section className="bg-[#EAE6D9]/40 border-b border-[#172B1C]/8 py-8 sm:py-10">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[#172B1C]/10 shadow-sm shrink-0">
                {b.icon}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-[#172B1C] tracking-wide">
                  {b.title}
                </h3>
                <p className="text-xs text-[#557C36] leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
