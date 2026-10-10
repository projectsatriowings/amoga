import React from 'react';
import { Truck, ShieldCheck, Leaf, PhoneCall } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export function FoodBenefitsStrip() {
  const benefits = [
    {
      icon: <Leaf className="w-5 h-5 text-[#3F7B43]" />,
      title: 'Traditional Blends',
      description: 'Authentic soup mixes, wholesome millets, and regional rice podis.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#3F7B43]" />,
      title: 'Pure Pantry Goodness',
      description: 'Carefully chosen ingredients crafted for familiar everyday cooking.',
    },
    {
      icon: <Truck className="w-5 h-5 text-[#3F7B43]" />,
      title: 'Free Delivery Available',
      description: 'Carefully packaged and delivered directly to your kitchen.',
    },
    {
      icon: <PhoneCall className="w-5 h-5 text-[#3F7B43]" />,
      title: 'Dedicated Assistance',
      description: 'Phone order support and pantry guidance: +91 9940018593.',
    },
  ];

  return (
    <section className="bg-[#FFFFFF] border-b border-[#E5E0D5] py-8 sm:py-10">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#F8F6F0] border border-[#E5E0D5] shadow-2xs shrink-0">
                {b.icon}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#173B2A] tracking-wide">
                  {b.title}
                </h3>
                <p className="text-xs text-[#746F63] leading-relaxed font-sans">
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
