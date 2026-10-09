import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Botanical Vector Illustrations for Amoga Tea Collection
 * Handcrafted SVG motifs representing the 5 signature botanical tea sources:
 * 1. Hibiscus Flower (Hibiscus sabdariffa)
 * 2. Butterfly Pea Flower (Clitoria ternatea)
 * 3. Sarsaparilla Root (Hemidesmus indicus)
 * 4. Ceylon Cinnamon Quills (Cinnamomum verum)
 * 5. Moringa Blossom Cluster (Moringa oleifera)
 */

function HibiscusFlowerSvg({ className = 'w-24 h-24 text-[#B88E38]' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Central stigma & stamen column */}
      <path d="M50 50 Q50 25 54 12" strokeWidth="1.5" />
      <circle cx="54" cy="12" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="51" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="56" cy="19" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="49" cy="22" r="1.5" fill="currentColor" opacity="0.6" />

      {/* 5 Organic overlapping petals */}
      <path
        d="M50 50 C42 40 28 42 22 52 C17 60 22 72 32 74 C40 75 46 62 50 50 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M50 50 C44 60 48 76 56 82 C65 88 78 82 80 72 C81 61 68 54 50 50 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M50 50 C58 56 74 58 82 50 C90 42 86 28 75 25 C64 22 56 38 50 50 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M50 50 C54 38 50 24 40 18 C30 12 18 18 16 30 C15 42 34 46 50 50 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M50 50 C38 48 24 35 30 24 C36 14 50 16 58 26 C62 32 58 44 50 50 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />

      {/* Internal delicate venation */}
      <path d="M26 60 Q34 60 46 52" strokeWidth="0.8" opacity="0.4" />
      <path d="M64 72 Q60 62 52 52" strokeWidth="0.8" opacity="0.4" />
      <path d="M72 40 Q62 44 52 48" strokeWidth="0.8" opacity="0.4" />
      <path d="M30 30 Q38 38 48 48" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function ButterflyPeaFlowerSvg({ className = 'w-24 h-24 text-[#8C6320]' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Outer broad standard petal (flared bell) */}
      <path
        d="M50 82 C30 82 18 64 20 44 C22 26 36 16 50 16 C64 16 78 26 80 44 C82 64 70 82 50 82 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Notch at apex */}
      <path d="M50 16 Q50 24 50 30" strokeWidth="1" opacity="0.5" />

      {/* Inner keel and wing petals */}
      <path
        d="M50 78 C40 74 34 62 36 50 C38 38 46 34 50 34 C54 34 62 38 64 50 C66 62 60 74 50 78 Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Golden throat radiation lines */}
      <path d="M50 48 Q44 56 42 66" strokeWidth="0.8" opacity="0.5" />
      <path d="M50 48 Q50 60 50 70" strokeWidth="0.8" opacity="0.6" />
      <path d="M50 48 Q56 56 58 66" strokeWidth="0.8" opacity="0.5" />

      {/* Stem and sepals */}
      <path d="M50 82 Q50 92 48 96" strokeWidth="1.5" />
      <path d="M44 84 Q48 88 50 82 Q52 88 56 84" strokeWidth="1" />
    </svg>
  );
}

