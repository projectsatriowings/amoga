/**
 * AMOGA STOREFRONT — CENTRALIZED COLLECTION THEMES & CONFIGURATION
 * 
 * Provides unified theme tokens, category menus, contact information,
 * and design specifications for all four artisanal collections:
 * 1. Wholesome Pantry (Food & Traditional Blends)
 * 2. Heritage Sarees (Master Looms & Silkmark Silks)
 * 3. Wellness Tea (Botanical & Herbal Tisanes)
 * 4. Silver Jewellery (Modern Heirlooms & 925 Sterling)
 */

import foodHero from '../../assets/images/gatekeeper-food.jpg';
import teaHero from '../../assets/images/food-teas-hero.jpg';
import sareesHero from '../../assets/images/gatekeeper-sarees.jpg';
import jewelleryHero from '../../assets/images/gatekeeper-jewellery.jpg';

export const COLLECTION_THEMES = {
  food: {
    id: 'food',
    name: 'Wholesome Pantry',
    title: 'WHOLESOME PANTRY',
    eyebrow: 'THE GOODNESS OF TRADITION',
    subtitle: 'Traditional Blends & Mixes',
    homePath: '/food',
    productsPath: '/food/products',
    heroImage: foodHero,
    badge: 'Traditional Blends',

    // Design Tokens
    palette: {
      bg: '#F3F0E7',
      sectionBg: '#EAE8DC',
      headerBg: '#F3F0E7',
      headerText: '#173B2A',
      heading: '#173B2A',
      text: '#292820',
      mutedText: '#65675A',
      accent: '#3F7B43',
      accentHover: '#2F6334',
      accentLight: 'rgba(63, 123, 67, 0.12)',
      border: '#D9DCCD',
      cardBg: '#FAF9F4',
      inputBg: '#F8F7F0',
      inputBorder: '#D9DCCD',
      focusRing: 'rgba(63, 123, 67, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#173B2A',
      announcementText: '#E5E0D5',
      announcementAccent: '#3F7B43',
    },

    announcement: 'Traditional Stone-Ground Pantry • 100% Preservative-Free • Wholesome Grains',
    conciergePhone: '+91 9940018593',

    // Standard Categories
    categories: [
      {
        id: 'all',
        name: 'All Mixes',
        tagline: 'Complete traditional pantry curation',
        path: '/food/products',
        count: 55,
      },
      {
        id: 'soups',
        name: 'Soup Mixes',
        tagline: 'Nourishing herbal and botanical vegetable broths',
        path: '/food/products?category=soups',
        count: 20,
      },
      {
        id: 'millets',
        name: 'Millet Mixes',
        tagline: 'Ancient indigenous grains and wholesome breakfast blends',
        path: '/food/products?category=millets',
        count: 10,
      },
      {
        id: 'podis',
        name: 'Rice Podis',
        tagline: 'Traditional spiced aromatic lentils and roasted podis',
        path: '/food/products?category=podis',
        count: 25,
      },
    ],

    // Contact Information
    contact: {
      heading: 'Wholesome Pantry Concierge & Orders Desk',
      subheading:
        'Have questions about traditional soup mixes, millet recipes, or rice podis? Connect with our team for telephone order assistance, bulk enquiries, and culinary recommendations.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'orders@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Pantry Kitchen & Provenance',
      provenanceDesc: 'Traditional preparation hub sourcing indigenous South Indian grains & leaves.',
      provenanceLocation: 'Salem, Tamil Nadu • Serving Nationwide Pan-India',
      provenanceBadge: 'Authentic Stone-Ground Formulations',
    },
  },

  sarees: {
    id: 'sarees',
    name: 'Heritage Sarees',
    title: 'HERITAGE SAREES',
    eyebrow: 'TIMELESS WEAVES',
    subtitle: 'Heritage Sarees • Timeless Weaves',
    homePath: '/sarees',
    productsPath: '/sarees/products',
    heroImage: sareesHero,
    badge: 'Artisanal Handlooms',

    // Design Tokens (Burgundy & Antique Gold Luxury)
    palette: {
      bg: '#F3EAE1',
      sectionBg: '#E9DCD0',
      headerBg: '#2C0E1A',
      headerText: '#F6EBD8',
      heading: '#3B111E',
      text: '#3B111E',
      mutedText: '#775B5C',
      accent: '#6E263A',
      accentHover: '#501A2B',
      accentGold: '#B18A50',
      accentLight: 'rgba(110, 38, 58, 0.12)',
      border: '#E0CFC0',
      cardBg: '#FBF5ED',
      inputBg: '#F8F0E7',
      inputBorder: '#E0CFC0',
      focusRing: 'rgba(110, 38, 58, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#451523',
      announcementText: '#C5A46D',
      announcementAccent: '#F6EBD8',
    },

    announcement: 'Heritage Handlooms • Authentic Silkmark Silks • Master Loom Craftsmanship',
    conciergePhone: '+91 9940018593',

    // Standard Categories
    categories: [
      {
        id: 'all',
        name: 'All Sarees',
        tagline: 'The complete handloom and heritage curation',
        path: '/sarees/products',
        count: 12,
      },
      {
        id: 'silk',
        name: 'Silk Sarees',
        tagline: 'Pure mulberry, raw and handloom silks with timeless lustre',
        path: '/sarees/products?category=silk',
        count: 5,
      },
      {
        id: 'traditional',
        name: 'Traditional Collections',
        tagline: 'Centuries-old regional weaving traditions and temple motifs',
        path: '/sarees/products?category=traditional',
        count: 3,
      },
      {
        id: 'festive',
        name: 'Festive Collection',
        tagline: 'Opulent drapes, radiant hues, and ceremonial zari brilliance',
        path: '/sarees/products?category=festive',
        count: 2,
      },
    ],

    // Contact Information
    contact: {
      heading: 'Heritage Sarees Bridal Concierge & Private Appointments',
      subheading:
        'Connect with our master drape advisors for bespoke bridal trousseaus, heirloom silk authentication, and private salon appointments.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'concierge@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Master Weavers Atelier',
      provenanceDesc: 'Authentic temple Kanchipuram and Varanasi brocades preserved across generations.',
      provenanceLocation: 'Kanchipuram & Varanasi Master Looms',
      provenanceBadge: 'Certified Pure Silkmark Handlooms',
    },
  },

  tea: {
    id: 'tea',
    name: 'Wellness Tea',
    title: 'WELLNESS TEA',
    eyebrow: 'BOTANICAL WELLNESS',
    subtitle: 'Botanical Teas & Herbal Infusions',
    homePath: '/tea',
    productsPath: '/tea/products',
    heroImage: teaHero,
    badge: 'Botanical Rituals',

    // Design Tokens (Botanical & Calming Earthy Tones)
    palette: {
      bg: '#F0F1E8',
      sectionBg: '#E5E9DC',
      headerBg: '#F0F1E8',
      headerText: '#263A2D',
      heading: '#1E3124',
      text: '#263A2D',
      mutedText: '#657164',
      accent: '#6C8461',
      accentHover: '#506A49',
      accentLight: 'rgba(108, 132, 97, 0.14)',
      secondarySurface: '#E5E9DC',
      border: '#D5DDCE',
      cardBg: '#F8F8F2',
      inputBg: '#F5F6EF',
      inputBorder: '#D5DDCE',
      focusRing: 'rgba(108, 132, 97, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#254332',
      announcementText: '#FAF1BB',
      announcementAccent: '#6C8461',
    },

    announcement: 'Single-Estate Botanicals • Handpicked Whole Blossoms • Zero Artificial Flavours',
    conciergePhone: '+91 9940018593',

    // Standard Categories
    categories: [
      {
        id: 'all',
        name: 'All Teas',
        tagline: 'Complete curation of artisanal botanical brews',
        path: '/tea/products',
        count: 5,
      },
      {
        id: 'flower',
        name: 'Botanical Flower Brews',
        tagline: 'Whole butterfly blue pea and crimson hibiscus blossoms',
        path: '/tea/products?category=flower',
        count: 2,
      },
      {
        id: 'leaf',
        name: 'Medicinal Leaf Brews',
        tagline: 'Nutrient-rich drumstick and ancient botanical foliage',
        path: '/tea/products?category=leaf',
        count: 1,
      },
      {
        id: 'herbal',
        name: 'Herbal & Root Brews',
        tagline: 'Soothing organic Ceylon cinnamon and sarsaparilla tonics',
        path: '/tea/products?category=herbal',
        count: 2,
      },
    ],

    // Contact Information
    contact: {
      heading: 'Wellness Tea Botanical Concierge & Orders',
      subheading:
        'Enquire about our single-estate botanical flower blossoms, wellness tisane formulations, or customized retail gifting collections.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'orders@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Botanical Tea Gardens',
      provenanceDesc: 'Sun-dried and shade-cured indigenous florals harvested with zero synthetic processing.',
      provenanceLocation: 'Western Ghats & Tamil Nadu Botanical Estates',
      provenanceBadge: 'Naturally Caffeine-Free Tisanes',
    },
  },

  jewellery: {
    id: 'jewellery',
    name: 'Silver Jewellery',
    title: 'SILVER JEWELLERY',
    eyebrow: 'MODERN HEIRLOOMS',
    subtitle: 'Silver Jewellery • Modern Heirlooms',
    homePath: '/jewellery',
    productsPath: '/jewellery/products',
    heroImage: jewelleryHero,
    badge: '925 Sterling Craft',

    // Design Tokens (Refined Silver & Cool Neutral)
    palette: {
      bg: '#F0F1F1',
      sectionBg: '#E5E7E8',
      headerBg: '#242326',
      headerText: '#F7F3EB',
      heading: '#25272A',
      text: '#25272A',
      mutedText: '#65696D',
      accent: '#737C86',
      accentGold: '#C6AD82',
      accentHover: '#525B65',
      accentLight: 'rgba(115, 124, 134, 0.14)',
      deepCharcoal: '#34373A',
      border: '#D6D9DC',
      cardBg: '#F8F9F9',
      inputBg: '#F4F5F5',
      inputBorder: '#D6D9DC',
      focusRing: 'rgba(115, 124, 134, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#1C1B1E',
      announcementText: '#E2E3E5',
      announcementAccent: '#C6AD82',
    },

    announcement: 'Solid 925 Sterling Silver • Hypoallergenic Finishing • Handcrafted Modern Heirlooms',
    conciergePhone: '+91 9940018593',

    // Standard Categories
    categories: [
      {
        id: 'all',
        name: 'All Jewellery',
        tagline: 'Complete curation of modern and timeless silver heirlooms',
        path: '/jewellery/products',
        count: 10,
      },
      {
        id: 'rings',
        name: 'Rings',
        tagline: 'Sculptural bands, solitaires, and botanical motifs in sterling silver',
        path: '/jewellery/products?category=rings',
        count: 4,
      },
      {
        id: 'necklaces',
        name: 'Necklaces & Pendants',
        tagline: 'Teardrop solitaires, geometric bars, and fluid sterling chains',
        path: '/jewellery/products?category=necklaces',
        count: 2,
      },
      {
        id: 'earrings',
        name: 'Earrings',
        tagline: 'Weightless micro-studs, drops, and hoops for everyday refinement',
        path: '/jewellery/products?category=earrings',
        count: 2,
      },
      {
        id: 'bracelets',
        name: 'Bracelets & Cuffs',
        tagline: 'Architectural wrist cuffs and fluid linkages designed for layering',
        path: '/jewellery/products?category=bracelets',
        count: 1,
      },
      {
        id: 'traditional',
        name: 'Traditional Silver',
        tagline: 'Heritage silver jewellery with regional motifs and antique finishes',
        path: '/jewellery/products?category=traditional',
        count: 1,
      },
    ],

    // Contact Information
    contact: {
      heading: 'Silver Jewellery Atelier Concierge',
      subheading:
        'Inquire about custom 925 sterling sizing, bespoke bridal heirloom commissions, gemstone certification, and private jewelry consultations.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'concierge@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Silversmith Guild Atelier',
      provenanceDesc: 'Hallmarked 925 sterling silver cast and hand-polished by master artisans.',
      provenanceLocation: 'Salem & Madurai Silversmith Guilds, Tamil Nadu',
      provenanceBadge: 'Hallmarked 925 Sterling Silver',
    },
  },

  gourmet: {
    id: 'gourmet',
    name: 'Gourmet Food',
    title: 'GOURMET FOOD',
    eyebrow: 'PURE ARTISANAL FLAVOUR',
    subtitle: 'Gourmet Provisions & Botanical Harvests',
    homePath: '/food',
    productsPath: '/food/products',
    heroImage: foodHero,
    badge: 'Artisanal Harvests',

    palette: {
      bg: '#F3F0E7',
      sectionBg: '#EAE6DB',
      headerBg: '#F3F0E7',
      headerText: '#173B2A',
      heading: '#1B351E',
      text: '#292820',
      mutedText: '#65675A',
      accent: '#3F5A35',
      accentHover: '#2F4528',
      accentLight: 'rgba(63, 90, 53, 0.12)',
      border: '#DDD7C9',
      cardBg: '#FAF8F2',
      inputBg: '#F7F5ED',
      inputBorder: '#DDD7C9',
      focusRing: 'rgba(63, 90, 53, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#1B351E',
      announcementText: '#DDD7C9',
      announcementAccent: '#3F5A35',
    },

    announcement: 'Estate Harvests • Slow-Crafted Quality • Certified Organic Ingredients',
    conciergePhone: '+91 9940018593',
    categories: [],
    contact: {
      heading: 'Gourmet Provisions Concierge',
      subheading: 'Enquiries for bespoke pantry curations and culinary gifting.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'orders@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Artisanal Pantry Hub',
      provenanceDesc: 'Craft culinary traditions preserved across regional master growers.',
      provenanceLocation: 'Tamil Nadu & Kerala Agricultural Estates',
      provenanceBadge: 'Pure Organic Heritage',
    },
  },

  neutral: {
    id: 'neutral',
    name: 'Amoga Unified Commerce',
    title: 'AMOGA COMMERCE',
    eyebrow: 'UNIFIED LUXURY & HERITAGE',
    subtitle: 'Curated Selections Across Amoga Houses',
    homePath: '/',
    productsPath: '/food/products',
    heroImage: foodHero,
    badge: 'Unified Commerce',

    palette: {
      bg: '#F4F2EC',
      sectionBg: '#EAE6DB',
      headerBg: '#F4F2EC',
      headerText: '#292820',
      heading: '#1C2D20',
      text: '#292820',
      mutedText: '#65675A',
      accent: '#3F5A35',
      accentHover: '#2E4426',
      accentLight: 'rgba(63, 90, 53, 0.12)',
      border: '#DCD6C7',
      cardBg: '#FAF9F4',
      inputBg: '#F7F5ED',
      inputBorder: '#DCD6C7',
      focusRing: 'rgba(63, 90, 53, 0.45)',
      buttonText: '#FFFFFF',
      announcementBg: '#1C2D20',
      announcementText: '#DCD6C7',
      announcementAccent: '#3F5A35',
    },

    announcement: 'Slow Craft • Timeless Heritage • Transparent Quality Across All Amoga Houses',
    conciergePhone: '+91 9940018593',
    categories: [],
    contact: {
      heading: 'Amoga Client Care & Concierge Desk',
      subheading: 'Seamless order support, bespoke gifting advice, and concierge delivery management across all collections.',
      phone1: '+91 9940018593',
      phone2: '+91 8056700646',
      email1: 'concierge@amoga.com',
      email2: 'support@amoga.com',
      hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
      provenanceTitle: 'Amoga Master Curations',
      provenanceDesc: 'Four artisanal disciplines united under certified provenance standards.',
      provenanceLocation: 'Pan-India Atelier & Master Artisan Guilds',
      provenanceBadge: 'Amoga Verified Artisanship',
    },
  },
};

