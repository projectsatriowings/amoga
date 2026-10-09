/**
 * AMOGA SILVER JEWELLERY — PRODUCT DATASET
 * Sourced directly from approved reference designs and architectural specs.
 *
 * Rules:
 * - 8 verified products with approved prices from reference assets.
 * - Catalogue items without approved prices have `price: null` and display "Price to be confirmed".
 * - No fabricated reviews, discounts, fake purity or hallmark claims.
 */

import ringHero from '../../../assets/images/jewellery-aurora-ring.jpg';
import necklaceHero from '../../../assets/images/jewellery-lumiere-necklace.jpg';
import solsticeHero from '../../../assets/images/jewellery-solstice-ring.jpg';
import veriteHero from '../../../assets/images/jewellery-verite-necklace.jpg';
import leafRingHero from '../../../assets/images/jewellery-leaf-ring.jpg';
import modelHero from '../../../assets/images/jewellery-model-hero.jpg';

export const JEWELLERY_PRODUCTS = [
  // =========================================================================
  // 1. VERIFIED REFERENCE PRODUCTS (Exact prices from approved reference)
  // =========================================================================
  {
    id: 'j-aurora-01',
    slug: 'aurora-ring',
    name: 'Aurora Ring',
    collection: 'jewellery',
    category: 'rings',
    categoryName: 'Rings',
    price: 2499,
    verified: true,
    tagline: 'Minimal. Elegant. Timeless.',
    description: 'Intertwined sterling silver curves with subtle micro-pavé accents, designed for effortless everyday grace.',
    image: ringHero,
    gallery: [ringHero, modelHero],
    sizes: ['US 6', 'US 7', 'US 8', 'US 9'],
    specs: {
      material: '925 Sterling Silver',
      finish: 'High Polish Rhodium Plated',
      stone: 'Cubic Zirconia Micro-Pavé',
      dimensions: '2.5 mm Band Width',
      care: 'Store in airtight pouch, avoid water and perfume',
    },
    inStock: true,
    isFeatured: true,
    badge: 'New',
  },
  {
    id: 'j-lumiere-01',
    slug: 'lumiere-necklace',
    name: 'Lumière Necklace',
    collection: 'jewellery',
    category: 'necklaces',
    categoryName: 'Necklaces & Pendants',
    price: 3299,
    verified: true,
    tagline: 'Pure silver. Pure grace.',
    description: 'A delicate teardrop sterling silver pendant framing a solitary brilliant stone, suspended on a fluid silver cable chain.',
    image: necklaceHero,
    gallery: [necklaceHero, modelHero],
    specs: {
      material: '925 Sterling Silver',
      finish: 'High Polish Anti-Tarnish Coating',
      stone: 'Solitary Brilliant Zircon',
      dimensions: '18 inches + 2-inch extender',
      clasp: 'Lobster Claw Clasp',
      care: 'Wipe with soft silver polishing cloth',
    },
    inStock: true,
    isFeatured: true,
    badge: 'Bestseller',
  },
  {
    id: 'j-solstice-01',
    slug: 'solstice-ring',
    name: 'Solstice Ring',
    collection: 'jewellery',
    category: 'rings',
    categoryName: 'Rings',
    price: 2799,
    verified: true,
    tagline: 'Simplicity in every detail.',
    description: 'A classic four-prong solitaire setting resting upon a polished sterling silver band for restrained, understated brilliance.',
    image: solsticeHero,
    gallery: [solsticeHero, ringHero],
    sizes: ['US 6', 'US 7', 'US 8', 'US 9'],
    specs: {
      material: '925 Sterling Silver',
      finish: 'Mirror Polish',
      stone: 'Solitaire Round Cut Zircon',
      setting: 'Four-Prong Classic Setting',
      care: 'Wipe clean after daily wear',
    },
    inStock: true,
    isFeatured: true,
    badge: 'Trending',
  },
  {
    id: 'j-verite-01',
    slug: 'verite-bar-necklace',
    name: 'Vérité Necklace',
    collection: 'jewellery',
    category: 'necklaces',
    categoryName: 'Necklaces & Pendants',
    price: 2999,
    verified: true,
    tagline: 'Modern. Minimal. Yours.',
    description: 'An architectural vertical bar pendant sculpted in solid sterling silver with clean linear edges and a high-sheen satin polish.',
    image: veriteHero,
    gallery: [veriteHero, modelHero],
    specs: {
      material: '925 Sterling Silver',
      finish: 'Brushed Satin with Polished Chamfers',
      dimensions: '32 mm Bar &bull; 20-inch Chain',
      clasp: 'Spring Ring Clasp',
      care: 'Keep in dry jewelry pouch',
    },
    inStock: true,
    isFeatured: true,
    badge: 'New',
  },
  {
    id: 'j-leaf-01',
    slug: 'leaf-ring',
    name: 'Leaf Ring',
    collection: 'jewellery',
    category: 'rings',
    categoryName: 'Rings',
    price: 2299,
    verified: true,
    tagline: 'Inspired by nature. Crafted for you.',
    description: 'A continuous laurel garland band inspired by botanical silhouettes, sculpted with textured leaf contours.',
    image: leafRingHero,
    gallery: [leafRingHero, ringHero],
    sizes: ['US 6', 'US 7', 'US 8'],
    specs: {
      material: '925 Sterling Silver',
      finish: 'Oxidized Accent with Polished Highlights',
      dimensions: '4.0 mm Contour Band',
      motif: 'Botanical Laurel Leaves',
      care: 'Clean with gentle jewelry cloth',
    },
    inStock: true,
    isFeatured: true,
    badge: 'Popular',
  },
  {
    id: 'j-lumiere-ring-01',
    slug: 'lumiere-solitaire-ring',
    name: 'Lumière Solitaire Ring',
    collection: 'jewellery',
    category: 'rings',
    categoryName: 'Rings',
    price: 2799,
    verified: true,
    tagline: 'Timeless brilliance in sterling silver',
    description: 'Delicate four-prong solitaire ring set in polished 925 sterling silver with graceful tapered band shoulders.',
    image: solsticeHero,
    gallery: [solsticeHero, modelHero],
    sizes: ['US 6', 'US 7', 'US 8'],
    specs: {
      material: '925 Sterling Silver',
      finish: 'Rhodium Plating',
      stone: 'Solitaire Round Cut Zircon',
      dimensions: 'Band 2.2 mm',
      care: 'Store in dry jewelry box',
    },
    inStock: true,
    isFeatured: false,
    badge: 'Signature',
  },
  {
    id: 'j-solstice-earrings-01',
    slug: 'solstice-stud-earrings',
    name: 'Solstice Stud Earrings',
    collection: 'jewellery',
    category: 'earrings',
    categoryName: 'Earrings',
    price: 1899,
    verified: true,
    tagline: 'Weightless micro-studs in pure silver',
    description: 'Everyday minimal stud earrings featuring round prong-set solitaires in sterling silver with secure friction butterfly backs.',
    image: modelHero,
    gallery: [modelHero],
    specs: {
      material: '925 Sterling Silver',
      closure: 'Post with Friction Butterfly Back',
      stone: 'Solitaire Round Cut Zircon',
      dimensions: '5 mm Diameter',
      care: 'Wipe with soft cloth',
    },
    inStock: true,
    isFeatured: false,
    badge: 'Everyday Minimal',
  },
  {
    id: 'j-aurora-cuff-01',
    slug: 'aurora-cuff-bracelet',
    name: 'Aurora Cuff Bracelet',
    collection: 'jewellery',
    category: 'bracelets',
    categoryName: 'Bracelets & Cuffs',
    price: 3899,
    verified: true,
    tagline: 'Sculptural open cuff for effortless layering',
    description: 'A clean architectural open-cuff bracelet sculpted in solid sterling silver, slightly flexible for an adjustable wrist fit.',
    image: leafRingHero,
    gallery: [leafRingHero, modelHero],
    specs: {
      material: '925 Sterling Silver',
      dimensions: 'Standard 6.5-inch circumference (Adjustable)',
      finish: 'High Polish Silver',
      care: 'Avoid bending repeatedly; polish gently',
    },
    inStock: true,
    isFeatured: false,
    badge: 'Sculptural',
  },

  // =========================================================================
  // 2. CATALOGUE HEIRLOOMS (Price pending client catalogue approval)
  // =========================================================================
  {
    id: 'j-celeste-hoop-01',
    slug: 'celeste-silver-hoops',
    name: 'Celeste Silver Hoops',
    collection: 'jewellery',
    category: 'earrings',
    categoryName: 'Earrings',
    price: null,
    verified: false,
    tagline: 'Featherweight classic silver hoops',
    description: 'Tubular sterling silver hoop earrings with click-top latch closure, engineered for featherweight all-day comfort.',
    image: modelHero,
    gallery: [modelHero],
    specs: {
      material: '925 Sterling Silver',
      closure: 'Click-Top Latch',
      dimensions: '22 mm Diameter',
      care: 'Dry storage recommended',
    },
    inStock: true,
    isFeatured: false,
    badge: 'Pending Confirmation',
  },
  {
    id: 'j-heritage-kasu-01',
    slug: 'heritage-kasu-silver-kada',
    name: 'Heritage Kasu Silver Kada',
    collection: 'jewellery',
    category: 'traditional',
    categoryName: 'Traditional Silver',
    price: null,
    verified: false,
    tagline: 'Traditional coin motif silver kada',
    description: 'Antique oxidized silver kada featuring regional coin motifs and screw-lock closure for auspicious occasions.',
    image: ringHero,
    gallery: [ringHero, modelHero],
    specs: {
      material: '925 Sterling Silver',
      finish: 'Antique Temple Oxidized',
      dimensions: 'Size 2.6 (Screw Lock Openable)',
      care: 'Store in airtight velvet case',
    },
    inStock: true,
    isFeatured: false,
    badge: 'Pending Confirmation',
  },
];

export const getJewelleryBySlug = (slug) =>
  JEWELLERY_PRODUCTS.find((p) => p.slug === slug);

export const getFeaturedJewellery = () =>
  JEWELLERY_PRODUCTS.filter((p) => p.isFeatured);

export const getJewelleryByCategory = (categoryId) => {
  if (!categoryId || categoryId === 'all') return JEWELLERY_PRODUCTS;
  return JEWELLERY_PRODUCTS.filter((p) => p.category === categoryId);
};