function SarsaparillaRootSvg({ className = 'w-24 h-24 text-[#B88E38]' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Main twisting primary root */}
      <path
        d="M50 8 Q42 22 54 36 T46 56 T56 78 T48 94"
        strokeWidth="2.2"
        fill="none"
      />
      {/* Secondary intertwining root */}
      <path
        d="M48 18 Q58 30 46 44 T54 66 T44 86"
        strokeWidth="1.4"
        strokeDasharray="2 3"
        opacity="0.6"
      />

      {/* Branching herbal rootlets */}
      <path d="M52 30 Q68 28 76 34" strokeWidth="1" opacity="0.7" />
      <path d="M70 31 Q80 34 84 40" strokeWidth="0.8" opacity="0.5" />
      <path d="M47 48 Q32 46 22 54" strokeWidth="1" opacity="0.7" />
      <path d="M28 50 Q20 56 16 64" strokeWidth="0.8" opacity="0.5" />
      <path d="M54 70 Q66 74 74 82" strokeWidth="1" opacity="0.6" />
      <path d="M49 82 Q38 86 32 92" strokeWidth="0.8" opacity="0.6" />

      {/* Natural root knots */}
      <circle cx="52" cy="34" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="48" cy="54" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="55" cy="74" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function CinnamonStickSvg({ className = 'w-24 h-24 text-[#8C6320]' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Rolled outer bark quill */}
      <g transform="rotate(-25 50 50)">
        {/* Main bark tube */}
        <rect
          x="30"
          y="20"
          width="40"
          height="60"
          rx="6"
          fill="currentColor"
          fillOpacity="0.06"
        />
        <line x1="30" y1="20" x2="30" y2="80" strokeWidth="1.8" />
        <line x1="70" y1="20" x2="70" y2="80" strokeWidth="1.8" />

        {/* Top spiral curl opening */}
        <ellipse cx="50" cy="20" rx="20" ry="6" strokeWidth="1.5" />
        <path d="M40 18 Q50 14 60 20 Q55 24 45 22" strokeWidth="1.2" />

        {/* Bottom edge ellipse */}
        <ellipse cx="50" cy="80" rx="20" ry="6" strokeWidth="1.5" />

        {/* Textured woody striations */}
        <path d="M38 28 L38 72" strokeWidth="0.8" strokeDasharray="6 8" opacity="0.4" />
        <path d="M48 25 L48 75" strokeWidth="0.8" strokeDasharray="10 6" opacity="0.5" />
        <path d="M58 27 L58 73" strokeWidth="0.8" strokeDasharray="8 8" opacity="0.4" />
      </g>
    </svg>
  );
}

function MoringaFlowerSvg({ className = 'w-24 h-24 text-[#B88E38]' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Central slender floral branch */}
      <path d="M15 85 Q45 60 80 20" strokeWidth="1.5" />

      {/* Leaflet pairs */}
      <ellipse cx="32" cy="74" rx="6" ry="3" transform="rotate(-30 32 74)" fill="currentColor" fillOpacity="0.1" />
      <ellipse cx="44" cy="62" rx="6" ry="3" transform="rotate(40 44 62)" fill="currentColor" fillOpacity="0.1" />
      <ellipse cx="56" cy="48" rx="6" ry="3" transform="rotate(-25 56 48)" fill="currentColor" fillOpacity="0.1" />
      <ellipse cx="68" cy="34" rx="5" ry="2.5" transform="rotate(35 68 34)" fill="currentColor" fillOpacity="0.1" />

      {/* Blossom 1 (Top star) */}
      <g transform="translate(75, 18)">
        <circle cx="0" cy="0" r="2" fill="currentColor" opacity="0.7" />
        <ellipse cx="0" cy="-7" rx="3" ry="5" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="6" cy="-3" rx="3" ry="5" transform="rotate(70 6 -3)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="4" cy="5" rx="3" ry="5" transform="rotate(140 4 5)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="-4" cy="5" rx="3" ry="5" transform="rotate(-140 -4 5)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="-6" cy="-3" rx="3" ry="5" transform="rotate(-70 -6 -3)" fill="currentColor" fillOpacity="0.1" />
      </g>

      {/* Blossom 2 (Side floret) */}
      <g transform="translate(50, 40) scale(0.75)">
        <circle cx="0" cy="0" r="2" fill="currentColor" opacity="0.7" />
        <ellipse cx="0" cy="-6" rx="2.5" ry="4" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="5" cy="-2" rx="2.5" ry="4" transform="rotate(70 5 -2)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="3" cy="4" rx="2.5" ry="4" transform="rotate(140 3 4)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="-3" cy="4" rx="2.5" ry="4" transform="rotate(-140 -3 4)" fill="currentColor" fillOpacity="0.1" />
        <ellipse cx="-5" cy="-2" rx="2.5" ry="4" transform="rotate(-70 -5 -2)" fill="currentColor" fillOpacity="0.1" />
      </g>
    </svg>
  );
}

