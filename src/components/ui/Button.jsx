import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Primitive
 * 
 * Supports variants: primary | secondary | outline | text
 * Supports sizes: sm | md | lg
 * Collection-aware styling via CSS custom properties or explicit collection prop
 */
export const Button = React.forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    collection,
    isLoading = false,
    disabled = false,
    className = '',
    leftIcon,
    rightIcon,
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-normal ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-sm tracking-wide gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-sm tracking-wide gap-2',
    lg: 'text-base px-7 py-3 rounded-md tracking-wider gap-2.5 uppercase font-semibold',
  };

  // Specific collection styling overrides if passed directly
  const collectionOverrides = {
    food: {
      primary: 'bg-[#287A25] text-white hover:bg-[#1E5C1B] focus-visible:ring-[#287A25] shadow-sm',
      secondary: 'bg-[#EAE6D9] text-[#172B1C] hover:bg-[#DCD6C5] focus-visible:ring-[#287A25]',
      outline: 'border border-[#287A25] text-[#287A25] hover:bg-[#287A25]/10 focus-visible:ring-[#287A25]',
      text: 'text-[#287A25] hover:text-[#1E5C1B] hover:bg-[#287A25]/5 underline-offset-4 hover:underline',
    },
    sarees: {
      primary: 'bg-[#C5A46D] text-[#2C0E1A] hover:bg-[#D9BB85] focus-visible:ring-[#C5A46D] shadow-md font-semibold',
      secondary: 'bg-[#451523] text-[#F6EBD8] hover:bg-[#571B2D] focus-visible:ring-[#C5A46D] border border-[#C5A46D]/20',
      outline: 'border border-[#C5A46D] text-[#C5A46D] hover:bg-[#C5A46D]/15 focus-visible:ring-[#C5A46D]',
      text: 'text-[#C5A46D] hover:text-[#F6EBD8] hover:bg-[#C5A46D]/10 underline-offset-4 hover:underline',
    },
    jewellery: {
      primary: 'bg-[#F4F4F2] text-[#111215] hover:bg-white focus-visible:ring-[#C6C8CD] shadow-sm',
      secondary: 'bg-[#1C1D20] text-[#F4F4F2] hover:bg-[#27282D] focus-visible:ring-[#C6C8CD] border border-[#C6C8CD]/20',
      outline: 'border border-[#C6C8CD]/60 text-[#F4F4F2] hover:bg-white/10 hover:border-white focus-visible:ring-[#C6C8CD]',
      text: 'text-[#C6C8CD] hover:text-white hover:bg-white/5 underline-offset-4 hover:underline',
    },
  };

  const defaultVariantStyles = {
    primary:
      'bg-theme-accent text-white hover:opacity-90 focus-visible:ring-theme-ring shadow-sm',
    secondary:
      'bg-theme-surface text-theme-text hover:bg-theme-elevated border border-theme-border focus-visible:ring-theme-ring',
    outline:
      'border border-theme-border text-theme-text hover:bg-white/5 focus-visible:ring-theme-ring',
    text:
      'text-theme-text hover:text-white hover:bg-white/5 underline-offset-4 hover:underline',
  };

  const variantClass = collection && collectionOverrides[collection]
    ? collectionOverrides[collection][variant]
    : defaultVariantStyles[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});
