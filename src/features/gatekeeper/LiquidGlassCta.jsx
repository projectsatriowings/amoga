import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * LiquidGlassCta Component
 * 
 * Unified frosted-glass pill CTA button for the Amoga Gatekeeper homepage.
 * Shared color, glassmorphism effect, dimensions, typography, and hover behavior
 * across all four collection panels (Wholesome Pantry, Wellness Tea, Heritage Sarees, Sterling Silver).
 */
export const LiquidGlassCta = React.forwardRef(function LiquidGlassCta(
  {
    collectionId = 'food',
    label = 'Explore Collection',
    onClick,
    disabled = false,
    className = '',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-10 rounded-full border border-white/60 hover:border-white/80 bg-white/50 hover:bg-white/70 active:bg-white/60 text-[#111215] text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ease-out select-none active:scale-95 shadow-[0_4px_14px_0_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      aria-label={`${label} — Enter ${collectionId} storefront`}
      {...props}
    >
      <span className="relative z-10">{label}</span>
      <ArrowRight
        className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 shrink-0 text-current"
        aria-hidden="true"
      />
    </button>
  );
});
