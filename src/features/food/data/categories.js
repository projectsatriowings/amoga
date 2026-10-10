/**
 * AMOGA GOURMET FOOD — APPROVED CATEGORIES
 * Verified against Amoga Product Catalogues and Homepage Specifications
 */

import soupImg from '../../../assets/images/food-soups-hero.jpg';
import delicacyImg from '../../../assets/images/gatekeeper-food.jpg';

export const FOOD_CATEGORIES = [
  {
    id: 'all',
    slug: 'all',
    name: 'All Mixes',
    shortName: 'All',
    count: 55,
    description: 'Explore a thoughtful selection of soup mixes, millet mixes and traditional rice podis, bringing convenience and familiar flavours to everyday meals.',
  },
  {
    id: 'soups',
    slug: 'soup-ready-mix',
    name: 'Soup Mixes',
    shortName: 'Soup Mixes',
    count: 20,
    image: soupImg,
    tagline: 'Twenty Distinctive Soups. One Memorable Collection.',
    description: 'A thoughtfully crafted 20-recipe soup collection featuring regional botanical leaves, fresh garden herbs, and nourishing comforting broths.',
    badge: '20 Recipes',
    featured: true,
  },
  {
    id: 'millets',
    slug: 'millet-collection',
    name: 'Millet Mixes',
    shortName: 'Millet Mixes',
    count: 10,
    image: delicacyImg,
    tagline: 'The Everyday Table — Familiar Favourites, Fresh Possibilities.',
    description: 'Ten versatile breakfast mixes, wholesome meal bases, and savoury treats reimagining heritage millets for everyday cooking.',
    badge: '10 Items',
    featured: true,
  },
  {
    id: 'podis',
    slug: 'rice-podi-collection',
    name: 'Rice Podis',
    shortName: 'Rice Podis',
    count: 25,
    image: delicacyImg,
    tagline: 'Tradition, With a Twist — 25 Podi Varieties for Rice.',
    description: 'A varied selection of regional leaf blends, aromatic seeds, and savoury roasted accompaniments for warm rice.',
    badge: '25 Varieties',
    featured: true,
  },
];

export const getCategoryById = (id) => FOOD_CATEGORIES.find((c) => c.id === id);
export const getCategoryBySlug = (slug) => FOOD_CATEGORIES.find((c) => c.slug === slug);
