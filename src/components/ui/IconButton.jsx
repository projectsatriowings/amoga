import React from 'react';

/**
 * Reusable IconButton Primitive
 * 
 * Accessible icon button requiring an accessible `aria-label` or `label`.
 * Supports sm, md, lg sizes and varied visual treatments.
 */
export const IconButton = React.forwardRef(function IconButton(
  {
    icon,
    label,
    'aria-label': ariaLabel,
    variant = 'ghost',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const accessibleName = ariaLabel || label;

  if (!accessibleName && process.env.NODE_ENV !== 'production') {
    console.warn('IconButton: An accessible label or aria-label prop is required for accessibility.');
  }

  const baseStyles =
    'inline-flex items-center justify-center rounded-full transition-all duration-normal ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95';

  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5 text-xs',
    md: 'w-10 h-10 p-2 text-sm',
    lg: 'w-12 h-12 p-2.5 text-base',
  };

  const variantStyles = {
    ghost: 'text-theme-text hover:bg-white/10 hover:text-white',
    outline: 'border border-theme-border text-theme-text hover:border-theme-border-strong hover:bg-white/5',
    filled: 'bg-theme-surface text-theme-text hover:bg-theme-elevated border border-theme-border',
  };

  return (
    <button
      ref={ref}
      type={type}
      aria-label={accessibleName}
      title={accessibleName}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
});