/**
 * BotanicalSideAnimations Component
 * 
 * Flanks the Tea Collection page along left and right gutters with subtle,
 * floating botanical illustrations. Staggered organic motion delays,
 * strictly behind main content (pointer-events-none, z-0), and respects
 * prefers-reduced-motion.
 */
export function BotanicalSideAnimations() {
  const prefersReducedMotion = useReducedMotion();

  // Floating animation configs with organic durations and slight rotations
  const floatAnimationLeft1 = prefersReducedMotion
    ? {}
    : {
        y: [-12, 14, -12],
        rotate: [-3, 4, -3],
        transition: {
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatAnimationLeft2 = prefersReducedMotion
    ? {}
    : {
        y: [10, -14, 10],
        rotate: [3, -3, 3],
        transition: {
          duration: 18,
          delay: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatAnimationLeft3 = prefersReducedMotion
    ? {}
    : {
        y: [-8, 12, -8],
        rotate: [-2, 3, -2],
        transition: {
          duration: 16,
          delay: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatAnimationRight1 = prefersReducedMotion
    ? {}
    : {
        y: [12, -12, 12],
        rotate: [4, -4, 4],
        transition: {
          duration: 17,
          delay: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatAnimationRight2 = prefersReducedMotion
    ? {}
    : {
        y: [-14, 10, -14],
        rotate: [-3, 3, -3],
        transition: {
          duration: 21,
          delay: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatAnimationRight3 = prefersReducedMotion
    ? {}
    : {
        y: [8, -10, 8],
        rotate: [2, -2, 2],
        transition: {
          duration: 15,
          delay: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Left Flank Motifs (Hidden on mobile to avoid clutter/layout shift) */}
      <div className="hidden lg:flex flex-col justify-around absolute left-2 xl:left-6 top-16 bottom-16 w-32 opacity-35">
        {/* 1. Hibiscus Flower */}
        <motion.div
          animate={floatAnimationLeft1}
          className="flex flex-col items-center"
        >
          <HibiscusFlowerSvg className="w-24 h-24 text-[#8C6320]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#8C6320]/60 mt-1">
            Hibiscus
          </span>
        </motion.div>

        {/* 2. Cinnamon Stick */}
        <motion.div
          animate={floatAnimationLeft2}
          className="flex flex-col items-center my-16"
        >
          <CinnamonStickSvg className="w-22 h-22 text-[#B88E38]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#B88E38]/60 mt-1">
            Cinnamon
          </span>
        </motion.div>

        {/* 3. Moringa Blossoms */}
        <motion.div
          animate={floatAnimationLeft3}
          className="flex flex-col items-center"
        >
          <MoringaFlowerSvg className="w-24 h-24 text-[#8C6320]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#8C6320]/60 mt-1">
            Moringa
          </span>
        </motion.div>
      </div>

      {/* Right Flank Motifs */}
      <div className="hidden lg:flex flex-col justify-around absolute right-2 xl:right-6 top-20 bottom-20 w-32 opacity-35">
        {/* 4. Butterfly Blue Pea */}
        <motion.div
          animate={floatAnimationRight1}
          className="flex flex-col items-center"
        >
          <ButterflyPeaFlowerSvg className="w-24 h-24 text-[#8C6320]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#8C6320]/60 mt-1">
            Blue Pea
          </span>
        </motion.div>

        {/* 5. Sarsaparilla Root */}
        <motion.div
          animate={floatAnimationRight2}
          className="flex flex-col items-center my-16"
        >
          <SarsaparillaRootSvg className="w-22 h-22 text-[#B88E38]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#B88E38]/60 mt-1">
            Sarsaparilla
          </span>
        </motion.div>

        {/* Extra Hibiscus accent at lower right for visual balance */}
        <motion.div
          animate={floatAnimationRight3}
          className="flex flex-col items-center"
        >
          <HibiscusFlowerSvg className="w-20 h-20 text-[#8C6320]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#8C6320]/60 mt-1">
            Botanical
          </span>
        </motion.div>
      </div>
    </div>
  );
}
