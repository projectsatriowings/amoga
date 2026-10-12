/**
 * AMOGA E-COMMERCE — PRIMARY COLLECTIONS CONFIGURATION
 * Four Curated Universes: Gourmet Food, Tea, Heritage Sarees, Silver Jewellery
 */

import foodPanelImg from '../assets/images/gatekeeper-food.jpg';
import teaPanelImg from '../assets/images/food-teas-hero.jpg';
import sareesPanelImg from '../assets/images/gatekeeper-sarees.jpg';
import jewelleryPanelImg from '../assets/images/gatekeeper-jewellery.jpg';

export const COLLECTIONS = [
  {
    id: 'food',
    number: '01',
    name: 'Wholesome Pantry',
    title: 'WHOLESOME PANTRY',
    eyebrow: 'THE GOODNESS OF TRADITION',
    tagline: 'Traditional Blends & Mixes',
    description: 'Discover traditional Indian blends made for everyday cooking, from comforting soup mixes to nourishing millet blends and flavourful rice podis.',
    innerHeading: 'Traditional Blends & Mixes',
    innerDescription: 'Explore a thoughtful selection of soup mixes, millet mixes and traditional rice podis, bringing convenience and familiar flavours to everyday meals.',
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
    heroImage: foodPanelImg,
    badge: 'Traditional Blends',
    features: ['Soup Mixes', 'Millet Mixes', 'Rice Podis'],
  },
  {
    id: 'tea',
    number: '02',
    name: 'Wellness Tea',
    title: 'WELLNESS TEA',
    eyebrow: 'BOTANICAL WELLNESS',
    tagline: 'Botanical Teas & Herbal Infusions',
    description: 'Discover thoughtfully selected botanical teas and herbal infusions for your everyday tea ritual.',
    innerHeading: 'Botanical Teas & Herbal Infusions',
    innerDescription: 'Explore our selection of botanical teas and herbal infusions, bringing distinctive ingredients and comforting tea rituals to your everyday routine.',
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
    heroImage: teaPanelImg,
    badge: 'Botanical Rituals',
    features: ['Flower Blossoms', 'Herbal Tisanes', 'Aromatic Infusions'],
  },
  {
    id: 'sarees',
    number: '03',
    name: 'Heritage Sarees',
    title: 'HERITAGE SAREES',
    eyebrow: 'TIMELESS WEAVES',
    tagline: 'Timeless Weaves',
    description: 'Discover the beauty of traditional textiles and timeless craftsmanship.',
    innerHeading: 'Timeless Weaves',
    innerDescription: 'Discover the beauty of traditional textiles and timeless craftsmanship hand-loomed in pure silk.',
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
    heroImage: sareesPanelImg,
    badge: 'Artisanal Handlooms',
    features: ['Kanchipuram Pure Silk', 'Banarasi Brocade', 'Handwoven Tussar', 'Antique Zari Weaves'],
  },
  {
    id: 'jewellery',
    number: '04',
    name: 'Silver Jewellery',
    title: 'SILVER JEWELLERY',
    eyebrow: 'MODERN HEIRLOOMS',
    tagline: 'Modern Heirlooms',
    description: 'Explore refined silver jewellery with a timeless, contemporary character.',
    innerHeading: 'Modern Heirlooms',
    innerDescription: 'Explore refined 925 sterling silver heirlooms designed with timeless elegance and modern character.',
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
    heroImage: jewelleryPanelImg,
    badge: '925 Sterling Craft',
    features: ['925 Sterling Silver', 'Minimalist Pendants', 'Sculptural Cuffs', 'Artisan Rings'],
  },
];

export const getCollectionById = (id) => COLLECTIONS.find((col) => col.id === id);
export const getCollectionByPath = (pathname) => {
  if (pathname.startsWith('/food')) return COLLECTIONS[0];
  if (pathname.startsWith('/tea')) return COLLECTIONS[1];
  if (pathname.startsWith('/sarees')) return COLLECTIONS[2];
  if (pathname.startsWith('/jewellery')) return COLLECTIONS[3];
  return null;
};
