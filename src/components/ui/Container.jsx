import React from 'react';

/**
 * Reusable Responsive Container Primitive
 * 
 * Ensures consistent horizontal gutters across 320px mobile up to 1440px wide screens.
 */
export function Container({
  children,
  size = 'default',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const sizeStyles = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1440px]',
    full: 'max-w-full',
  };

  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 ${sizeStyles[size] || sizeStyles.default} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
