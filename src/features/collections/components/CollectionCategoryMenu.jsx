import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isDarkColor } from '../themeConfig';

export function CollectionCategoryMenu({
  isOpen,
  onClose,
  categories = [],
  palette = {},
  anchorRef,
  collectionId,
}) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const menuRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        anchorRef?.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  const motionVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -8,
      scale: prefersReducedMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.16,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -6,
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.12,
        ease: 'easeIn',
      },
    },
  };

  // Determine dark background context for high contrast guarantee
  const isMenuDark =
    collectionId === 'sarees' ||
    collectionId === 'jewellery' ||
    palette.cardBg === '#35121F' ||
    palette.cardBg === '#343238' ||
    palette.bg === '#2C0E1A' ||
    palette.bg === '#242326' ||
    isDarkColor(palette.cardBg) ||
    isDarkColor(palette.bg);

  const isSarees =
    collectionId === 'sarees' ||
    palette.cardBg === '#35121F' ||
    palette.bg === '#2C0E1A';

  const isJewellery =
    collectionId === 'jewellery' ||
    palette.cardBg === '#343238' ||
    palette.bg === '#242326';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-label="Category Navigation"
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute top-full left-0 mt-2.5 w-80 rounded-2xl border shadow-2xl backdrop-blur-md z-50 p-2 overflow-hidden"
          style={{
            backgroundColor: isMenuDark
              ? (isSarees ? '#35121F' : '#2A292D')
              : (palette.cardBg || '#FFFFFF'),
            borderColor: isMenuDark
              ? (isSarees ? 'rgba(197, 164, 109, 0.4)' : 'rgba(185, 184, 181, 0.35)')
              : (palette.border || '#E5E0D5'),
            color: isMenuDark ? '#F6EBD8' : (palette.text || '#292820'),
          }}
        >
          {/* Menu Section Header */}
          <div
            className="px-3 py-2 border-b mb-1.5 flex items-center justify-between"
            style={{
              borderColor: isMenuDark
                ? (isSarees ? 'rgba(197, 164, 109, 0.25)' : 'rgba(185, 184, 181, 0.25)')
                : (palette.border || '#E5E0D5'),
            }}
          >
            <span
              className="text-[10px] font-mono uppercase tracking-widest font-semibold"
              style={{
                color: isMenuDark
                  ? (isSarees ? '#C5A46D' : '#D4AF37')
                  : (palette.accent || palette.accentGold || '#3F7B43'),
              }}
            >
              Select Category
            </span>
            <span
              className="text-[10px] font-mono font-medium"
              style={{
                color: isMenuDark
                  ? (isSarees ? '#D8C6AD' : '#C0C2C5')
                  : (palette.mutedText || '#65675A'),
                opacity: 0.9,
              }}
            >
              {categories.length} sections
            </span>
          </div>

          {/* Category Item Links */}
          <div className="space-y-1">
            {categories.map((cat) => {
              const label =
                cat.name ||
                cat.title ||
                cat.label ||
                cat.categoryName ||
                (cat.id === 'all'
                  ? (isSarees ? 'All Sarees & Attire' : isJewellery ? 'All Jewellery' : 'All Products')
                  : cat.id);

              const subtitle = cat.tagline || cat.description || cat.subtitle || '';
              const isAll = cat.id === 'all';
              const isItemActive = isAll
                ? location.pathname.endsWith('/products') && !location.search
                : location.search.includes(`category=${cat.id}`);
              const isHovered = hoveredId === cat.id;

              // Row background calculation
              let rowBg = 'transparent';
              if (isItemActive) {
                rowBg = isMenuDark
                  ? (isSarees ? '#F6EBD8' : '#F7F3EB')
                  : (palette.heading || '#173B2A');
              } else if (isHovered) {
                rowBg = isMenuDark
                  ? (isSarees ? 'rgba(197, 164, 109, 0.16)' : 'rgba(255, 255, 255, 0.1)')
                  : 'rgba(0, 0, 0, 0.05)';
              }

              // Label text color:
              // If row background is cream (on dark menu), use dark burgundy/charcoal for strong contrast
              let labelColor = isMenuDark ? '#F6EBD8' : (palette.heading || '#173B2A');
              if (isItemActive) {
                labelColor = isMenuDark
                  ? (isSarees ? '#2C0E1A' : '#1A191C')
                  : '#FFFFFF';
              } else if (isHovered) {
                labelColor = isMenuDark ? '#FFFFFF' : (palette.heading || '#173B2A');
              }

              // Subtitle text color
              let subtitleColor = isMenuDark
                ? (isSarees ? '#D8C6AD' : '#C0C2C5')
                : (palette.mutedText || '#65675A');
              if (isItemActive) {
                subtitleColor = isMenuDark
                  ? (isSarees ? '#5C1D33' : '#3F4246')
                  : 'rgba(255, 255, 255, 0.85)';
              } else if (isHovered) {
                subtitleColor = isMenuDark
                  ? (isSarees ? '#F6EBD8' : '#F7F3EB')
                  : (palette.text || '#292820');
              }

              // Badge background & text
              let badgeBg = isMenuDark
                ? (isSarees ? 'rgba(197, 164, 109, 0.22)' : 'rgba(255, 255, 255, 0.14)')
                : (palette.accentLight || 'rgba(0, 0, 0, 0.06)');
              let badgeColor = isMenuDark
                ? (isSarees ? '#F6EBD8' : '#F7F3EB')
                : (palette.heading || '#173B2A');
              if (isItemActive) {
                badgeBg = isMenuDark
                  ? (isSarees ? 'rgba(44, 14, 26, 0.12)' : 'rgba(26, 25, 28, 0.12)')
                  : 'rgba(255, 255, 255, 0.25)';
                badgeColor = isMenuDark
                  ? (isSarees ? '#2C0E1A' : '#1A191C')
                  : '#FFFFFF';
              } else if (isHovered) {
                badgeBg = isMenuDark
                  ? (isSarees ? 'rgba(197, 164, 109, 0.32)' : 'rgba(255, 255, 255, 0.22)')
                  : 'rgba(0, 0, 0, 0.1)';
                badgeColor = isMenuDark ? '#FFFFFF' : (palette.heading || '#173B2A');
              }

              // Indicator dot on active row
              const dotColor = isItemActive
                ? (isMenuDark
                    ? (isSarees ? '#8A243A' : '#242326')
                    : (palette.accent || '#FFFFFF'))
                : 'transparent';

              // Chevron icon color
              let chevronColor = isMenuDark
                ? (isSarees ? 'rgba(197, 164, 109, 0.7)' : 'rgba(185, 184, 181, 0.7)')
                : 'rgba(0, 0, 0, 0.4)';
              if (isItemActive) {
                chevronColor = isMenuDark
                  ? (isSarees ? '#2C0E1A' : '#1A191C')
                  : '#FFFFFF';
              } else if (isHovered) {
                chevronColor = isMenuDark
                  ? (isSarees ? '#C5A46D' : '#F7F3EB')
                  : (palette.accent || '#3F7B43');
              }

              return (
                <Link
                  key={cat.id}
                  to={cat.path}
                  role="menuitem"
                  onClick={onClose}
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(cat.id)}
                  onBlur={() => setHoveredId(null)}
                  className="group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    backgroundColor: rowBg,
                    color: labelColor,
                  }}
                >
                  <div className="pr-2 min-w-0">
                    <div className="font-semibold flex items-center gap-1.5 leading-snug">
                      <span className="truncate" style={{ color: labelColor }}>
                        {label}
                      </span>
                      {isItemActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: dotColor }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {subtitle && (
                      <div
                        className="text-[11px] line-clamp-1 mt-0.5 leading-tight transition-colors"
                        style={{ color: subtitleColor }}
                      >
                        {subtitle}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {cat.count !== undefined && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold transition-colors"
                        style={{
                          backgroundColor: badgeBg,
                          color: badgeColor,
                        }}
                      >
                        {cat.count}
                      </span>
                    )}
                    <ChevronRight
                      className="w-3.5 h-3.5 transition-all duration-150 group-hover:translate-x-0.5"
                      style={{ color: chevronColor }}
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
