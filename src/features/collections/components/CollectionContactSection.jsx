import React from 'react';
import { PhoneCall, Mail, MapPin, Clock } from 'lucide-react';
import { CollectionContactForm } from './CollectionContactForm';
import { getCollectionTheme } from '../themeConfig';

export function CollectionContactSection({ collectionId = 'food', className = '' }) {
  const theme = getCollectionTheme(collectionId);
  const contact = theme?.contact || {};
  const palette = theme?.palette || {};

  const isDark =
    palette.bg === '#2C0E1A' ||
    palette.cardBg === '#35121F' ||
    palette.heading === '#F6EBD8' ||
    collectionId === 'sarees' ||
    collectionId === 'heritage-sarees';

  const sectionBg = isDark ? (palette.sectionBg || '#2C0E1A') : (palette.bg || '#F8F6F0');
  const sectionBorder = palette.border || (isDark ? 'rgba(197, 164, 109, 0.35)' : '#E5E0D5');
  const accentColor = palette.accentGold || palette.accent || (isDark ? '#C5A46D' : '#3F7B43');
  const headingColor = palette.heading || (isDark ? '#F6EBD8' : '#173B2A');
  const textColor = palette.text || (isDark ? '#F6EBD8' : '#292820');
  const mutedTextColor = palette.mutedText || (isDark ? '#D8C6AD' : '#746F63');
  const cardBg = isDark ? (palette.cardBg || '#35121F') : '#FFFFFF';
  const cardBorder = palette.border || (isDark ? 'rgba(197, 164, 109, 0.35)' : '#E5E0D5');

  return (
    <section
      id="contact"
      className={`scroll-mt-28 py-12 sm:py-16 border-t transition-colors ${className}`}
      style={{
        backgroundColor: sectionBg,
        borderColor: sectionBorder,
        color: textColor,
      }}
      aria-labelledby="collection-contact-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 lg:mb-12">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.22em] font-semibold block mb-2"
            style={{ color: accentColor }}
          >
            GET IN TOUCH
          </span>
          <h2
            id="collection-contact-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight"
            style={{ color: headingColor }}
          >
            {contact.heading || 'Concierge & Client Care'}
          </h2>
          <p
            className="text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed opacity-90"
            style={{ color: mutedTextColor }}
          >
            {contact.subheading}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Official Contact Details & Provenance (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Card 1: Telephone Orders & Direct Assistance */}
            <div
              className="p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: headingColor }}
                  >
                    Telephone & WhatsApp Support
                  </h3>
                  <div
                    className="text-[11px] flex items-center gap-1.5 opacity-80 mt-0.5"
                    style={{ color: mutedTextColor }}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{contact.hours}</span>
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: cardBorder }}
              >
                <a
                  href={`tel:${contact.phone1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: headingColor }}
                >
                  <span className="group-hover:underline">{contact.phone1}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      color: accentColor,
                    }}
                  >
                    Direct Call
                  </span>
                </a>
                <a
                  href={`tel:${contact.phone2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: headingColor }}
                >
                  <span className="group-hover:underline">{contact.phone2}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      color: accentColor,
                    }}
                  >
                    Orders Desk
                  </span>
                </a>
              </div>
            </div>

            {/* Card 2: Email Inquiries */}
            <div
              className="p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: headingColor }}
                  >
                    Official Email Desk
                  </h3>
                  <div
                    className="text-[11px] opacity-80 mt-0.5"
                    style={{ color: mutedTextColor }}
                  >
                    Replies within 24 business hours
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: cardBorder }}
              >
                <a
                  href={`mailto:${contact.email1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: headingColor }}
                >
                  <span className="group-hover:underline">{contact.email1}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      color: accentColor,
                    }}
                  >
                    Primary Desk
                  </span>
                </a>
                <a
                  href={`mailto:${contact.email2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: headingColor }}
                >
                  <span className="group-hover:underline">{contact.email2}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      color: accentColor,
                    }}
                  >
                    Support
                  </span>
                </a>
              </div>
            </div>

            {/* Card 3: Provenance & Geographical Authenticity */}
            <div
              className="p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: headingColor }}
                  >
                    {contact.provenanceTitle || 'Artisanal Provenance'}
                  </h3>
                  <div
                    className="text-[11px] opacity-80 mt-0.5"
                    style={{ color: mutedTextColor }}
                  >
                    {contact.provenanceLocation}
                  </div>
                </div>
              </div>
              <p
                className="text-xs leading-relaxed mt-2 opacity-90"
                style={{ color: mutedTextColor }}
              >
                {contact.provenanceDesc}
              </p>
              {contact.provenanceBadge && (
                <div
                  className="mt-3 inline-block text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${accentColor}25`,
                    color: accentColor,
                  }}
                >
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
