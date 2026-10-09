import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingIndicator Primitive
 * 
 * Supports variants: 'spinner' | 'pulse' | 'bar'
 * Accessible with role="status" and sr-only message.
 */
export function LoadingIndicator({
  variant = 'spinner',
  size = 'md',
  message = 'Loading Amoga collection...',
  className = '',
  collection,
}) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const accentColorClass =
    collection === 'food'
      ? 'text-[#287A25]'
      : collection === 'sarees'
      ? 'text-[#C5A46D]'
      : collection === 'jewellery'
      ? 'text-[#C6C8CD]'
      : 'text-theme-accent';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-3 ${className}`}
    >
      {variant === 'spinner' && (
        <Loader2 className={`animate-spin ${sizeMap[size] || sizeMap.md} ${accentColorClass}`} />
      )}

      {variant === 'pulse' && (
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${accentColorClass} bg-current`} />
          <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${accentColorClass} bg-current`} />
          <span className={`w-2 h-2 rounded-full animate-bounce ${accentColorClass} bg-current`} />
        </div>
      )}

      {variant === 'bar' && (
        <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full w-1/2 rounded-full animate-pulse ${accentColorClass} bg-current`} />
        </div>
      )}

      <span className="sr-only">{message}</span>
    </div>
  );
}
