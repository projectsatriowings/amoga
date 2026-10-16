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
    count: 10,
  },
  {
    id: 'rings',
    name: 'Rings',
    tagline: 'Sculptural bands, solitaires, and botanical motifs in sterling silver',
    image: ringHero,
    badge: '925 Sterling',
    count: 4,
  },
  {
    id: 'necklaces',
    name: 'Necklaces & Pendants',
    tagline: 'Teardrop solitaires, geometric bars, and fluid sterling silver chains',
    image: necklaceHero,
    badge: 'Artisanal Silver',
    count: 2,
  },
  {
    id: 'earrings',
    name: 'Earrings',
    tagline: 'Weightless micro-studs, drops, and hoops for everyday refinement',
    image: modelHero,
    badge: 'Silver Jewellery',
    count: 2,
  },
  {
    id: 'bracelets',
    name: 'Bracelets & Cuffs',
    tagline: 'Architectural wrist cuffs and fluid linkages designed for layering',
    image: leafRingHero,
    badge: 'Sculptural Craft',
    count: 1,
  },
  {
    id: 'traditional',
    name: 'Traditional Silver',
    tagline: 'Heritage silver jewellery with regional motifs and antique finishes',
    image: modelHero,
    badge: 'Heritage Craft',
    count: 1,
  },
];
