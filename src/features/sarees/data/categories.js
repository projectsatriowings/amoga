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
    id: 'saree',
    name: 'Saree',
    tagline: 'Pure mulberry, raw, and traditional handloom silk drapes',
    image: sareeKanchipuram,
    badge: 'Heritage Saree',
    count: 6,
  },
  {
    id: 'salwar',
    name: 'Salwar',
    tagline: 'Handcrafted salwar suits, kurtas, and traditional unstitched sets',
    image: sareeBanarasi,
    badge: 'Artisanal Salwar',
    count: 3,
  },
  {
    id: 'half-saree',
    name: 'Half Saree',
    tagline: 'Traditional South Indian half saree and langa voni ensembles',
    image: sareeTissue,
    badge: 'Half Saree',
    count: 3,
  },
];
