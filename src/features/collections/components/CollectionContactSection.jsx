import React from 'react';
import { PhoneCall, Mail, MapPin, Clock } from 'lucide-react';
import { CollectionContactForm } from './CollectionContactForm';
import { getCollectionTheme } from '../themeConfig';

export function CollectionContactSection({ collectionId = 'food', className = '' }) {
  const theme = getCollectionTheme(collectionId);
  const contact = theme?.contact || {};

  return (
    <section
      id="contact"
      className={`scroll-mt-28 py-12 sm:py-16 bg-[#F8F6F0] border-t border-[#E5E0D5] text-[#292820] transition-colors ${className}`}
      aria-labelledby="collection-contact-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 lg:mb-12">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] font-semibold block mb-2 text-[#3F7B43]">
            GET IN TOUCH
          </span>
          <h2
            id="collection-contact-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#173B2A]"
          >
            {contact.heading || 'Concierge & Client Care'}
          </h2>
          <p className="text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed text-[#292820]/75">
            {contact.subheading}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Official Contact Details & Provenance (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Card 1: Telephone Orders & Direct Assistance */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#173B2A]">
                    Telephone & WhatsApp Support
                  </h3>
                  <div className="text-[11px] flex items-center gap-1.5 opacity-75 mt-0.5 text-[#292820]">
                    <Clock className="w-3 h-3" />
                    <span>{contact.hours}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E0D5] space-y-2">
                <a
                  href={`tel:${contact.phone1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold text-[#173B2A] transition-colors hover:text-[#3F7B43]"
                >
                  <span>{contact.phone1}</span>
                  <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full bg-[#3F7B43]/10 text-[#3F7B43]">
                    Direct Call
                  </span>
                </a>
                <a
                  href={`tel:${contact.phone2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold text-[#173B2A] transition-colors hover:text-[#3F7B43]"
                >
                  <span>{contact.phone2}</span>
                  <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full bg-[#3F7B43]/10 text-[#3F7B43]">
                    Orders Desk
                  </span>
                </a>
              </div>
            </div>

            {/* Card 2: Email Inquiries */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#173B2A]">
                    Official Email Desk
                  </h3>
                  <div className="text-[11px] opacity-75 mt-0.5 text-[#292820]">
                    Replies within 24 business hours
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E0D5] space-y-2">
                <a
                  href={`mailto:${contact.email1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold text-[#173B2A] transition-colors hover:text-[#3F7B43]"
                >
                  <span>{contact.email1}</span>
                  <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full bg-[#3F7B43]/10 text-[#3F7B43]">
                    Primary Desk
                  </span>
                </a>
                <a
                  href={`mailto:${contact.email2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold text-[#173B2A] transition-colors hover:text-[#3F7B43]"
                >
                  <span>{contact.email2}</span>
                  <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full bg-[#3F7B43]/10 text-[#3F7B43]">
                    Support
                  </span>
                </a>
              </div>
            </div>

            {/* Card 3: Provenance & Geographical Authenticity */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3F7B43]/10 text-[#3F7B43] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#173B2A]">
                    {contact.provenanceTitle || 'Artisanal Provenance'}
                  </h3>
                  <div className="text-[11px] opacity-75 mt-0.5 text-[#292820]">
                    {contact.provenanceLocation}
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed mt-2 text-[#292820]/75">
                {contact.provenanceDesc}
              </p>
              {contact.provenanceBadge && (
                <div className="mt-3 inline-block text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-[#3F7B43]/10 text-[#3F7B43]">
                  {contact.provenanceBadge}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Standardized Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <CollectionContactForm theme={theme} collectionId={collectionId} />
          </div>
        </div>
      </div>
    </section>
  );
}