/**
 * Returns configuration for a given collection ID or pathname.
 * Handles aliases (/pantry, /wholesome-pantry, /wellness-tea, mixed, neutral).
 */
export function getCollectionTheme(collectionIdOrPath) {
  if (!collectionIdOrPath) return COLLECTION_THEMES.food;

  const key = String(collectionIdOrPath).toLowerCase();
  if (key === 'food' || key === 'pantry' || key === 'wholesome-pantry' || key.includes('/food') || key.includes('/pantry')) {
    return COLLECTION_THEMES.food;
  }
  if (key === 'sarees' || key === 'heritage-sarees' || key.includes('/sarees')) {
    return COLLECTION_THEMES.sarees;
  }
  if (key === 'tea' || key === 'wellness-tea' || key.includes('/tea')) {
    return COLLECTION_THEMES.tea;
  }
  if (key === 'jewellery' || key === 'silver-jewellery' || key.includes('/jewellery')) {
    return COLLECTION_THEMES.jewellery;
  }
  if (key === 'gourmet') {
    return COLLECTION_THEMES.gourmet;
  }
  if (key === 'neutral' || key === 'mixed' || key === 'amoga' || key === 'checkout') {
    return COLLECTION_THEMES.neutral;
  }
  return COLLECTION_THEMES.food;
}

