import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import { COLLECTIONS } from '../../../data/collections';
import { Container } from '../../../components/ui/Container';

/**
 * Converts hex color code to rgba() string with specific opacity.
 */
function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(248, 246, 240, ${alpha})`;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * ExploreCollectionsSection
 * 
 * Reusable, responsive collection discovery grid displaying all four Amoga Houses:
 * 1. Wholesome Pantry (Traditional Indian Food Mixes)
 * 2. Wellness Tea (Botanical Herbal Teas & Infusions)
 * 3. Heritage Sarees (Master Weaves & Handloom Silks)
 * 4. Sterling Silver (Sculptural 925 Precious Metals)
 * 
 * Accurately reproduces the Gatekeeper visual language with curated photography,
 * multi-stop continuous gradient overlays, and liquid-glass pill CTA buttons.
 */
export function ExploreCollectionsSection({
  currentCollectionId = null,
  title = 'Explore Collections',
  eyebrow = 'The Four Houses of Amoga',
  description = 'Experience the warmth of traditional food mixes, restorative botanical teas, hand-loomed heritage sarees, and sculpted sterling silver heirlooms.',
  className = '',
}) {
  // Collection-specific section wrapper styling for seamless integration
  const sectionThemes = {
    food: {
      bg: 'bg-[#F1EDE4]',
      border: 'border-[#E5E0D5]',
      eyebrowColor: 'text-[#3F7B43]',
      headingColor: 'text-[#173B2A]',
      descColor: 'text-[#555246]',
      accentRule: 'bg-[#3F7B43]',
    },
    tea: {
      bg: 'bg-[#F7EFB2]',
      border: 'border-[#B88E38]/25',
      eyebrowColor: 'text-[#8C6320]',
      headingColor: 'text-[#2C1E11]',
      descColor: 'text-[#543B25]',
      accentRule: 'bg-[#8C6320]',
    },
    sarees: {
      bg: 'bg-[#220B14]',
      border: 'border-[#C5A46D]/20',
      eyebrowColor: 'text-[#C5A46D]',
      headingColor: 'text-[#F6EBD8]',
      descColor: 'text-[#D4C2A7]',
      accentRule: 'bg-[#C5A46D]',
    },
    jewellery: {
      bg: 'bg-[#18181B]',
      border: 'border-[#B9B8B5]/20',
      eyebrowColor: 'text-[#B9B8B5]',
      headingColor: 'text-[#F7F3EB]',
      descColor: 'text-[#A7A8AD]',
      accentRule: 'bg-[#B9B8B5]',
    },
  };

  const currentTheme = sectionThemes[currentCollectionId] || sectionThemes.food;

  const handleCardClick = (colId) => {
    if (typeof window !== 'undefined') {
      if (colId === currentCollectionId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  return (
    <section
      id="explore-collections"
      className={`relative z-10 py-16 sm:py-24 border-t transition-colors ${currentTheme.bg} ${currentTheme.border} ${className}`}
      aria-label="Explore All Collections"
    >
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-current/10 text-xs font-mono uppercase tracking-widest font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span className={currentTheme.eyebrowColor}>{eyebrow}</span>
          </div>

          <h2 className={`font-serif text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight ${currentTheme.headingColor}`}>
            {title}
          </h2>

          <p className={`text-xs sm:text-sm md:text-base leading-relaxed ${currentTheme.descColor} max-w-2xl mx-auto`}>
            {description}
          </p>
        </div>

        {/* 4 Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-6">
          {COLLECTIONS.map((col, idx) => {
            const isCurrent = col.id === currentCollectionId;
            const responsive = col.imageResponsive;
            const primaryImg = col.cardImage || col.heroImage;
            const fallbackImg = col.fallbackImage || primaryImg;

            // Multi-stop continuous gradient from solid top to transparent image
            const gradientOverlayStyle = {
              background: `linear-gradient(180deg, 
                ${hexToRgba(col.bgColor, 1.0)} 0%, 
                ${hexToRgba(col.bgColor, 1.0)} 30%, 
                ${hexToRgba(col.bgColor, 0.98)} 40%, 
                ${hexToRgba(col.bgColor, 0.88)} 50%, 
                ${hexToRgba(col.bgColor, 0.65)} 62%, 
                ${hexToRgba(col.bgColor, 0.35)} 74%, 
                ${hexToRgba(col.bgColor, 0.12)} 85%, 
                ${hexToRgba(col.bgColor, 0.0)} 92%,
                rgba(0, 0, 0, 0.25) 100%)`,
            };

            return (
              <Link
                key={col.id}
                to={col.path}
                onClick={() => handleCardClick(col.id)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl min-h-[470px] sm:min-h-[490px] p-6 sm:p-7 shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isCurrent
                    ? 'ring-2 ring-offset-2 ring-current ring-offset-transparent'
                    : 'border border-black/5 dark:border-white/10'
                }`}
                style={{
                  backgroundColor: col.bgColor,
                  color: col.textColor,
                }}
                aria-label={`${col.name} — ${col.ctaText}`}
              >
                {/* LAYER 1: PHOTOGRAPHY (Positioned in lower half) */}
                <div className="absolute inset-x-0 bottom-0 top-[34%] overflow-hidden pointer-events-none z-0">
                  <picture className="w-full h-full block">
                    {responsive?.webpSrcSet && (
                      <source
                        type="image/webp"
                        srcSet={responsive.webpSrcSet}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    )}
                    {responsive?.jpgSrcSet && (
                      <source
                        type="image/jpeg"
                        srcSet={responsive.jpgSrcSet}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    )}
                    <img
                      src={primaryImg}
                      alt={col.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter saturate-[1.04]"
                      style={{
                        objectPosition: responsive?.objectPosition || 'center center',
                      }}
                      onError={(e) => {
                        if (e.currentTarget.src !== fallbackImg) {
                          e.currentTarget.src = fallbackImg;
                        }
                      }}
                    />
                  </picture>
                </div>

                {/* LAYER 2: SMOOTH MULTI-STOP CONTINUOUS GRADIENT OVERLAY */}
                <div
                  className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
                  style={gradientOverlayStyle}
                  aria-hidden="true"
                />

                {/* LAYER 3: NARRATIVE CONTENT (Z-20) */}
                <div className="relative z-20 flex flex-col items-start w-full pointer-events-none">
                  {/* Sequence Number, Accent Line & Active Badge */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2.5 text-xs font-mono tracking-widest opacity-80">
                      <span className="font-semibold">{col.number}</span>
                      <span
                        className="w-6 h-[1px]"
                        style={{ backgroundColor: col.accentColor }}
                      />
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-black/15 text-current border border-current/20 backdrop-blur-xs">
                        Current House
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
                        Amoga House
                      </span>
                    )}
                  </div>

                  {/* Collection Title */}
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl uppercase leading-[1.08] tracking-tight drop-shadow-2xs">
                    {col.title.split(' ').map((word, wIdx) => (
                      <span key={wIdx} className="block">
                        {word}
                      </span>
                    ))}
                  </h3>

                  {/* Eyebrow Subheading */}
                  <div
                    className="mt-2 text-[10px] sm:text-[11px] font-semibold font-mono tracking-[0.2em] uppercase line-clamp-1"
                    style={{ color: col.accentColor }}
                  >
                    {col.eyebrow}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm leading-relaxed mt-3 max-w-sm opacity-90 line-clamp-3">
                    {col.description}
                  </p>

                  {/* Pill CTA Button (Identical to Gatekeeper LiquidGlassCta) */}
                  <div className="mt-5 pointer-events-auto">
                    <div
                      className="group/btn relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-10 rounded-full border border-white/60 group-hover:border-white/80 bg-white/50 group-hover:bg-white/70 active:bg-white/60 text-[#111215] text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ease-out select-none shadow-[0_4px_14px_0_rgba(0,0,0,0.06)] group-hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.12)]"
                      style={{
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      <span className="relative z-10">{col.ctaText}</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 shrink-0 text-current"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* LAYER 4: BOTTOM STATUS / FEATURES PILL */}
                <div className="relative z-20 pt-8 pointer-events-none">
                  <div className="text-[10px] font-mono tracking-wider opacity-75 truncate">
                    {col.features ? col.features.slice(0, 2).join(' • ') : col.badge}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
