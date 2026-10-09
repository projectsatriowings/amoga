/**
 * AMOGA HERITAGE SAREES — COLLECTION CATEGORIES
 * Sourced directly from approved reference designs and architectural specs.
 */

import sareeKanchipuram from '../../../assets/images/saree-kanchipuram.jpg';
import sareeBanarasi from '../../../assets/images/saree-banarasi.jpg';
import sareeTissue from '../../../assets/images/saree-tissue.jpg';
import sareeSoftSilk from '../../../assets/images/saree-soft-silk.jpg';
import sareeModelHero from '../../../assets/images/saree-model-hero.jpg';

export const SAREE_CATEGORIES = [
  {
    id: 'all',
    name: 'All Sarees',
    tagline: 'The complete handloom and heritage curation',
    image: sareeModelHero,
    count: 12,
  },
  {
    id: 'silk',
    name: 'Silk Sarees',
    tagline: 'Pure mulberry, raw and handloom silks with timeless lustre',
    image: sareeKanchipuram,
    badge: 'Pure Silk',
    count: 5,
  },
  {
    id: 'traditional',
    name: 'Traditional Weaves',
    tagline: 'Centuries-old regional weaving traditions and temple motifs',
    image: sareeBanarasi,
    badge: 'Artisanal Heritage',
    count: 3,
  },
  {
    id: 'festive',
    name: 'Festive Collection',
    tagline: 'Opulent drapes, radiant hues, and ceremonial zari brilliance',
    image: sareeTissue,
    badge: 'Festive Grandeur',
    count: 2,
  },
  {
    id: 'wedding',
    name: 'Wedding Sarees',
    tagline: 'Heavy bridal brocades and heirloom bridal silks for auspicious celebrations',
    image: sareeKanchipuram,
    badge: 'Bridal Heirlooms',
    count: 2,
  },
  {
    id: 'contemporary',
    name: 'Contemporary Designs',
    tagline: 'Featherlight soft silks, breathable weaves, and modern palettes',
    image: sareeSoftSilk,
    badge: 'Modern Grace',
    count: 2,
  },
];
