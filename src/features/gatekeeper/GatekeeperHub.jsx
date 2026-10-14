import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { COLLECTIONS } from '../../data/collections';
import { GatekeeperPanel } from './GatekeeperPanel';
import { GatekeeperMobile } from './GatekeeperMobile';
import { GlobalProfileMenu } from '../../components/layout/GlobalProfileMenu';

/**
 * Cinematic Tri-Fold Gatekeeper (Phase 2)
 * 
 * Features:
 * 1. 100svh full-viewport three-panel vertical layout on desktop.
 * 2. Animated flex redistribution (1.0 : 1.0 : 1.0 -> 2.2 : 0.4 : 0.4) on hover.
 * 3. Exact Amoga logo integration preserved in floating high-contrast header.
 * 4. Liquid-glass CTA pills tailored for each collection.
 * 5. Cinematic fade-out exit transition with luxury spinner ("Taking you to your collection...").
 * 6. Responsive mobile/touch carousel with swipe gestures and accessible pagination.
 * 7. Full keyboard navigation (Arrow keys, Tab, Enter).
 */
export function GatekeeperHub() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Dynamic collections loaded from database with cached persistence and static fallbacks
  const [liveCollections, setLiveCollections] = useState(() => {
    try {
      const cached = sessionStorage.getItem('amoga_gatekeeper_collections');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return COLLECTIONS;
  });

  useEffect(() => {
    let isMounted = true;
    async function loadCollections() {
      try {
        const res = await fetch('/api/collections');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const merged = json.data.map((dbCol, idx) => {
            const staticMatch = COLLECTIONS.find(
              (c) => c.id === dbCol.id || c.path === `/${dbCol.slug}`
            );
            return {
              ...(staticMatch || {}),
              id: dbCol.id,
              name: dbCol.name,
              title: (dbCol.heroHeading || dbCol.name || (staticMatch ? staticMatch.title : 'COLLECTION')).toUpperCase(),
              tagline: dbCol.tagline || (staticMatch ? staticMatch.tagline : 'Curated Universe'),
              eyebrow: (dbCol.tagline || (staticMatch ? staticMatch.eyebrow : 'THE GOODNESS OF TRADITION')).toUpperCase(),
              subtitle: dbCol.heroSubheading || (staticMatch ? staticMatch.subtitle : ''),
              description: dbCol.description || (staticMatch ? staticMatch.description : 'Explore handcrafted artisanal curation.'),
              accentColor: dbCol.accentColor || (staticMatch ? staticMatch.accentColor : '#722F37'),
              path: `/${dbCol.slug}`,
              productsPath: `/${dbCol.slug}/products`,
              theme: dbCol.theme || dbCol.id,
              heroImage: dbCol.cardImage || dbCol.heroImage || staticMatch?.heroImage || null,
              cardImage: dbCol.cardImage || dbCol.heroImage || staticMatch?.cardImage || null,
              themeConfig: dbCol.themeConfig || null,
              number: String(idx + 1).padStart(2, '0'),
              features: staticMatch?.features || ['Artisanal Heritage', 'Authentic Sourcing', 'Verified Catalogue'],
              badge: staticMatch?.badge || 'Curated Collection',
              ctaText: 'EXPLORE COLLECTION',
            };
          });

          if (isMounted) {
            setLiveCollections(merged);
            try {
              sessionStorage.setItem('amoga_gatekeeper_collections', JSON.stringify(merged));
            } catch {
              // Ignore sessionStorage errors
            }
          }
        }
      } catch (err) {
        console.error('Failed to load collections from API, using defaults:', err);
      }
    }

    loadCollections();

    // Listen to cross-tab updates via BroadcastChannel
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('amoga_collections_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'COLLECTIONS_INVALIDATED') {
            loadCollections();
          }
        };
      } catch {
        // Non-blocking
      }
    }

    // When user switches back to this tab, silently revalidate
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCollections();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (channel) {
        channel.close();
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // Desktop hover state
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Mobile active index
  const [mobileIndex, setMobileIndex] = useState(0);

  // Exit transition states
  const [isExiting, setIsExiting] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e) => {
      if (isExiting) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHoveredIndex((prev) => (prev === null ? 0 : (prev + 1) % liveCollections.length));
        setMobileIndex((prev) => (prev + 1) % liveCollections.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHoveredIndex((prev) =>
          prev === null ? liveCollections.length - 1 : (prev - 1 + liveCollections.length) % liveCollections.length
        );
        setMobileIndex((prev) => (prev - 1 + liveCollections.length) % liveCollections.length);
      } else if (e.key === 'Escape') {
        setHoveredIndex(null);
      }
    },
    [isExiting, liveCollections.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Navigate to chosen storefront with cinematic exit transition
  const handleCollectionSelect = (collection) => {
    if (isExiting) return;
    setIsExiting(true);
    setSelectedTarget(collection);

    // Coordinate exit transition duration with navigation
    const transitionDelay = prefersReducedMotion ? 50 : 520;
    setTimeout(() => {
      navigate(collection.path);
    }, transitionDelay);
  };

  return (
    <main
      className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[#0c0d10] select-none"
      aria-label="Amoga Collections Gatekeeper"
    >
      {/* Floating Brand Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 sm:px-10 py-5 flex items-center justify-between pointer-events-none">
        {/* Exact Amoga Brand Logo (Transparent) */}
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
            title="Amoga Unified Home"
          >
            <img
              src={amogaLogo}
              alt="Amoga"
              className="h-8 sm:h-10 w-auto object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            />
          </Link>
        </div>

        {/* Ambient Tagline / Visual Context & Profile Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-[0.2em] text-[#F4F4F2]/80 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {liveCollections.length} Curated Universes
          </span>
          <GlobalProfileMenu
            buttonStyle={{ color: '#F4F4F2' }}
            triggerClassName="bg-black/35 backdrop-blur-md border border-white/10 hover:bg-white/15 text-white"
          />
        </div>
      </header>

      {/* Desktop Multi-Panel View (>= 768px) */}
      <div
        className="hidden md:flex h-full w-full flex-row overflow-hidden"
        onMouseLeave={() => !isExiting && setHoveredIndex(null)}
      >
        {liveCollections.map((col, idx) => (
          <GatekeeperPanel
            key={col.id}
            collection={col}
            index={idx}
            total={liveCollections.length}
            isHovered={hoveredIndex === idx}
            isAnyHovered={hoveredIndex !== null}
            isExiting={isExiting}
            onHover={(i) => !isExiting && setHoveredIndex(i)}
            onLeave={() => !isExiting && setHoveredIndex(null)}
            onSelect={handleCollectionSelect}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Mobile Swipeable / Tabbed View (< 768px) */}
      <GatekeeperMobile
        collections={liveCollections}
        activeIndex={mobileIndex}
        onChangeIndex={setMobileIndex}
        onSelect={handleCollectionSelect}
        isExiting={isExiting}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Cinematic Exit Transition Overlay (Step 5 in Reference Storyboard) */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0e]/95 backdrop-blur-xl text-white p-6"
            aria-live="assertive"
            role="status"
          >
            {/* Center Circular Luxury Spinner matching Reference */}
            <div className="relative mb-6">
              <div className="w-12 h-12 rounded-full border-2 border-white/15 border-t-[#C5A46D] animate-spin" />
            </div>

            {/* Transition Status Text */}
            <h2 className="text-sm sm:text-base font-light tracking-widest text-[#F4F4F2] uppercase font-sans">
              Taking you to your collection...
            </h2>

            {selectedTarget && (
              <p className="mt-2 text-xs font-mono tracking-wider text-[#C5A46D] opacity-90">
                {selectedTarget.name} &bull; {selectedTarget.tagline}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
