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
    collectionId,
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
    food: 'bg-[#172B1C]/5 hover:bg-[#172B1C]/10 text-[#172B1C] border-[#172B1C]/15 focus-visible:ring-[#287A25] shadow-sm',
    tea: 'bg-[#2C1E11]/5 hover:bg-[#2C1E11]/10 text-[#2C1E11] border-[#B88E38]/40 focus-visible:ring-[#B88E38] shadow-sm',
    sarees: 'bg-[#C5A46D]/15 hover:bg-[#C5A46D]/25 text-[#F6EBD8] border-[#C5A46D]/30 focus-visible:ring-[#C5A46D] shadow-md',
    jewellery: 'bg-white/10 hover:bg-white/20 text-[#F4F4F2] border-white/20 focus-visible:ring-[#C6C8CD] shadow-md',
  };

  const styleClass = glassStyles[collectionId] || glassStyles.jewellery;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border text-xs sm:text-sm font-medium tracking-wider uppercase transition-all duration-300 ease-out select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styleClass} ${className}`}
      aria-label={`${label} — Enter ${collectionId} storefront`}
      {...props}
    >
      <span className="relative z-10">{label}</span>
      <ArrowRight
        className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1 shrink-0"
        aria-hidden="true"
      />
    </button>
  );
});
