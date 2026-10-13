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

/**
 * Accurately determines if a hex color has dark relative luminance (< 0.42).
 * Used to prevent dark text/headings from rendering on dark backgrounds.
 */
export function isDarkColor(hex) {
  if (!hex || typeof hex !== 'string') return false;
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6 && clean.length !== 3) return false;
  let r, g, b;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma < 0.42;
}

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
      headerBg: '#F8F6F0',
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
      bg: '#2C0E1A',
      sectionBg: '#35121F',
      headerBg: '#2C0E1A',
      headerText: '#F6EBD8',
      heading: '#F6EBD8',
      text: '#F6EBD8',
      mutedText: '#D8C6AD',
      accent: '#C5A46D',
      accentHover: '#B18A50',
      accentGold: '#C5A46D',
      accentLight: 'rgba(197, 164, 109, 0.15)',
      border: 'rgba(197, 164, 109, 0.35)',
      cardBg: '#35121F',
      cardBorder: '#C5A46D',
      inputBg: '#F6EBD8',
      inputText: '#292820',
      inputBorder: '#C5A46D',
      inputPlaceholder: '#746F63',
      focusRing: 'rgba(197, 164, 109, 0.45)',
      buttonBg: '#C5A46D',
      buttonText: '#2C0E1A',
      announcementBg: '#35121F',
      announcementText: '#F6EBD8',
      announcementAccent: '#C5A46D',
      noticeBg: '#35121F',
      noticeBorder: 'rgba(197, 164, 109, 0.45)',
      noticeText: '#F6EBD8',
      noticeTitle: '#C5A46D',
      noticeIcon: '#C5A46D',
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

    // Design Tokens (Warm Botanical Yellow & Infusions)
    palette: {
      bg: '#FAF1BB',
      sectionBg: '#FAF1BB',
      headerBg: '#FAF1BB',
      headerText: '#2C1E11',
      heading: '#2C1E11',
      text: '#2C1E11',
      mutedText: '#543B25',
      accent: '#8C6320',
      accentHover: '#6D4C18',
      accentLight: 'rgba(184, 142, 56, 0.15)',
      secondarySurface: '#FFFDF5',
      border: 'rgba(184, 142, 56, 0.28)',
      cardBg: '#FFFDF5',
      inputBg: '#FFFDF5',
      inputBorder: '#B88E38',
      focusRing: 'rgba(184, 142, 56, 0.45)',
      buttonText: '#FAF1BB',
      announcementBg: '#2C1E11',
      announcementText: '#FAF1BB',
      announcementAccent: '#B88E38',
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

// Live database collections cache in memory
let liveCollectionsCache = {};

export function registerLiveCollections(collectionsList) {
  if (!Array.isArray(collectionsList)) return;
  collectionsList.forEach((col) => {
    if (col && (col.id || col.slug)) {
      if (col.id) liveCollectionsCache[col.id.toLowerCase()] = col;
      if (col.slug) liveCollectionsCache[col.slug.toLowerCase()] = col;
    }
  });
}

/**
 * Returns configuration for a given collection ID, pathname, or collection record.
 * Handles aliases (/pantry, /wholesome-pantry, /wellness-tea, mixed, neutral)
 * and dynamically overlays saved database theme tokens and images.
 */
export function getCollectionTheme(collectionIdOrPath, directOverride = null) {
  if (!collectionIdOrPath && !directOverride) return COLLECTION_THEMES.food;

  let baseTheme = null;
  let lookupKey = '';
  let dbRecord = directOverride;

  if (typeof collectionIdOrPath === 'object' && collectionIdOrPath !== null) {
    dbRecord = collectionIdOrPath;
    lookupKey = String(collectionIdOrPath.id || collectionIdOrPath.slug || '').toLowerCase();
  } else {
    lookupKey = String(collectionIdOrPath || '').toLowerCase();
  }

  if (!dbRecord && lookupKey) {
    const cleanKey = lookupKey.replace(/^\/+/, '').split('/')[0];
    dbRecord = liveCollectionsCache[cleanKey] || liveCollectionsCache[lookupKey] || null;
  }

  if (lookupKey === 'food' || lookupKey === 'pantry' || lookupKey === 'wholesome-pantry' || lookupKey.includes('/food') || lookupKey.includes('/pantry')) {
    baseTheme = { ...COLLECTION_THEMES.food };
  } else if (lookupKey === 'sarees' || lookupKey === 'heritage-sarees' || lookupKey.includes('/sarees')) {
    baseTheme = { ...COLLECTION_THEMES.sarees };
  } else if (lookupKey === 'tea' || lookupKey === 'wellness-tea' || lookupKey.includes('/tea')) {
    baseTheme = { ...COLLECTION_THEMES.tea };
  } else if (lookupKey === 'jewellery' || lookupKey === 'silver-jewellery' || lookupKey.includes('/jewellery')) {
    baseTheme = { ...COLLECTION_THEMES.jewellery };
  } else if (lookupKey === 'gourmet') {
    baseTheme = { ...COLLECTION_THEMES.gourmet };
  } else if (lookupKey === 'neutral' || lookupKey === 'mixed' || lookupKey === 'amoga' || lookupKey === 'checkout') {
    baseTheme = { ...COLLECTION_THEMES.neutral };
  } else {
    // Dynamic custom collection
    const cleanId = lookupKey.replace(/^\/+/, '').split('/')[0] || 'custom';
    const capName = cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
    baseTheme = {
      id: cleanId,
      name: capName,
      title: capName.toUpperCase(),
      eyebrow: 'AMOGA ATELIER',
      subtitle: 'Curated Luxury Collection',
      homePath: `/${cleanId}`,
      productsPath: `/${cleanId}/products`,
      heroImage: foodHero,
      badge: 'Curated Collection',
      palette: {
        bg: '#FAF8F5',
        sectionBg: '#F3EFEA',
        headerBg: '#FFFFFF',
        headerText: '#1A1817',
        heading: '#1A1817',
        text: '#2C2520',
        mutedText: '#7A7167',
        accent: '#722F37',
        accentHover: '#5C242C',
        accentLight: 'rgba(114, 47, 55, 0.12)',
        border: '#E5E0D5',
        cardBg: '#FFFFFF',
        inputBg: '#FFFFFF',
        inputBorder: '#E5E0D5',
        focusRing: 'rgba(114, 47, 55, 0.35)',
        buttonText: '#FFFFFF',
        announcementBg: '#722F37',
        announcementText: '#FFFFFF',
        announcementAccent: '#FFFFFF',
      },
      announcement: `${capName} • Master Artisans • 100% Verified Provenance`,
      conciergePhone: '+91 9940018593',
      categories: [
        {
          id: 'all',
          name: 'All Offerings',
          tagline: 'Complete curated collection',
          path: `/${cleanId}/products`,
          count: 0,
        },
      ],
      contact: {
        heading: `${capName} Concierge Desk`,
        subheading: 'Enquiries, bespoke commissions, and telephone assistance.',
        phone1: '+91 9940018593',
        phone2: '+91 8056700646',
        email1: 'orders@amoga.com',
        email2: 'concierge@amoga.com',
        hours: 'Mon – Sat • 9:00 AM – 7:00 PM IST',
        provenanceTitle: 'Artisan Provenance',
        provenanceDesc: 'Curated handcrafted heritage offerings.',
        provenanceLocation: 'India • Serving Worldwide',
        provenanceBadge: 'Amoga Verified',
      },
    };
  }

  // Overlay database collection properties if available
  if (dbRecord) {
    if (dbRecord.name) baseTheme.name = dbRecord.name;
    if (dbRecord.heroHeading) baseTheme.title = dbRecord.heroHeading.toUpperCase();
    if (dbRecord.tagline) baseTheme.eyebrow = dbRecord.tagline.toUpperCase();
    if (dbRecord.heroSubheading) baseTheme.subtitle = dbRecord.heroSubheading;
    if (dbRecord.description) baseTheme.description = dbRecord.description;
    if (dbRecord.heroImage) baseTheme.heroImage = dbRecord.heroImage;
    if (dbRecord.cardImage) baseTheme.cardImage = dbRecord.cardImage;

    // Overlay custom palette if themeConfig JSON exists
    const p = { ...baseTheme.palette };
    if (dbRecord.accentColor) {
      p.accent = dbRecord.accentColor;
    }
    if (dbRecord.themeConfig && typeof dbRecord.themeConfig === 'object') {
      const tc = dbRecord.themeConfig;
      if (tc.bgColor) p.bg = tc.bgColor;
      if (tc.surfaceColor) p.cardBg = tc.surfaceColor;
      if (tc.textColor) p.text = tc.textColor;
      if (tc.mutedTextColor) p.mutedText = tc.mutedTextColor;
      if (tc.primaryColor) p.accent = tc.primaryColor;
      if (tc.accentColor) p.accent = tc.accentColor;
      if (tc.buttonBg) {
        p.buttonBg = tc.buttonBg;
        p.announcementBg = tc.buttonBg;
      }
      if (tc.buttonText) p.buttonText = tc.buttonText;
      if (tc.borderColor) p.border = tc.borderColor;
      if (tc.headingColor) {
        p.heading = tc.headingColor;
      } else if (tc.secondaryColor) {
        // Guard against contrast failure:
        // If the background is dark (e.g. Sarees #2C0E1A), NEVER use a dark secondary color (#451523) for heading!
        const darkBg = isDarkColor(p.bg);
        const darkSec = isDarkColor(tc.secondaryColor);
        if (darkBg && darkSec) {
          p.heading = tc.textColor || '#F6EBD8';
        } else {
          p.heading = tc.secondaryColor;
        }
      } else if (isDarkColor(p.bg) && (!p.heading || isDarkColor(p.heading))) {
        p.heading = p.text || '#F6EBD8';
      }
      if (tc.inputBg) p.inputBg = tc.inputBg;
      if (tc.inputText) p.inputText = tc.inputText;
      if (tc.inputPlaceholder) p.inputPlaceholder = tc.inputPlaceholder;
      if (tc.inputBorder) p.inputBorder = tc.inputBorder;
      if (tc.noticeBg) p.noticeBg = tc.noticeBg;
      if (tc.noticeBorder) p.noticeBorder = tc.noticeBorder;
      if (tc.noticeText) p.noticeText = tc.noticeText;
      if (tc.noticeTitle) p.noticeTitle = tc.noticeTitle;
    }
    baseTheme.palette = p;
  }

  return baseTheme;
}

/**
 * Generates an object of CSS variables for the given theme,
 * ready to apply to inline style or a provider wrapper.
 */
export function getThemeCssVariables(themeOrId, directOverride = null) {
  let theme = null;
  if (typeof themeOrId === 'object' && themeOrId !== null && themeOrId.palette) {
    theme = themeOrId;
  } else {
    theme = getCollectionTheme(themeOrId, directOverride);
  }

  const p = theme.palette || {};
  const isDark = isDarkColor(p.bg);

  // Compute robust defaults based on background luminance
  const defaultHeading = isDark ? (p.text || '#F6EBD8') : (p.heading || p.text || '#173B2A');
  const defaultText = isDark ? '#F6EBD8' : '#292820';
  const defaultMutedText = isDark ? '#D8C6AD' : '#65675A';
  const defaultInputBg = isDark ? '#F6EBD8' : (p.inputBg || p.cardBg || '#F8F7F0');
  const defaultInputText = '#292820';
  const defaultInputPlaceholder = '#746F63';
  const defaultButtonBg = p.buttonBg || p.accent || (isDark ? '#C5A46D' : '#3F7B43');
  const defaultButtonText = p.buttonText || (isDark ? '#2C0E1A' : '#FFFFFF');

  return {
    '--collection-page-bg': p.bg || (isDark ? '#2C0E1A' : '#F3F0E7'),
    '--collection-section-bg': p.sectionBg || p.bg || (isDark ? '#35121F' : '#EAE8DC'),
    '--collection-card-bg': p.cardBg || (isDark ? '#35121F' : '#FAF9F4'),
    '--collection-card-border': p.cardBorder || p.border || (isDark ? '#C5A46D' : '#D9DCCD'),
    '--collection-text': p.text || defaultText,
    '--collection-text-muted': p.mutedText || defaultMutedText,
    '--collection-heading': p.heading || defaultHeading,
    '--collection-accent': p.accent || (isDark ? '#C5A46D' : '#3F7B43'),
    '--collection-accent-hover': p.accentHover || p.accent || (isDark ? '#B18A50' : '#2F6334'),
    '--collection-accent-light': p.accentLight || 'rgba(63, 123, 67, 0.12)',
    '--collection-border': p.border || (isDark ? 'rgba(197, 164, 109, 0.35)' : '#D9DCCD'),
    '--collection-input-bg': p.inputBg || defaultInputBg,
    '--collection-input-text': p.inputText || defaultInputText,
    '--collection-input-border': p.inputBorder || p.border || (isDark ? '#C5A46D' : '#D9DCCD'),
    '--collection-input-placeholder': p.inputPlaceholder || defaultInputPlaceholder,
    '--collection-focus-ring': p.focusRing || (isDark ? 'rgba(197, 164, 109, 0.45)' : 'rgba(63, 123, 67, 0.45)'),
    '--collection-button-bg': defaultButtonBg,
    '--collection-button-text': defaultButtonText,
    '--collection-btn-text': defaultButtonText,
    '--collection-notice-bg': p.noticeBg || (isDark ? '#35121F' : (p.sectionBg || '#EAE8DC')),
    '--collection-notice-border': p.noticeBorder || (isDark ? 'rgba(197, 164, 109, 0.45)' : (p.border || '#D9DCCD')),
    '--collection-notice-text': p.noticeText || (isDark ? '#F6EBD8' : (p.text || '#292820')),
    '--collection-notice-title': p.noticeTitle || (isDark ? '#C5A46D' : (p.heading || '#173B2A')),
    '--collection-notice-icon': p.noticeIcon || (isDark ? '#C5A46D' : (p.accent || '#3F7B43')),
    // Fallbacks for standard variables
    '--bg-primary': p.bg || (isDark ? '#2C0E1A' : '#F3F0E7'),
    '--bg-surface': p.cardBg || (isDark ? '#35121F' : '#FAF9F4'),
    '--bg-elevated': p.sectionBg || (isDark ? '#35121F' : '#EAE8DC'),
    '--text-primary': p.text || defaultText,
    '--text-secondary': p.mutedText || defaultMutedText,
    '--accent-primary': p.accent || (isDark ? '#C5A46D' : '#3F7B43'),
    '--border-subtle': p.border || (isDark ? 'rgba(197, 164, 109, 0.35)' : '#D9DCCD'),
  };
}
