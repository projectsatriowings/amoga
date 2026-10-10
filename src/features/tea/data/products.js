/**
 * AMOGA TEA COLLECTION — BOTANICAL CATALOGUE DATA
 * Source: Amoga Herbal Tea Standee Reference (5 Signature Botanical Varieties)
 * 
 * Note on Pricing: The prices configured here are clearly labelled development / test
 * prices matching pack sizes to enable complete end-to-end checkout validation.
 * Authoritative financial calculations are validated on the server in integer paise.
 */

import teaHero from '../../../assets/images/food-teas-hero.jpg';

export const TEA_PRODUCTS = [
  {
    id: 'tea-01',
    slug: 'butterfly-blue-pea-tea',
    name: 'Butterfly Blue Pea Tea',
    collection: 'tea',
    category: 'teas',
    categoryName: 'Botanical Flower Brews',
    price: 199, // Temporary development / test pricing
    originalPrice: 249,
    discount: '20% OFF',
    packSize: '50 g',
    isDevelopmentPrice: true,
    currency: 'INR',
    image: teaHero,
    standeeNotes: 'Rich in Antioxidants, Promotes Digestion',
    description: 'Vibrant sapphire blue botanical tea brewed from whole Clitoria ternatea petals with a gentle earthy sweetness.',
    botanicalName: 'Clitoria ternatea',
    origin: 'Single Estate Floral Gardens, Tamil Nadu',
    brewingTime: '4–5 mins at 90°C',
    sourceCatalogue: 'Amoga Herbal Tea Standee Reference',
    inStock: true,
    isFeatured: true,
    badge: 'Antioxidant Rich',
    rating: 4.9,
    reviewCount: 142,
    details: [
      'Pure sun-dried whole blue pea blossoms (50 g pouch)',
      'Naturally caffeine-free calming herbal tisane',
      'Transformative color changes to rich violet with a squeeze of fresh lemon',
      'Zero artificial colors, preservatives, or sweeteners',
    ],
  },
  {
    id: 'tea-02',
    slug: 'moringa-leaf-tea',
    name: 'Moringa Leaf Tea',
    collection: 'tea',
    category: 'teas',
    categoryName: 'Medicinal Leaf Brews',
    price: 199, // Temporary development / test pricing
    originalPrice: 249,
    discount: '20% OFF',
    packSize: '50 g',
    isDevelopmentPrice: true,
    currency: 'INR',
    image: teaHero,
    standeeNotes: 'Nutrient Superhouse, Controls Blood Sugar',
    description: 'Shade-dried drumstick tree leaves and blossoms offering a soothing herbal green infusion packed with natural minerals.',
    botanicalName: 'Moringa oleifera',
    origin: 'Organic Agro-Forest Farms',
    brewingTime: '3–4 mins at 85°C',
    sourceCatalogue: 'Amoga Herbal Tea Standee Reference',
    inStock: true,
    isFeatured: true,
    badge: 'Nutrient Superhouse',
    rating: 4.8,
    reviewCount: 98,
    details: [
      'Gently harvested tender moringa leaves and wild florets (50 g pouch)',
      'High natural chlorophyll and essential amino acids',
      'Earthy, grassy profile with a delicate mineral finish',
      'Traditional Ayurvedic vitality restorative',
    ],
  },
  {
    id: 'tea-03',
    slug: 'cinnamon-tea',
    name: 'Cinnamon Tea',
    collection: 'tea',
    category: 'teas',
    categoryName: 'Heritage Spice Infusions',
    price: 219, // Temporary development / test pricing
    originalPrice: 269,
    discount: '18% OFF',
    packSize: '100 g',
    isDevelopmentPrice: true,
    currency: 'INR',
    image: teaHero,
    standeeNotes: 'Fights Inflammation, Boosts Immunity',
    description: 'Warm aromatic Ceylon cinnamon bark chips providing a naturally comforting spice brew without added sugar.',
    botanicalName: 'Cinnamomum verum',
    origin: 'Hill Country Canopy Groves',
    brewingTime: '5–6 mins at 95°C',
    sourceCatalogue: 'Amoga Herbal Tea Standee Reference',
    inStock: true,
    isFeatured: true,
    badge: 'Immunity Brew',
    rating: 4.9,
    reviewCount: 175,
    details: [
      'Hand-quilled true Ceylon cinnamon bark flakes (100 g pouch)',
      'Natural comforting warmth with gentle spicy-sweet aroma',
      'Supports circulation and balanced metabolism',
      'Unblended pure bark without cassia adulteration',
    ],
  },
  {
    id: 'tea-04',
    slug: 'sarsaparilla-tea',
    name: 'Sarsaparilla Tea',
    collection: 'tea',
    category: 'teas',
    categoryName: 'Herbal Root Infusions',
    price: 229, // Temporary development / test pricing
    originalPrice: 279,
    discount: '18% OFF',
    packSize: '100 g',
    isDevelopmentPrice: true,
    currency: 'INR',
    image: teaHero,
    standeeNotes: 'Regulates Blood Sugar, Natural Body Coolant',
    description: 'Traditional Nannari roots providing a sweet fragrant earthy aroma cherished as a natural rejuvenating infusion.',
    botanicalName: 'Hemidesmus indicus',
    origin: 'Southern Ghats Woodland Forage',
    brewingTime: '5–7 mins at 95°C',
    sourceCatalogue: 'Amoga Herbal Tea Standee Reference',
    inStock: true,
    isFeatured: false,
    badge: 'Natural Coolant',
    rating: 4.7,
    reviewCount: 84,
    details: [
      'Crushed sun-cured Nannari root bark (100 g pouch)',
      'Intensely aromatic vanilla-like botanical bouquet',
      'Renowned heritage Pitta-balancing cooling properties',
      'Ancient South Indian natural hydration staple',
    ],
  },
  {
    id: 'tea-05',
    slug: 'hibiscus-tea',
    name: 'Hibiscus Tea',
    collection: 'tea',
    category: 'teas',
    categoryName: 'Botanical Flower Brews',
    price: 249, // Temporary development / test pricing
    originalPrice: 299,
    discount: '16% OFF',
    packSize: '100 g',
    isDevelopmentPrice: true,
    currency: 'INR',
    image: teaHero,
    standeeNotes: 'Lowers Blood Pressure, Improves Cholesterol',
    description: 'Deep crimson infusion crafted from pure sun-dried whole hibiscus calyces with a tart, berry-like refreshing flavour.',
    botanicalName: 'Hibiscus sabdariffa',
    origin: 'Sun-Drenched Tropical Highlands',
    brewingTime: '4–5 mins at 90°C',
    sourceCatalogue: 'Amoga Herbal Tea Standee Reference',
    inStock: true,
    isFeatured: true,
    badge: 'Heart Tonic',
    rating: 5.0,
    reviewCount: 210,
    details: [
      'Whole, hand-separated deep ruby calyx petals (100 g pouch)',
      'Bracing natural cranberry tartness with floral undertones',
      'Rich in bioactive polyphenols and Vitamin C',
      'Exquisite served piping hot or chilled over crystal ice',
    ],
  },
];

export const getTeaProductBySlug = (slug) =>
  TEA_PRODUCTS.find((p) => p.slug === slug || p.id === slug);

export const getTeaProductsByCategory = (category) => {
  if (!category || category === 'all') return TEA_PRODUCTS;
  return TEA_PRODUCTS.filter((p) => p.category === category || p.categoryName === category);
};
