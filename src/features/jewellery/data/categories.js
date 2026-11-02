/**
 * AMOGA SILVER JEWELLERY — COLLECTION CATEGORIES
 * Sourced directly from approved reference designs and architectural specs.
 */

import ringHero from '../../../assets/images/jewellery-aurora-ring.jpg';
import necklaceHero from '../../../assets/images/jewellery-lumiere-necklace.jpg';
import leafRingHero from '../../../assets/images/jewellery-leaf-ring.jpg';
import modelHero from '../../../assets/images/jewellery-model-hero.jpg';

export const JEWELLERY_CATEGORIES = [
  {
    id: 'all',
    name: 'All Jewellery',
    tagline: 'The complete curation of modern and timeless silver heirlooms',
    image: modelHero,
    count: 14,
  },
  {
    id: 'chain-with-pendant',
    name: 'Chain with Pendant',
    tagline: 'Delicate 925 sterling silver chains featuring artisanal drop pendants',
    image: necklaceHero,
    badge: 'Sterling Silver',
    count: 3,
  },
  {
    id: 'chain-pendant-earring',
    name: 'Chain Pendant Earring',
    tagline: 'Coordinated matching sets of sterling chain pendants and matching earrings',
    image: modelHero,
    badge: 'Matching Sets',
    count: 2,
  },
  {
    id: 'earring',
    name: 'Earring',
    tagline: 'Weightless micro-studs, sculpted drops, and handcrafted silver jhumkas',
    image: modelHero,
    badge: 'Silver Earring',
    count: 3,
  },
  {
    id: 'anklets',
    name: 'Anklets',
    tagline: 'Traditional and contemporary sterling silver payals and ankle chains',
    image: leafRingHero,
    badge: 'Handcrafted',
    count: 2,
  },
  {
    id: 'toe-rings',
    name: 'Toe Rings',
    tagline: 'Traditional handcrafted silver metti and adjustable toe rings',
    image: ringHero,
    badge: 'Traditional Silver',
    count: 2,
  },
  {
    id: 'bracelet',
    name: 'Bracelet',
    tagline: 'Architectural wrist cuffs, charms, and fluid silver linkages',
    image: leafRingHero,
    badge: 'Sculptural Craft',
    count: 2,
  },
  {
    id: 'necklace',
    name: 'Necklace',
    tagline: 'Statement sterling silver chokers, collared necklaces, and layered chains',
    image: necklaceHero,
    badge: 'Heirloom Silver',
    count: 2,
  },
];
