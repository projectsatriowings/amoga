import React from 'react';

/**
 * Reusable SectionHeading Primitive
 * 
 * Supports eyebrow, title, description, and alignment options.
 * Seamlessly adapts typography based on active collection.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  collection,
  className = '',
  titleClassName = '',
  eyebrowClassName = '',
  descriptionClassName = '',
}) {
  const alignmentStyles = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  // Heading font family classes matching design tokens
  const headingFontClass =
    collection === 'food'
      ? 'font-cormorant'
      : collection === 'sarees'
      ? 'font-serif'
      : collection === 'jewellery'
      ? 'font-jakarta'
      : 'font-display';

  // Eyebrow accent color matching collection
  const eyebrowColorClass =
    collection === 'food'
      ? 'text-[#287A25]'
      : collection === 'sarees'
      ? 'text-[#C5A46D]'
      : collection === 'jewellery'
      ? 'text-[#C6C8CD]'
      : 'text-theme-accent';

  return (
    <div className={`flex flex-col max-w-3xl ${alignmentStyles[align]} ${className}`}>
      {eyebrow && (
        <span
          className={`text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-2 ${eyebrowColorClass} ${eyebrowClassName}`}
        >
          {eyebrow}
        </span>
      )}
      {title && (
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.15] text-theme-text ${headingFontClass} ${titleClassName}`}
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={`mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-theme-text-sec max-w-2xl font-normal ${descriptionClassName}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
