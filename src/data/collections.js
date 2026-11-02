/**
 * AMOGA E-COMMERCE — PRIMARY COLLECTIONS CONFIGURATION
 * Four Collections: Wholesome Pantry, Wellness Tea, Heritage Sarees, Sterling Silver
 * 
 * Optimized with modern WebP responsive assets, progressive JPEG fallbacks,
 * and calibrated subject focal points for seamless gradient blending.
 */

// Wholesome Pantry Assets
import foodWebp from '../assets/images/gatekeeper-food.webp';
import foodWebp480 from '../assets/images/gatekeeper-food-480.webp';
import foodWebp800 from '../assets/images/gatekeeper-food-800.webp';
import foodWebp1200 from '../assets/images/gatekeeper-food-1200.webp';
import foodJpg from '../assets/images/gatekeeper-food-800.jpg';
import foodJpg480 from '../assets/images/gatekeeper-food-480.jpg';
import foodJpg800 from '../assets/images/gatekeeper-food-800.jpg';
import foodJpg1200 from '../assets/images/gatekeeper-food-1200.jpg';

// Wellness Tea Assets
import teaWebp from '../assets/images/food-teas-hero.webp';
import teaWebp480 from '../assets/images/food-teas-hero-480.webp';
import teaWebp800 from '../assets/images/food-teas-hero-800.webp';
import teaWebp1200 from '../assets/images/food-teas-hero-1200.webp';
import teaJpg from '../assets/images/food-teas-hero-800.jpg';
import teaJpg480 from '../assets/images/food-teas-hero-480.jpg';
import teaJpg800 from '../assets/images/food-teas-hero-800.jpg';
import teaJpg1200 from '../assets/images/food-teas-hero-1200.jpg';

// Heritage Sarees Assets
import sareesWebp from '../assets/images/gatekeeper-sarees.webp';
import sareesWebp480 from '../assets/images/gatekeeper-sarees-480.webp';
import sareesWebp800 from '../assets/images/gatekeeper-sarees-800.webp';
import sareesWebp1200 from '../assets/images/gatekeeper-sarees-1200.webp';
import sareesJpg from '../assets/images/gatekeeper-sarees-800.jpg';
import sareesJpg480 from '../assets/images/gatekeeper-sarees-480.jpg';
import sareesJpg800 from '../assets/images/gatekeeper-sarees-800.jpg';
import sareesJpg1200 from '../assets/images/gatekeeper-sarees-1200.jpg';

// Silver Jewellery Assets
import jewelleryWebp from '../assets/images/gatekeeper-jewellery.webp';
import jewelleryWebp480 from '../assets/images/gatekeeper-jewellery-480.webp';
import jewelleryWebp800 from '../assets/images/gatekeeper-jewellery-800.webp';
import jewelleryWebp1200 from '../assets/images/gatekeeper-jewellery-1200.webp';
import jewelleryJpg from '../assets/images/gatekeeper-jewellery-800.jpg';
import jewelleryJpg480 from '../assets/images/gatekeeper-jewellery-480.jpg';
import jewelleryJpg800 from '../assets/images/gatekeeper-jewellery-800.jpg';
import jewelleryJpg1200 from '../assets/images/gatekeeper-jewellery-1200.jpg';

