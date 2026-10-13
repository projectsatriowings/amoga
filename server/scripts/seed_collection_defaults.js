import { prisma } from '../src/config/prisma.js';

async function updateDefaults() {
  const defaults = {
    food: {
      tagline: 'The Goodness of Tradition',
      heroHeading: 'Wholesome Pantry',
      heroSubheading: 'Traditional blends for everyday nourishment.',
      description: 'Discover traditional Indian blends made for everyday cooking, from comforting soup mixes to nourishing millet blends and flavourful rice podi.',
      shortDescription: 'Traditional stone-ground pantry blends, wholesome grain mixes, and comforting vegetable broths.',
      accentColor: '#3F7B43',
      heroImage: '/images/gatekeeper-food.jpg',
      cardImage: '/images/gatekeeper-food.jpg',
      themeConfig: {
        primaryColor: '#3F7B43',
        secondaryColor: '#173B2A',
        bgColor: '#F3F0E7',
        surfaceColor: '#FAF9F4',
        textColor: '#292820',
        mutedTextColor: '#65675A',
        accentColor: '#3F7B43',
        buttonBg: '#173B2A',
        buttonText: '#FFFFFF',
        borderColor: '#D9DCCD'
      }
    },
    tea: {
      tagline: 'Botanical Wellness',
      heroHeading: 'Wellness Tea',
      heroSubheading: 'Botanical teas and herbal infusions for your everyday tea ritual.',
      description: 'Discover thoughtfully selected botanical teas and herbal infusions, whole floral calyces, and single-estate herbs for comforting everyday rituals.',
      shortDescription: 'Single-estate sun-dried blossoms, pure herbal tisanes, and restorative aromatic infusions.',
      accentColor: '#65815A',
      heroImage: '/images/food-teas-hero.jpg',
      cardImage: '/images/food-teas-hero.jpg',
      themeConfig: {
        primaryColor: '#65815A',
        secondaryColor: '#173B2A',
        bgColor: '#FAF1BB',
        surfaceColor: '#FFFDF5',
        textColor: '#2C1E11',
        mutedTextColor: '#7D5C3F',
        accentColor: '#65815A',
        buttonBg: '#173B2A',
        buttonText: '#FFFFFF',
        borderColor: '#B88E38'
      }
    },
    sarees: {
      tagline: 'Timeless Weaves',
      heroHeading: 'The Heritage in Every Drape',
      heroSubheading: 'Master handlooms hand-loomed in pure mulberry silk with authentic zari borders.',
      description: "Discover Amoga's curated collection of traditional silk sarees, crafted with timeless artistry, royal heritage, and unmatched elegance from master weaver clusters.",
      shortDescription: 'Kanchipuram pure silk, Banarasi brocades, and heirloom zari handlooms certified with authentic silkmark provenance.',
      accentColor: '#C5A46D',
      heroImage: '/images/saree-model-hero.jpg',
      cardImage: '/images/gatekeeper-sarees.jpg',
      themeConfig: {
        primaryColor: '#C5A46D',
        secondaryColor: '#451523',
        headingColor: '#F6EBD8',
        bgColor: '#2C0E1A',
        surfaceColor: '#35121F',
        textColor: '#F6EBD8',
        mutedTextColor: '#D8C6AD',
        accentColor: '#C5A46D',
        buttonBg: '#C5A46D',
        buttonText: '#2C0E1A',
        borderColor: '#C5A46D',
        inputBg: '#F6EBD8',
        inputText: '#292820',
        inputPlaceholder: '#746F63',
        inputBorder: '#C5A46D',
        noticeBg: '#35121F',
        noticeBorder: '#C5A46D',
        noticeText: '#F6EBD8',
        noticeTitle: '#C5A46D'
      }
    },
    jewellery: {
      tagline: 'Modern Heirlooms',
      heroHeading: 'Pure 925 Sterling Silver',
      heroSubheading: 'Refined silver jewellery crafted with sculptural precision and timeless motifs.',
      description: 'Explore refined 925 sterling silver heirlooms designed with timeless elegance and modern character, crafted by traditional silver smiths.',
      shortDescription: 'Hallmarked 925 sterling silver rings, necklaces, cuffs, and artisanal heirloom jewellery.',
      accentColor: '#B9B8B5',
      heroImage: '/images/jewellery-model-hero.jpg',
      cardImage: '/images/gatekeeper-jewellery.jpg',
      themeConfig: {
        primaryColor: '#B9B8B5',
        secondaryColor: '#343238',
        headingColor: '#25272A',
        bgColor: '#242326',
        surfaceColor: '#343238',
        textColor: '#F7F3EB',
        mutedTextColor: '#B9B8B5',
        accentColor: '#B9B8B5',
        buttonBg: '#F7F3EB',
        buttonText: '#111215',
        borderColor: '#B9B8B5'
      }
    }
  };

  for (const [id, data] of Object.entries(defaults)) {
    const col = await prisma.collection.findUnique({ where: { id } });
    if (col) {
      await prisma.collection.update({
        where: { id },
        data: {
          heroHeading: col.heroHeading || data.heroHeading,
          heroSubheading: col.heroSubheading || data.heroSubheading,
          shortDescription: col.shortDescription || data.shortDescription,
          heroImage: col.heroImage || data.heroImage,
          cardImage: col.cardImage || data.cardImage,
          themeConfig: { ...(col.themeConfig && typeof col.themeConfig === 'object' ? col.themeConfig : {}), ...data.themeConfig },
          tagline: col.tagline || data.tagline
        }
      });
      console.log('✓ Successfully set defaults for collection:', id);
    }
  }
}

updateDefaults().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
