import React from 'react';
import { PhoneCall, Mail, MapPin, Clock } from 'lucide-react';
import { CollectionContactForm } from './CollectionContactForm';
import { getCollectionTheme, isDarkColor } from '../themeConfig';

export function CollectionContactSection({ collectionId = 'food', className = '' }) {
  const theme = getCollectionTheme(collectionId);
  const contact = theme?.contact || {};
  const palette = theme?.palette || {};

  // Dynamically evaluate if the section should adopt a dark luxury aesthetic
  const isSectionDark =
    isDarkColor(palette.bg) ||
    isDarkColor(palette.sectionBg) ||
    collectionId === 'sarees' ||
    collectionId === 'heritage-sarees' ||
    collectionId === 'jewellery' ||
    collectionId === 'silver-jewellery';

  const sectionBg = isSectionDark
    ? (palette.sectionBg && isDarkColor(palette.sectionBg) ? palette.sectionBg : (palette.bg && isDarkColor(palette.bg) ? palette.bg : '#242326'))
    : (palette.sectionBg && !isDarkColor(palette.sectionBg) ? palette.sectionBg : (palette.bg && !isDarkColor(palette.bg) ? palette.bg : '#F8F6F0'));

  const sectionBorder = isSectionDark
    ? (palette.border && !isDarkColor(palette.border) ? palette.border : 'rgba(255, 255, 255, 0.12)')
    : (palette.border || '#E5E0D5');

  // Eyebrow accent color with guaranteed WCAG contrast
  const sectionEyebrowColor = isSectionDark
    ? (palette.accentGold || (!isDarkColor(palette.accent) ? palette.accent : '#D4AF37') || '#C5A46D')
    : (isDarkColor(palette.accent) ? palette.accent : '#2F6334');

  // Section Header Typography
  const sectionHeadingColor = isSectionDark
    ? (palette.heading && !isDarkColor(palette.heading) ? palette.heading : '#F7F3EB')
    : (palette.heading && isDarkColor(palette.heading) ? palette.heading : '#173B2A');

  const sectionTextColor = isSectionDark
    ? (palette.text && !isDarkColor(palette.text) ? palette.text : '#E4E4E7')
    : (palette.text && isDarkColor(palette.text) ? palette.text : '#27272A');

  const sectionMutedColor = isSectionDark
    ? (palette.mutedText && !isDarkColor(palette.mutedText) ? palette.mutedText : '#D1D5DB')
    : (palette.mutedText && isDarkColor(palette.mutedText) ? palette.mutedText : '#65675A');

  // Card Surfaces must match the section realm: dark surfaces for dark sections, crisp white/cream for light
  const cardBg = isSectionDark
    ? (palette.cardBg && isDarkColor(palette.cardBg) ? palette.cardBg : (collectionId === 'sarees' ? '#35121F' : '#343238'))
    : (palette.cardBg && !isDarkColor(palette.cardBg) ? palette.cardBg : '#FFFFFF');

  const isCardDark = isDarkColor(cardBg);

  const cardBorder = isCardDark
    ? 'rgba(255, 255, 255, 0.14)'
    : (palette.border || '#E5E0D5');

  // Text inside Cards — Guaranteed high contrast against card surface
  const cardHeadingColor = isCardDark
    ? (palette.heading && !isDarkColor(palette.heading) ? palette.heading : '#FFFFFF')
    : (palette.heading && isDarkColor(palette.heading) ? palette.heading : '#18181B');

  const cardTextColor = isCardDark
    ? (palette.text && !isDarkColor(palette.text) ? palette.text : '#E4E4E7')
    : (palette.text && isDarkColor(palette.text) ? palette.text : '#27272A');

  const cardMutedColor = isCardDark
    ? (palette.mutedText && !isDarkColor(palette.mutedText) ? palette.mutedText : '#D1D5DB')
    : (palette.mutedText && isDarkColor(palette.mutedText) ? palette.mutedText : '#52525B');

  const cardAccent = isCardDark
    ? (palette.accentGold || (!isDarkColor(palette.accent) ? palette.accent : '#F3F4F6') || '#C5A46D')
    : (isDarkColor(palette.accent) ? palette.accent : '#2F6334');

  // Card Badges and Icon Containers
  const badgeBg = isCardDark ? 'rgba(255, 255, 255, 0.10)' : `${cardAccent}18`;
  const badgeBorder = isCardDark ? 'rgba(255, 255, 255, 0.18)' : `${cardAccent}35`;
  const badgeTextColor = isCardDark ? '#FFFFFF' : cardAccent;

  const iconBg = isCardDark ? 'rgba(255, 255, 255, 0.08)' : `${cardAccent}20`;
  const iconBorder = isCardDark ? '1px solid rgba(255, 255, 255, 0.14)' : 'none';
  const iconColor = isCardDark ? '#FFFFFF' : cardAccent;

  return (
    <section
      id="contact"
      className={`scroll-mt-28 py-12 sm:py-16 border-t transition-colors ${className}`}
      style={{
        backgroundColor: sectionBg,
        borderColor: sectionBorder,
        color: sectionTextColor,
      }}
      aria-labelledby="collection-contact-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 lg:mb-12">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.22em] font-semibold block mb-2"
            style={{ color: sectionEyebrowColor }}
          >
            GET IN TOUCH
          </span>
          <h2
            id="collection-contact-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight"
            style={{ color: sectionHeadingColor }}
          >
            {contact.heading || 'Customer Support'}
          </h2>
          <p
            className="text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed opacity-90"
            style={{ color: sectionMutedColor }}
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: iconBg,
                    border: iconBorder,
                    color: iconColor,
                  }}
                >
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: cardHeadingColor }}
                  >
                    Telephone & WhatsApp Support
                  </h3>
                  <div
                    className="text-[11px] flex items-center gap-1.5 opacity-90 mt-0.5"
                    style={{ color: cardMutedColor }}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{contact.hours}</span>
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: isCardDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E0D5' }}
              >
                <a
                  href={`tel:${contact.phone1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: cardHeadingColor }}
                >
                  <span className="group-hover:underline">{contact.phone1}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeTextColor,
                    }}
                  >
                    Direct Call
                  </span>
                </a>
                <a
                  href={`tel:${contact.phone2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: cardHeadingColor }}
                >
                  <span className="group-hover:underline">{contact.phone2}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeTextColor,
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: iconBg,
                    border: iconBorder,
                    color: iconColor,
                  }}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: cardHeadingColor }}
                  >
                    Official Email Desk
                  </h3>
                  <div
                    className="text-[11px] opacity-90 mt-0.5"
                    style={{ color: cardMutedColor }}
                  >
                    Replies within 24 business hours
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: isCardDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E0D5' }}
              >
                <a
                  href={`mailto:${contact.email1}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: cardHeadingColor }}
                >
                  <span className="group-hover:underline">{contact.email1}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeTextColor,
                    }}
                  >
                    Primary Desk
                  </span>
                </a>
                <a
                  href={`mailto:${contact.email2}`}
                  className="flex items-center justify-between text-xs font-mono font-semibold transition-colors group"
                  style={{ color: cardHeadingColor }}
                >
                  <span className="group-hover:underline">{contact.email2}</span>
                  <span
                    className="text-[10px] font-sans font-medium uppercase px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeTextColor,
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: iconBg,
                    border: iconBorder,
                    color: iconColor,
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-serif text-sm sm:text-base font-semibold"
                    style={{ color: cardHeadingColor }}
                  >
                    {contact.provenanceTitle || 'Artisanal Provenance'}
                  </h3>
                  <div
                    className="text-[11px] font-medium opacity-90 mt-0.5"
                    style={{ color: cardMutedColor }}
                  >
                    {contact.provenanceLocation}
                  </div>
                </div>
              </div>
              <p
                className="text-xs leading-relaxed mt-2"
                style={{ color: cardTextColor }}
              >
                {contact.provenanceDesc}
              </p>
              {contact.provenanceBadge && (
                <div
                  className="mt-3 inline-block text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border shadow-2xs"
                  style={{
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder,
                    color: badgeTextColor,
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
