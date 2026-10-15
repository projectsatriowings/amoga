import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Liquid-Glass CTA Button
 * 
 * Reusable frosted-glass pill CTA tailored for the Tri-Fold Gatekeeper.
 * Adapts visual contrast for light (Gourmet Food) vs dark (Sarees, Jewellery) panels.
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
  // Collection-specific contrast & glass treatments
  const glassStyles = {
    food: 'bg-[#173B2A] hover:bg-[#23533C] text-white border-[#173B2A] focus-visible:ring-[#287A25]',
    tea: 'bg-[#173B2A] hover:bg-[#23533C] text-[#FAF1BB] border-[#173B2A] focus-visible:ring-[#B88E38]',
    sarees: 'bg-[#C5A46D] hover:bg-[#D4B582] text-[#2C0E1A] border-[#C5A46D] focus-visible:ring-[#C5A46D]',
    jewellery: 'bg-white/95 hover:bg-white text-[#111215] border-white/60 focus-visible:ring-[#C6C8CD]',
  };

  const arrowColors = {
    food: 'text-[#A3C893]',
    tea: 'text-[#C4D89A]',
    sarees: 'text-[#2C0E1A]',
    jewellery: 'text-[#111215]',
  };

  const styleClass = glassStyles[collectionId] || glassStyles.food;
  const arrowColor = arrowColors[collectionId] || 'text-current';

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-10 rounded-full border text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ease-out select-none active:scale-95 shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styleClass} ${className}`}
      aria-label={`${label} — Enter ${collectionId} storefront`}
      {...props}
    >
      <span className="relative z-10">{label}</span>
      <ArrowRight
        className={`w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 shrink-0 ${arrowColor}`}
        aria-hidden="true"
      />
    </button>
  );
});
