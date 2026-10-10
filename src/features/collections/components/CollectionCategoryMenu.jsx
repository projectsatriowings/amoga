import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export function CollectionCategoryMenu({
  isOpen,
  onClose,
  categories = [],
  palette = {},
  anchorRef,
}) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const menuRef = useRef(null);

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
          className="absolute top-full left-0 mt-2.5 w-72 rounded-2xl border shadow-xl backdrop-blur-md z-50 p-2 overflow-hidden"
          style={{
            backgroundColor: palette.cardBg || '#FFFFFF',
            borderColor: palette.border || '#E5E0D5',
            color: palette.text || '#292820',
          }}
        >
          <div className="px-3 py-2 border-b mb-1 flex items-center justify-between" style={{ borderColor: palette.border || '#E5E0D5' }}>
            <span
              className="text-[10px] font-mono uppercase tracking-widest font-semibold"
              style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
            >
              Select Category
            </span>
            <span className="text-[10px] opacity-60 font-mono">
              {categories.length} sections
            </span>
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const isAll = cat.id === 'all';
              const isItemActive = isAll
                ? location.pathname.endsWith('/products') && !location.search
                : location.search.includes(`category=${cat.id}`);

              return (
                <Link
                  key={cat.id}
                  to={cat.path}
                  role="menuitem"
                  onClick={onClose}
                  className="group flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors"
                  style={{
                    backgroundColor: isItemActive
                      ? palette.heading || '#173B2A'
                      : 'transparent',
                    color: isItemActive
                      ? palette.announcementText || '#FFFFFF'
                      : palette.text || '#292820',
                  }}
                >
                  <div className="pr-2">
                    <div className="font-medium flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      {isItemActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: palette.accent || palette.accentGold || '#FFF' }}
                        />
                      )}
                    </div>
                    {cat.tagline && (
                      <div
                        className="text-[11px] line-clamp-1 mt-0.5 opacity-70 group-hover:opacity-90"
                      >
                        {cat.tagline}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {cat.count !== undefined && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isItemActive
                            ? 'rgba(255, 255, 255, 0.2)'
                            : palette.accentLight || 'rgba(0, 0, 0, 0.05)',
                          color: isItemActive
                            ? '#FFFFFF'
                            : palette.heading || '#173B2A',
                        }}
                      >
                        {cat.count}
                      </span>
                    )}
                    <ChevronRight
                      className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
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
