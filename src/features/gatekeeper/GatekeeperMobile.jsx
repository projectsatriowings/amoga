import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LiquidGlassCta } from './LiquidGlassCta';
import { COLLECTIONS } from '../../data/collections';
import { CallToOrderAssistance } from '../../components/common/CallToOrderAssistance';

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
 * GatekeeperMobile Component (Production Redesign)
 * 
 * Mobile-first swipeable and tabbed experience (< 768px).
 * Displays one dominant collection at a time with touch gestures,
 * responsive WebP photography, smooth gradient transitions, and zero layout shift.
 */
export function GatekeeperMobile({
  collections,
  activeIndex,
  onChangeIndex,
  onSelect,
  isExiting = false,
  prefersReducedMotion = false,
}) {
  const current = collections[activeIndex];
  const [useFallback, setUseFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePrev = () => {
    if (isExiting) return;
    setUseFallback(false);
    setImageLoaded(false);
    onChangeIndex((activeIndex - 1 + collections.length) % collections.length);
  };

  const handleNext = () => {
    if (isExiting) return;
    setUseFallback(false);
    setImageLoaded(false);
    onChangeIndex((activeIndex + 1) % collections.length);
  };

  const themeConfig = {
    food: {
      bgColor: '#F8F6F0',
      textColor: '#173B2A',
      accentColor: '#3F7B43',
      eyebrowColor: '#3F7B43',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-bold',
      bottomVignette: '0.12',
    },
    tea: {
      bgColor: '#FAF1BB',
      textColor: '#173B2A',
      accentColor: '#65815A',
      eyebrowColor: '#65815A',
      descriptionColor: '#292820',
      titleFont: 'font-serif font-normal',
      bottomVignette: '0.12',
    },
    sarees: {
      bgColor: '#2C0E1A',
      textColor: '#F6EBD8',
      accentColor: '#C5A46D',
      eyebrowColor: '#C5A46D',
      descriptionColor: '#D4C2A7',
      titleFont: 'font-serif font-normal',
      bottomVignette: '0.35',
    },
    jewellery: {
      bgColor: '#111215',
      textColor: '#F4F4F2',
      accentColor: '#C6C8CD',
      eyebrowColor: '#C6C8CD',
      descriptionColor: '#A7A8AD',
      titleFont: 'font-jakarta font-normal',
      bottomVignette: '0.38',
    },
  }[current.id] || {
    bgColor: '#FAF1BB',
    textColor: '#2C1E11',
    accentColor: '#B88E38',
    eyebrowColor: '#8C6320',
    descriptionColor: '#543B25',
    titleFont: 'font-serif font-normal',
    bottomVignette: '0.2',
  };

  const staticMatch = COLLECTIONS.find((c) => c.id === current.id);
  const responsive = current.imageResponsive || staticMatch?.imageResponsive;
  const primaryImgSrc = current.heroImage || staticMatch?.heroImage;
  const fallbackSrc = current.fallbackImage || staticMatch?.fallbackImage || primaryImgSrc;

  // Layered gradient overlay for mobile photography card
  const mobileCardGradient = {
    background: `linear-gradient(180deg, 
      ${hexToRgba(themeConfig.bgColor, 0.95)} 0%, 
      ${hexToRgba(themeConfig.bgColor, 0.70)} 20%, 
      ${hexToRgba(themeConfig.bgColor, 0.20)} 45%, 
      ${hexToRgba(themeConfig.bgColor, 0.0)} 65%,
      rgba(0, 0, 0, ${themeConfig.bottomVignette || '0.2'}) 100%)`,
  };

  return (
    <div
      className="md:hidden relative h-full w-full flex flex-col justify-between overflow-hidden transition-colors duration-500 ease-smooth pt-20 pb-6 px-4"
      style={{
        backgroundColor: themeConfig.bgColor,
        color: themeConfig.textColor,
      }}
    >
      {/* Top Segmented Collection Navigation Bar */}
      <div className="w-full flex items-center justify-between gap-2 z-20 mb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md mx-auto">
          {collections.map((col, idx) => (
            <button
              key={col.id}
              type="button"
              disabled={isExiting}
              onClick={() => {
                if (idx !== activeIndex) {
                  setUseFallback(false);
                  setImageLoaded(false);
                  onChangeIndex(idx);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all duration-300 ${
                idx === activeIndex
                  ? 'bg-white text-black dark:bg-[#C5A46D] dark:text-[#2C0E1A] font-bold shadow-sm'
                  : 'opacity-60 hover:opacity-100 disabled:opacity-30'
              }`}
              aria-label={`View ${col.name}`}
            >
              0{idx + 1} {col.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Active Panel with Swipe Gestures */}
      <div className="relative flex-1 flex flex-col justify-between z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            drag={isExiting ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) handleNext();
              if (info.offset.x > 40) handlePrev();
            }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Header Content */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest opacity-80 font-semibold">
                  {current.number} / 0{collections.length}
                </span>
                <span
                  className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${themeConfig.accentColor}20`,
                    color: themeConfig.accentColor,
                  }}
                >
                  {current.badge}
                </span>
              </div>

              <h2 className={`text-2xl sm:text-3xl uppercase tracking-tight ${themeConfig.titleFont}`}>
                {current.title}
              </h2>

              <div
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: themeConfig.eyebrowColor }}
              >
                {current.eyebrow}
              </div>

              <p
                className="text-xs sm:text-sm leading-relaxed max-w-sm"
                style={{ color: themeConfig.descriptionColor }}
              >
                {current.description}
              </p>
            </div>

            {/* Photography Card with Layered Smooth Gradient */}
            <div className="relative w-full h-52 sm:h-60 my-3 rounded-xl overflow-hidden shadow-md border border-black/10 dark:border-white/10 bg-black/5">
              <picture className="w-full h-full block">
                {!useFallback && responsive?.webpSrcSet && (
                  <source
                    type="image/webp"
                    srcSet={responsive.webpSrcSet}
                    sizes="100vw"
                  />
                )}
                {!useFallback && responsive?.jpgSrcSet && (
                  <source
                    type="image/jpeg"
                    srcSet={responsive.jpgSrcSet}
                    sizes="100vw"
                  />
                )}
                <img
                  src={useFallback ? fallbackSrc : primaryImgSrc}
                  alt={responsive?.alt || `Amoga ${current.name}`}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    console.warn(`[Amoga Mobile] Image error: ${e.currentTarget.src}`);
                    setUseFallback(true);
                  }}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    objectPosition: responsive?.objectPosition || 'center center',
                    aspectRatio: '896 / 1200',
                  }}
                />
              </picture>
              <div
                className="absolute inset-0 pointer-events-none"
                style={mobileCardGradient}
                aria-hidden="true"
              />
            </div>

            {/* Explore Button & Secondary Call to Order */}
            <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
              <LiquidGlassCta
                collectionId={current.id}
                label={current.ctaText}
                disabled={isExiting}
                onClick={() => onSelect(current)}
                className="w-full justify-center py-3 text-sm"
              />
              <CallToOrderAssistance
                variant="hero"
                className="w-full justify-center py-2.5 bg-black/35 backdrop-blur-md border-white/20 text-[#F4F4F2] text-xs hover:bg-white/15"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls & Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-current/10 z-20">
        <button
          type="button"
          disabled={isExiting}
          onClick={handlePrev}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:opacity-100 opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-[#C5A46D] disabled:opacity-30"
          aria-label="Previous collection"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono opacity-60 tracking-wider">
          Swipe or tap arrows
        </span>

        <button
          type="button"
          disabled={isExiting}
          onClick={handleNext}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:opacity-100 opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-[#C5A46D] disabled:opacity-30"
          aria-label="Next collection"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
