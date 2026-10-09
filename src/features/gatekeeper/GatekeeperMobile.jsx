import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LiquidGlassCta } from './LiquidGlassCta';

/**
 * GatekeeperMobile Component
 * 
 * Mobile-first swipeable and tabbed experience (< 768px).
 * Displays one dominant collection at a time with touch gestures,
 * accessible prev/next controls, and visible progress indicators (01 / 03).
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

  const handlePrev = () => {
    if (isExiting) return;
    onChangeIndex((activeIndex - 1 + collections.length) % collections.length);
  };

  const handleNext = () => {
    if (isExiting) return;
    onChangeIndex((activeIndex + 1) % collections.length);
  };

  const themeConfig = {
    food: {
      bgColor: '#F1EDE4',
      textColor: '#172B1C',
      accentColor: '#287A25',
      eyebrowColor: '#287A25',
      descriptionColor: '#405244',
      titleFont: 'font-sans font-bold',
      gradientStop: 'from-[#F1EDE4] via-[#F1EDE4]/80 to-transparent',
    },
    tea: {
      bgColor: '#FAF1BB',
      textColor: '#2C1E11',
      accentColor: '#B88E38',
      eyebrowColor: '#8C6320',
      descriptionColor: '#543B25',
      titleFont: 'font-serif font-normal',
      gradientStop: 'from-[#FAF1BB] via-[#FAF1BB]/85 to-transparent',
    },
    sarees: {
      bgColor: '#2C0E1A',
      textColor: '#F6EBD8',
      accentColor: '#C5A46D',
      eyebrowColor: '#C5A46D',
      descriptionColor: '#D4C2A7',
      titleFont: 'font-serif font-normal',
    },
    jewellery: {
      bgColor: '#111215',
      textColor: '#F4F4F2',
      accentColor: '#C6C8CD',
      eyebrowColor: '#C6C8CD',
      descriptionColor: '#A7A8AD',
      titleFont: 'font-jakarta font-normal',
    },
  }[current.id] || {
    bgColor: '#FAF1BB',
    textColor: '#2C1E11',
    accentColor: '#B88E38',
    eyebrowColor: '#8C6320',
    descriptionColor: '#543B25',
    titleFont: 'font-serif font-normal',
    gradientStop: 'from-[#FAF1BB] via-[#FAF1BB]/85 to-transparent',
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
      <div className="w-full flex items-center justify-between gap-2 z-20 mb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md mx-auto">
          {collections.map((col, idx) => (
            <button
              key={col.id}
              type="button"
              disabled={isExiting}
              onClick={() => onChangeIndex(idx)}
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
            <div className="space-y-3 pt-2">
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

              <h2 className={`text-3xl sm:text-4xl uppercase tracking-tight ${themeConfig.titleFont}`}>
                {current.title}
              </h2>

              <div
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: themeConfig.eyebrowColor }}
              >
                {current.eyebrow}
              </div>

              <p
                className="text-xs sm:text-sm leading-relaxed max-w-sm pt-1"
                style={{ color: themeConfig.descriptionColor }}
              >
                {current.description}
              </p>
            </div>

            {/* Bottom Photography & CTA */}
            <div className="relative w-full h-56 sm:h-64 my-4 rounded-xl overflow-hidden shadow-lg border border-black/10 dark:border-white/10">
              <img
                src={current.heroImage}
                alt={`Amoga ${current.name}`}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Explore Button */}
            <div className="pt-2 flex items-center justify-between">
              <LiquidGlassCta
                collectionId={current.id}
                label={current.ctaText}
                disabled={isExiting}
                onClick={() => onSelect(current)}
                className="w-full justify-center py-3.5 text-sm"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls & Pagination */}
      <div className="flex items-center justify-between pt-4 border-t border-current/10 z-20">
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
