import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const THEME_STYLES = {
  sarees: {
    container:
      'border-[#C5A46D]/45 bg-[#3B111E]/85 text-[#F6EBD8] hover:bg-[#501A2B] hover:text-[#C5A46D] hover:border-[#C5A46D] focus:ring-[#C5A46D]/40',
    icon: 'text-[#C5A46D]',
  },
  food: {
    container:
      'border-[#3F7B43]/40 bg-[#EAE8DC] text-[#173B2A] hover:bg-[#3F7B43]/15 hover:border-[#3F7B43] hover:text-[#173B2A] focus:ring-[#3F7B43]/40',
    icon: 'text-[#3F7B43]',
  },
  tea: {
    container:
      'border-[#8C6320]/40 bg-[#FFFDF5] text-[#2C1E11] hover:bg-[#8C6320]/15 hover:border-[#8C6320] hover:text-[#8C6320] focus:ring-[#8C6320]/40',
    icon: 'text-[#8C6320]',
  },
  jewellery: {
    container:
      'border-[#737C86]/45 bg-[#242326]/90 text-[#F7F3EB] hover:bg-[#34373A] hover:text-[#C6AD82] hover:border-[#C6AD82] focus:ring-[#C6AD82]/40',
    icon: 'text-[#C6AD82]',
  },
  admin: {
    container:
      'border-[#D5CEC2] bg-white text-[#1A1817] hover:bg-[#F5F1E8] hover:border-[#8C6320] hover:text-[#722F37] focus:ring-[#722F37]/40',
    icon: 'text-[#8C6320]',
  },
  default: {
    container:
      'border-[#D5CEC2] bg-white/90 text-[#292820] hover:bg-[#EAE8DC] hover:border-[#722F37] hover:text-[#722F37] focus:ring-[#722F37]/40',
    icon: 'text-[#722F37]',
  },
};

/**
 * Universal Theme-Aware BackButton
 * Automatically applies colors tailored to each collection theme (Sarees, Food, Tea, Jewellery, Admin)
 */
export function BackButton({
  collection,
  fallbackTo,
  label = 'Back',
  className = '',
  ariaLabel,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect theme from path if not explicitly provided
  let activeTheme = collection;
  if (!activeTheme) {
    if (location.pathname.startsWith('/sarees')) activeTheme = 'sarees';
    else if (location.pathname.startsWith('/food')) activeTheme = 'food';
    else if (location.pathname.startsWith('/tea')) activeTheme = 'tea';
    else if (location.pathname.startsWith('/jewellery')) activeTheme = 'jewellery';
    else if (location.pathname.startsWith('/admin')) activeTheme = 'admin';
    else activeTheme = 'default';
  }

  const themeConfig = THEME_STYLES[activeTheme] || THEME_STYLES.default;

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (fallbackTo) {
      navigate(fallbackTo);
    } else {
      // Intelligent fallback based on path
      if (location.pathname.startsWith('/sarees/products/')) navigate('/sarees/products');
      else if (location.pathname.startsWith('/sarees/products')) navigate('/sarees');
      else if (location.pathname.startsWith('/food/products/')) navigate('/food/products');
      else if (location.pathname.startsWith('/food/products')) navigate('/food');
      else if (location.pathname.startsWith('/tea/products/')) navigate('/tea/products');
      else if (location.pathname.startsWith('/tea/products')) navigate('/tea');
      else if (location.pathname.startsWith('/jewellery/products/')) navigate('/jewellery/products');
      else if (location.pathname.startsWith('/jewellery/products')) navigate('/jewellery');
      else if (location.pathname.startsWith('/admin/products/')) navigate('/admin/products');
      else navigate('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel || label}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border shadow-sm backdrop-blur-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 ${themeConfig.container} ${className}`}
    >
      <ArrowLeft className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 ${themeConfig.icon}`} />
      <span>{label}</span>
    </button>
  );
}
