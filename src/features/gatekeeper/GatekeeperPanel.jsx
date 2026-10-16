import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LiquidGlassCta } from './LiquidGlassCta';
import { COLLECTIONS } from '../../data/collections';

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
 * GatekeeperPanel Component (Production Redesign)
 * 
 * Individual vertical panel representing one curated shopping collection.
 * Features:
 * - 5-layer stacking order: Base -> Image -> Long Soft Gradient -> Text/CTAs -> Dim/Hover.
 * - Buttery-smooth multi-stop continuous gradient blending upward into the solid color.
 * - Responsive WebP picture with fallback JPEG, high fetch priority, and zero layout shift.
 * - Animated flex width redistribution with smooth cubic bezier hover transitions.
 */
export function GatekeeperPanel({
  collection,
  index,
  total = 4,
  isHovered,
  isAnyHovered,
  isExiting,
  onHover,
  onLeave,
  onSelect,
  prefersReducedMotion = false,
}) {
  const isCollapsed = isAnyHovered && !isHovered;
  const isExpanded = isHovered;

  // Image load & fallback state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Target flex values:
  // When nothing is hovered: 1.0 (equal width)
  // When this is hovered: 2.2
  // When another is hovered: 0.6
  const targetFlex = isAnyHovered ? (isHovered ? 2.2 : 0.6) : 1.0;

  // Collection-specific palette & typography tokens
  const baseTheme = {
    food: {
      bgColor: '#F8F6F0',
      textColor: '#173B2A',
      accentColor: '#3F7B43',
      eyebrowColor: '#3F7B43',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-bold tracking-tight',
      bottomVignette: '0.12',
      overlayDim: 'bg-[#173B2A]/25',
    },
    tea: {
      bgColor: '#FAF1BB',
      textColor: '#173B2A',
      accentColor: '#65815A',
      eyebrowColor: '#65815A',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-normal tracking-wide',
      bottomVignette: '0.12',
      overlayDim: 'bg-[#173B2A]/15',
    },
    sarees: {
      bgColor: '#2C0E1A',
      textColor: '#F6EBD8',
      accentColor: '#C5A46D',
      eyebrowColor: '#C5A46D',
      descriptionColor: '#D4C2A7',
      titleFont: 'font-serif font-normal tracking-wide',
      bottomVignette: '0.35',
      overlayDim: 'bg-black/40',
    },
    jewellery: {
      bgColor: '#111215',
      textColor: '#F4F4F2',
      accentColor: '#C6C8CD',
      eyebrowColor: '#C6C8CD',
      descriptionColor: '#A7A8AD',
      titleFont: 'font-jakarta font-normal tracking-widest',
      bottomVignette: '0.38',
      overlayDim: 'bg-black/50',
    },
  }[collection.id] || {
    bgColor: '#FAF8F5',
    textColor: '#1A1817',
    accentColor: collection.accentColor || '#722F37',
    eyebrowColor: collection.accentColor || '#722F37',
    descriptionColor: '#4A423B',
    titleFont: 'font-serif font-normal tracking-wide',
    bottomVignette: '0.25',
    overlayDim: 'bg-black/30',
  };

  const customPalette = collection.themeConfig || {};
  const themeConfig = {
    ...baseTheme,
    bgColor: customPalette.bgColor || baseTheme.bgColor,
    textColor: customPalette.textColor || baseTheme.textColor,
    accentColor: collection.accentColor || customPalette.accentColor || baseTheme.accentColor,
    eyebrowColor: collection.accentColor || customPalette.accentColor || baseTheme.eyebrowColor,
    descriptionColor: customPalette.mutedTextColor || baseTheme.descriptionColor,
  };

  const staticMatch = COLLECTIONS.find((c) => c.id === collection.id);
  const responsive = collection.imageResponsive || staticMatch?.imageResponsive;
  const primaryImgSrc = collection.heroImage || staticMatch?.heroImage;
  const fallbackSrc = collection.fallbackImage || staticMatch?.fallbackImage || primaryImgSrc;

  const transitionConfig = {
    duration: prefersReducedMotion ? 0.01 : 0.65,
    ease: [0.16, 1, 0.3, 1], // cinematic smooth cubic bezier
  };

  // Multi-stop continuous gradient from 100% solid at the top to transparent over the image
  const gradientOverlayStyle = {
    background: `linear-gradient(180deg, 
      ${hexToRgba(themeConfig.bgColor, 1.0)} 0%, 
      ${hexToRgba(themeConfig.bgColor, 1.0)} 32%, 
      ${hexToRgba(themeConfig.bgColor, 0.98)} 40%, 
      ${hexToRgba(themeConfig.bgColor, 0.88)} 50%, 
      ${hexToRgba(themeConfig.bgColor, 0.65)} 62%, 
      ${hexToRgba(themeConfig.bgColor, 0.35)} 74%, 
      ${hexToRgba(themeConfig.bgColor, 0.12)} 85%, 
      ${hexToRgba(themeConfig.bgColor, 0.0)} 92%,
      rgba(0, 0, 0, ${themeConfig.bottomVignette || '0.2'}) 100%)`,
  };

  return (
    <motion.article
      tabIndex={0}
      role="region"
      aria-label={`Amoga ${collection.name} Collection`}
      aria-expanded={isExpanded}
      animate={{
        flex: targetFlex,
        opacity: isExiting ? 0.2 : 1,
      }}
      transition={transitionConfig}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(index)}
      onBlur={onLeave}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(collection);
        }
      }}
      className="relative h-full flex flex-col justify-between overflow-hidden cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C5A46D] transition-shadow"
      style={{
        backgroundColor: themeConfig.bgColor,
        color: themeConfig.textColor,
        minWidth: isCollapsed ? '90px' : '170px',
      }}
      onClick={() => onSelect(collection)}
    >
      {/* =========================================================================
          LAYER 2: COLLECTION PHOTOGRAPHY (Positioned below upper text and buttons)
          ========================================================================= */}
      <div className="absolute inset-x-0 bottom-0 top-[34%] sm:top-[32%] md:top-[30%] overflow-hidden pointer-events-none z-0">
        <picture className="w-full h-full block">
          {!useFallback && responsive?.webpSrcSet && (
            <source
              type="image/webp"
              srcSet={responsive.webpSrcSet}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
          {!useFallback && responsive?.jpgSrcSet && (
            <source
              type="image/jpeg"
              srcSet={responsive.jpgSrcSet}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
          <motion.img
            src={useFallback ? fallbackSrc : primaryImgSrc}
            alt={responsive?.alt || `Amoga ${collection.name}`}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.warn(`[Amoga] Image failed to load: ${e.currentTarget.src}, using fallback.`);
              setUseFallback(true);
            }}
            animate={{
              scale: isExpanded ? 1.04 : 1.0,
            }}
            transition={transitionConfig}
            className={`w-full h-full object-cover transition-opacity duration-700 ease-out filter saturate-[1.04] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              objectPosition: responsive?.objectPosition || 'center center',
            }}
          />
        </picture>
      </div>

      {/* =========================================================================
          LAYER 3: SMOOTH LAYERED GRADIENT OVERLAY
          Transitions seamless solid tone downward into the photography.
          ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
        style={gradientOverlayStyle}
        aria-hidden="true"
      />

      {/* =========================================================================
          LAYER 4: NARRATIVE HEADINGS & INTERACTIVE CTA CONTENT (z-20)
          ========================================================================= */}
      <div className="relative z-20 pointer-events-auto pt-16 sm:pt-20 md:pt-24 px-4 sm:px-6 md:px-7 lg:px-8 xl:px-10 flex-1 flex flex-col justify-start items-start w-full pb-6 sm:pb-8">
        {/* Narrative Group */}
        <div className="w-full flex flex-col items-start">
          {/* Collection Number & Decorative Accent Rule */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-mono tracking-widest opacity-80 mb-3 sm:mb-4">
            <span className="font-semibold">{collection.number}</span>
            <span
              className="w-6 sm:w-8 h-[1px]"
              style={{ backgroundColor: themeConfig.accentColor }}
            />
          </div>

          {/* Prominent Collection Title */}
          <motion.h2
            layout="position"
            className={`text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl uppercase leading-[1.05] w-full max-w-full drop-shadow-sm ${
              isCollapsed ? '' : 'md:min-h-[3.6rem] lg:min-h-[4.4rem] xl:min-h-[5.2rem] 2xl:min-h-[6rem]'
            } ${themeConfig.titleFont}`}
            style={{ color: themeConfig.textColor }}
          >
            {collection.title.split(' ').map((word, wIdx) => (
              <span key={wIdx} className="block">
                {word}
              </span>
            ))}
          </motion.h2>

          {/* Eyebrow Subheading */}
          <motion.div
            layout="position"
            className={`mt-2 text-[10px] sm:text-xs font-semibold tracking-[0.22em] uppercase ${
              isCollapsed ? 'min-h-0' : 'min-h-[1.25rem] md:min-h-[1.5rem]'
            }`}
            style={{ color: themeConfig.eyebrowColor }}
          >
            {collection.eyebrow}
          </motion.div>

          {/* Description (Smoothly fades on panel collapse) */}
          <motion.div
            animate={{
              opacity: isCollapsed ? 0 : 1,
              height: isCollapsed ? 0 : 'auto',
              marginTop: isCollapsed ? 0 : 14,
            }}
            transition={transitionConfig}
            className={`overflow-hidden max-w-sm ${
              isCollapsed ? '' : 'md:min-h-[5.75rem] lg:min-h-[5rem] xl:min-h-[4.5rem]'
            }`}
          >
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ color: themeConfig.descriptionColor }}
            >
              {collection.description}
            </p>
          </motion.div>

          {/* Explore Collection CTA Button */}
          <motion.div
            animate={{
              opacity: isCollapsed ? 0 : 1,
              height: isCollapsed ? 0 : 'auto',
              marginTop: isCollapsed ? 0 : 18,
            }}
            transition={transitionConfig}
            className="overflow-hidden flex flex-col items-start z-20"
          >
            <LiquidGlassCta
              collectionId={collection.id}
              label={collection.ctaText || 'Shop Collection'}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(collection);
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* =========================================================================
          LAYER 5: DIM OVERLAY ON COLLAPSED PANELS & VERTICAL DIVIDER
          ========================================================================= */}
      <motion.div
        animate={{ opacity: isCollapsed ? 1 : 0 }}
        transition={transitionConfig}
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity ${themeConfig.overlayDim}`}
      />

      {/* Subtle Vertical Border Separator */}
      {index < total - 1 && (
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/10 dark:bg-white/10 z-40 pointer-events-none" />
      )}
    </motion.article>
  );
}
