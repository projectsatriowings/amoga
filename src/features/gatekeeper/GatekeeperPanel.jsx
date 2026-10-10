import React from 'react';
import { motion } from 'framer-motion';
import { LiquidGlassCta } from './LiquidGlassCta';

/**
 * GatekeeperPanel Component
 * 
 * Individual vertical panel representing one shopping collection.
 * Supports animated flex width redistribution, rich typography,
 * responsive photography with gradient blending, and keyboard navigation.
 */
export function GatekeeperPanel({
  collection,
  index,
  total = 3,
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

  // Target flex values:
  // When nothing is hovered: 1.0 (equal width)
  // When this is hovered: 2.2
  // When another is hovered: 0.6
  const targetFlex = isAnyHovered ? (isHovered ? 2.2 : 0.6) : 1.0;

  // Collection-specific palette & typography tokens
  const themeConfig = {
    food: {
      bgColor: '#F8F6F0',
      textColor: '#173B2A',
      accentColor: '#3F7B43',
      eyebrowColor: '#3F7B43',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-bold tracking-tight',
      gradientStop: 'from-[#F8F6F0] via-[#F8F6F0]/80 to-transparent',
      overlayDim: 'bg-[#173B2A]/25',
    },
    tea: {
      bgColor: '#FAF1BB',
      textColor: '#173B2A',
      accentColor: '#65815A',
      eyebrowColor: '#65815A',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-normal tracking-wide',
      gradientStop: 'from-[#FAF1BB] via-[#FAF1BB]/85 to-transparent',
      overlayDim: 'bg-[#173B2A]/15',
    },
    sarees: {
      bgColor: '#2C0E1A',
      textColor: '#F6EBD8',
      accentColor: '#C5A46D',
      eyebrowColor: '#C5A46D',
      descriptionColor: '#D4C2A7',
      titleFont: 'font-serif font-normal tracking-wide',
      gradientStop: 'from-[#2C0E1A] via-[#2C0E1A]/85 to-transparent',
      overlayDim: 'bg-black/40',
    },
    jewellery: {
      bgColor: '#111215',
      textColor: '#F4F4F2',
      accentColor: '#C6C8CD',
      eyebrowColor: '#C6C8CD',
      descriptionColor: '#A7A8AD',
      titleFont: 'font-jakarta font-normal tracking-widest',
      gradientStop: 'from-[#111215] via-[#111215]/85 to-transparent',
      overlayDim: 'bg-black/50',
    },
  }[collection.id] || {
    bgColor: '#FAF1BB',
    textColor: '#2C1E11',
    accentColor: '#B88E38',
    eyebrowColor: '#8C6320',
    descriptionColor: '#543B25',
    titleFont: 'font-serif font-normal tracking-wide',
    gradientStop: 'from-[#FAF1BB] via-[#FAF1BB]/85 to-transparent',
    overlayDim: 'bg-[#2C1E11]/15',
  };

  const transitionConfig = {
    duration: prefersReducedMotion ? 0.01 : 0.65,
    ease: [0.16, 1, 0.3, 1], // cinematic smooth cubic bezier
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
      {/* Dim overlay when another panel is active */}
      <motion.div
        animate={{ opacity: isCollapsed ? 1 : 0 }}
        transition={transitionConfig}
        className={`absolute inset-0 z-20 pointer-events-none transition-opacity ${themeConfig.overlayDim}`}
      />

      {/* Top Content Area */}
      <div className="relative z-10 pt-16 sm:pt-20 md:pt-24 px-4 sm:px-6 md:px-7 lg:px-8 xl:px-10 flex flex-col items-start w-full">
        {/* Collection Number & Divider */}
        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono tracking-widest opacity-80 mb-3 sm:mb-4">
          <span className="font-semibold">{collection.number}</span>
          <span
            className="w-6 sm:w-8 h-[1px]"
            style={{ backgroundColor: themeConfig.accentColor }}
          />
        </div>

        {/* Collection Title */}
        <motion.h2
          layout="position"
          className={`text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl uppercase leading-[1.1] w-full max-w-full ${themeConfig.titleFont}`}
          style={{ color: themeConfig.textColor }}
        >
          {collection.title.split(' ').map((word, wIdx) => (
            <span key={wIdx} className="inline-block mr-2.5 last:mr-0">
              {word}
            </span>
          ))}
        </motion.h2>

        {/* Eyebrow Subheading */}
        <motion.div
          layout="position"
          className="mt-2 text-[10px] sm:text-xs font-semibold tracking-[0.22em] uppercase"
          style={{ color: themeConfig.eyebrowColor }}
        >
          {collection.eyebrow}
        </motion.div>

        {/* Description (Fades gracefully in/out on collapse) */}
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            height: isCollapsed ? 0 : 'auto',
            marginTop: isCollapsed ? 0 : 16,
          }}
          transition={transitionConfig}
          className="overflow-hidden max-w-sm"
        >
          <p
            className="text-xs sm:text-sm leading-relaxed"
            style={{ color: themeConfig.descriptionColor }}
          >
            {collection.description}
          </p>
        </motion.div>

        {/* Liquid-Glass CTA Button */}
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : isExpanded ? 1 : 0.85,
            y: isCollapsed ? 12 : 0,
            scale: isCollapsed ? 0.95 : 1,
          }}
          transition={transitionConfig}
          className="mt-6 sm:mt-8"
        >
          <LiquidGlassCta
            collectionId={collection.id}
            label={collection.ctaText}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(collection);
            }}
          />
        </motion.div>
      </div>

      {/* Bottom Photography Container */}
      <div className="relative w-full h-[45%] sm:h-[50%] md:h-[52%] mt-auto overflow-hidden">
        {/* Top Gradient Blend */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 sm:h-32 z-10 bg-gradient-to-b ${themeConfig.gradientStop} pointer-events-none`}
        />

        {/* Collection Photography */}
        <motion.img
          src={collection.heroImage}
          alt={`Amoga ${collection.name}`}
          animate={{
            scale: isExpanded ? 1.05 : 1.0,
          }}
          transition={transitionConfig}
          className="w-full h-full object-cover object-center filter saturate-[1.05]"
          loading="eager"
        />
      </div>

      {/* Subtle Vertical Border Separator */}
      {index < total - 1 && (
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/10 dark:bg-white/10 z-30 pointer-events-none" />
      )}
    </motion.article>
  );
}
