import React from 'react';
import { Phone, PhoneCall, Mail, Clock } from 'lucide-react';

export const AMOGA_CONTACT_DETAILS = {
  phone1: '+91 9940018593',
  phone1Raw: '+919940018593',
  phone2: '+91 8056700646',
  phone2Raw: '+918056700646',
  email: 'orders@amoga.com',
  hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
};

/**
 * CallToOrderAssistance Component
 * 
 * Reusable component providing dedicated call-to-order and telephone concierge assistance
 * across designated website placements:
 * 1. Homepage & storefront hero secondary CTAs
 * 2. Collection listing assistance banners
 * 3. Product detail page "Prefer to order by phone?" blocks
 * 4. Footers and contact sections
 */
export function CallToOrderAssistance({
  variant = 'hero',
  _collectionId = 'food',
  className = '',
  customPhone,
  customEmail,
  customHours,
}) {
  const phone = customPhone || AMOGA_CONTACT_DETAILS.phone1;
  const phoneRaw = (customPhone || AMOGA_CONTACT_DETAILS.phone1).replace(/[^0-9+]/g, '');
  const email = customEmail || AMOGA_CONTACT_DETAILS.email;
  const hours = customHours || AMOGA_CONTACT_DETAILS.hours;

  // 1. Hero Secondary CTA (Beside primary shopping CTA, keeps primary shopping CTA visually dominant)
  if (variant === 'hero') {
    return (
      <a
        href={`tel:${phoneRaw}`}
        className={`inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full border text-xs font-mono font-medium tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm ${className}`}
        title={`Call to Order: ${phone} (${hours})`}
      >
        <Phone className="w-3.5 h-3.5 text-[#C5A46D] shrink-0" />
        <span>Call to Order</span>
      </a>
    );
  }

  // 2. Collection Listing Banner (Compact assistance near collection introduction or listing controls)
  if (variant === 'banner') {
    return (
      <div
        className={`p-3 sm:p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
            <PhoneCall className="w-3.5 h-3.5 text-[#8C6320]" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-inherit">Prefer ordering by telephone?</span>
            <span className="hidden md:inline text-inherit opacity-75 ml-1">
              Connect with our master atelier team for immediate placement.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <a
            href={`tel:${phoneRaw}`}
            className="inline-flex items-center gap-1.5 font-bold hover:underline"
            title={`Call ${phone}`}
          >
            <Phone className="w-3 h-3 text-[#C5A46D]" />
            <span>{phone}</span>
          </a>
          <span className="opacity-40">&bull;</span>
          <span className="opacity-75 text-[11px] hidden sm:inline">{hours}</span>
        </div>
      </div>
    );
  }

  // 3. Product Detail Page (Near Add to Cart button)
  if (variant === 'pdp') {
    return (
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-2 bg-[#FAF8F5]/80 border-[#E5E0D5] text-[#2C0E1A] ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#1F0811]">
            <PhoneCall className="w-4 h-4 text-[#8C6320]" />
            <span>Prefer to order by phone?</span>
          </div>
          <span className="text-[10px] font-mono text-[#8C6320] uppercase font-semibold">
            Concierge Desk
          </span>
        </div>

        <p className="text-[11px] text-[#5A524A] leading-relaxed">
          Our specialists can assist you with live stock verification, customized sizing, and immediate telephone checkout.
        </p>

        <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono">
          <a
            href={`tel:${phoneRaw}`}
            className="inline-flex items-center gap-1 font-bold text-[#722F37] hover:underline"
          >
            <Phone className="w-3 h-3 text-[#8C6320]" />
            <span>{phone}</span>
          </a>
          <span className="text-black/20">&bull;</span>
          <a
            href={`mailto:${email}?subject=Order%20Assistance`}
            className="inline-flex items-center gap-1 text-[#5A524A] hover:text-[#1F0811] hover:underline"
          >
            <Mail className="w-3 h-3 text-[#8C6320]" />
            <span>{email}</span>
          </a>
          <span className="text-black/20">&bull;</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#7A7167]">
            <Clock className="w-3 h-3 text-[#8C6320]" />
            <span>{hours}</span>
          </span>
        </div>
      </div>
    );
  }

  // 4. Footer Support Card (Standard consistent contact section)
  return (
    <div className={`p-4 rounded-xl border space-y-2 text-xs ${className}`}>
      <div className="flex items-center gap-2 font-semibold">
        <PhoneCall className="w-4 h-4" />
        <span>Customer Support & Orders Desk</span>
      </div>
      <div className="space-y-1 font-mono">
        <div>
          <span className="opacity-70">Phone: </span>
          <a href={`tel:${phoneRaw}`} className="font-bold hover:underline">
            {phone}
          </a>
          {AMOGA_CONTACT_DETAILS.phone2 && (
            <>
              <span className="opacity-40"> &bull; </span>
              <a href={`tel:${AMOGA_CONTACT_DETAILS.phone2Raw}`} className="hover:underline">
                {AMOGA_CONTACT_DETAILS.phone2}
              </a>
            </>
          )}
        </div>
        <div>
          <span className="opacity-70">Email: </span>
          <a href={`mailto:${email}`} className="hover:underline">
            {email}
          </a>
        </div>
        <div className="text-[11px] opacity-75">
          <Clock className="w-3 h-3 inline mr-1" />
          <span>{hours}</span>
        </div>
      </div>
    </div>
  );
}