export const COLLECTIONS = [
  {
    id: 'tea',
    number: '01',
    name: 'Wellness Tea',
    title: 'WELLNESS TEA',
    eyebrow: 'HERBAL TEAS AND INFUSIONS',
    tagline: 'Herbal Teas and Infusions',
    subtitle: 'Herbal Teas and Infusions',
    description: 'Explore our range of herbal teas for your daily tea routine.',
    innerHeading: 'Herbal Teas and Infusions',
    innerDescription: 'Explore our selection of herbal teas and infusions, bringing natural ingredients and comforting tea rituals to your everyday routine.',
    ctaText: 'EXPLORE COLLECTION',
    path: '/tea',
    productsPath: '/tea/products',
    theme: 'tea',
    accentColor: '#65815A',
    supportingColor: '#173B2A',
    bgColor: '#FAF1BB',
    textColor: '#173B2A',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    heroImage: teaWebp,
    cardImage: teaWebp,
    fallbackImage: teaJpg,
    imageResponsive: {
      webpSrcSet: `${teaWebp480} 480w, ${teaWebp800} 800w, ${teaWebp1200} 1200w`,
      jpgSrcSet: `${teaJpg480} 480w, ${teaJpg800} 800w, ${teaJpg1200} 1200w`,
      src: teaWebp,
      fallback: teaJpg,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
      alt: 'Amoga Wellness Tea — Herbal Teas and Infusions',
      objectPosition: 'center 60%',
    },
    badge: 'Herbal Teas',
    features: ['Flower Blossoms', 'Herbal Tisanes', 'Aromatic Infusions'],
  },
  {
    id: 'sarees',
    number: '02',
    name: 'Heritage Sarees',
    title: 'HERITAGE SAREES',
    eyebrow: 'TRADITIONAL SILK SAREES',
    tagline: 'Traditional Silk Sarees',
    subtitle: 'Traditional Silk Sarees',
    description: 'Discover beautiful sarees with traditional designs and fine craftsmanship.',
    innerHeading: 'Traditional Silk Sarees',
    innerDescription: 'Discover beautiful sarees with traditional designs and fine craftsmanship hand-loomed in pure silk.',
    ctaText: 'EXPLORE COLLECTION',
    path: '/sarees',
    productsPath: '/sarees/products',
    theme: 'sarees',
    accentColor: '#C5A46D',
    supportingColor: '#451523',
    bgColor: '#2C0E1A',
    textColor: '#F6EBD8',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    heroImage: sareesWebp,
    cardImage: sareesWebp,
    fallbackImage: sareesJpg,
    imageResponsive: {
      webpSrcSet: `${sareesWebp480} 480w, ${sareesWebp800} 800w, ${sareesWebp1200} 1200w`,
      jpgSrcSet: `${sareesJpg480} 480w, ${sareesJpg800} 800w, ${sareesJpg1200} 1200w`,
      src: sareesWebp,
      fallback: sareesJpg,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
      alt: 'Amoga Heritage Sarees — Traditional Silk Sarees',
      objectPosition: 'center 35%',
    },
    badge: 'Traditional Handlooms',
    features: ['Kanchipuram Pure Silk', 'Banarasi Brocade', 'Handwoven Tussar', 'Antique Zari Weaves'],
  },
  {
    id: 'jewellery',
    number: '03',
    name: 'Sterling Silver',
    title: 'STERLING SILVER',
    eyebrow: 'SILVER JEWELLERY',
    tagline: 'Silver Jewellery',
    subtitle: 'Silver Jewellery',
    description: 'Explore silver jewellery for everyday wear, celebrations, and gifting.',
    innerHeading: 'Silver Jewellery',
    innerDescription: 'Explore refined 925 sterling silver jewellery designed with timeless elegance and modern character.',
    ctaText: 'EXPLORE COLLECTION',
    path: '/jewellery',
    productsPath: '/jewellery/products',
    theme: 'jewellery',
    accentColor: '#B9B8B5',
    supportingColor: '#343238',
    bgColor: '#111215',
    textColor: '#F4F4F2',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    heroImage: jewelleryWebp,
    cardImage: jewelleryWebp,
    fallbackImage: jewelleryJpg,
    imageResponsive: {
      webpSrcSet: `${jewelleryWebp480} 480w, ${jewelleryWebp800} 800w, ${jewelleryWebp1200} 1200w`,
      jpgSrcSet: `${jewelleryJpg480} 480w, ${jewelleryJpg800} 800w, ${jewelleryJpg1200} 1200w`,
      src: jewelleryWebp,
      fallback: jewelleryJpg,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
      alt: 'Amoga Silver Jewellery — Sculptural 925 Sterling Silver Heirlooms',
      objectPosition: 'center 45%',
    },
    badge: '925 Sterling Craft',
    features: ['925 Sterling Silver', 'Minimalist Pendants', 'Sculptural Cuffs', 'Artisan Rings'],
  },
  {
    id: 'food',
    number: '04',
    name: 'Wholesome Pantry',
    title: 'WHOLESOME PANTRY',
    eyebrow: 'TRADITIONAL INDIAN FOOD MIXES',
    tagline: 'Traditional Indian Food Mixes',
    subtitle: 'Traditional Indian Food Mixes',
    description: 'Easy-to-prepare soup mixes, millet mixes, and rice podis for everyday meals.',
    innerHeading: 'Traditional Indian Food Mixes',
    innerDescription: 'Explore our selection of soup mixes, millet mixes and traditional rice podis, bringing convenience and familiar flavours to everyday meals.',
    ctaText: 'EXPLORE COLLECTION',
    path: '/food',
    productsPath: '/food/products',
    theme: 'food',
    accentColor: '#3F7B43',
    supportingColor: '#173B2A',
    bgColor: '#F8F6F0',
    textColor: '#292820',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    heroImage: foodWebp,
    cardImage: foodWebp,
    fallbackImage: foodJpg,
    imageResponsive: {
      webpSrcSet: `${foodWebp480} 480w, ${foodWebp800} 800w, ${foodWebp1200} 1200w`,
      jpgSrcSet: `${foodJpg480} 480w, ${foodJpg800} 800w, ${foodJpg1200} 1200w`,
      src: foodWebp,
      fallback: foodJpg,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
      alt: 'Amoga Wholesome Pantry — Traditional Indian Food Mixes',
      objectPosition: 'center 62%',
    },
    badge: 'Traditional Mixes',
    features: ['Soup Mixes', 'Millet Mixes', 'Rice Podis'],
  },
];

export const getCollectionById = (id) => COLLECTIONS.find((col) => col.id === id);
export const getCollectionByPath = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return null;
  return COLLECTIONS.find((col) => pathname.startsWith(col.path)) || null;
};
