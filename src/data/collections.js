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
    name: 'Gourmet Food',
    title: 'GOURMET FOOD',
    eyebrow: 'THE ART OF TASTE',
    tagline: 'The Art of Taste',
    description: 'Discover thoughtfully selected gourmet foods, crafted for everyday enjoyment.',
    ctaText: 'Explore Collection',
    path: '/food',
    productsPath: '/food/products',
    theme: 'food',
    accentColor: '#287A25',
    supportingColor: '#557C36',
    bgColor: '#F1EDE4',
    textColor: '#172B1C',
    fontHeading: 'font-sans',
    fontBody: 'font-sans',
    heroImage: foodPanelImg,
    badge: 'Organics & Delicacies',
    features: ['Ancient Grain Millets', 'Single-Origin Honey', 'Cold-Pressed Oils', 'Handcrafted Spices'],
  },
  {
    id: 'tea',
    number: '02',
    name: 'Tea',
    title: 'TEA',
    eyebrow: 'BOTANICAL INFUSIONS',
    tagline: 'Pure Botanical Infusions',
    description: 'Savor single-origin flower infusions, ancient therapeutic herbs, and whole aromatic spice chips.',
    ctaText: 'Explore Collection',
    path: '/tea',
    productsPath: '/tea/products',
    theme: 'tea',
    accentColor: '#B88E38',
    supportingColor: '#8C6320',
    bgColor: '#FAF1BB',
    textColor: '#2C1E11',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    heroImage: teaPanelImg,
    badge: 'Artisanal Herbal Brews',
    features: ['Whole Hibiscus Flowers', 'Butterfly Blue Pea', 'Ceylon Cinnamon Bark', 'Medicinal Nannari Roots'],
  },
  {
    id: 'sarees',
    number: '03',
    name: 'Heritage Sarees',
    title: 'HERITAGE SAREES',
    eyebrow: 'TIMELESS WEAVES',
    tagline: 'Timeless Weaves',
    description: 'Discover the beauty of traditional textiles and timeless craftsmanship.',
    ctaText: 'Explore Collection',
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
    ctaText: 'Explore Collection',
    path: '/jewellery',
    productsPath: '/jewellery/products',
    theme: 'jewellery',
    accentColor: '#B9B8B5',
    supportingColor: '#343238',
    bgColor: '#242326',
    textColor: '#F7F3EB',
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