/**
 * Generates an object of CSS variables for the given theme,
 * ready to apply to inline style or a provider wrapper.
 */
export function getThemeCssVariables(themeOrId) {
  const theme = typeof themeOrId === 'string' ? getCollectionTheme(themeOrId) : (themeOrId || COLLECTION_THEMES.food);
  const p = theme.palette || {};
  return {
    '--collection-page-bg': p.bg || '#F3F0E7',
    '--collection-section-bg': p.sectionBg || '#EAE8DC',
    '--collection-card-bg': p.cardBg || '#FAF9F4',
    '--collection-text': p.text || '#292820',
    '--collection-text-muted': p.mutedText || '#65675A',
    '--collection-heading': p.heading || '#173B2A',
    '--collection-accent': p.accent || '#3F7B43',
    '--collection-accent-hover': p.accentHover || '#2F6334',
    '--collection-accent-light': p.accentLight || 'rgba(63, 123, 67, 0.12)',
    '--collection-border': p.border || '#D9DCCD',
    '--collection-input-bg': p.inputBg || '#F8F7F0',
    '--collection-input-border': p.inputBorder || '#D9DCCD',
    '--collection-focus-ring': p.focusRing || 'rgba(63, 123, 67, 0.45)',
    '--collection-button-text': p.buttonText || '#FFFFFF',
    // Fallbacks for standard variables
    '--bg-primary': p.bg || '#F3F0E7',
    '--bg-surface': p.cardBg || '#FAF9F4',
    '--bg-elevated': p.sectionBg || '#EAE8DC',
    '--text-primary': p.text || '#292820',
    '--text-secondary': p.mutedText || '#65675A',
    '--accent-primary': p.accent || '#3F7B43',
    '--border-subtle': p.border || '#D9DCCD',
  };
}
