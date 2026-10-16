import React from 'react';
import { JewelleryHero } from './components/JewelleryHero';
import { JewelleryFeaturedGrid } from './components/JewelleryFeaturedGrid';
import { JewelleryCategoryGrid } from './components/JewelleryCategoryGrid';
import { JewelleryEditorialFeature } from './components/JewelleryEditorialFeature';
import { JewelleryPromoBanner } from './components/JewelleryPromoBanner';
import { ExploreCollectionsSection } from '../collections';


export function JewelleryStorefront() {
  return (
    <div className="bg-[#242326] text-[#F7F3EB] min-h-screen">
      {/* 1. Editorial Hero Section */}
      <JewelleryHero />

      {/* 2. Featured Signatures Showcase */}
      <JewelleryFeaturedGrid />

      {/* 3. Shop by Category Grid */}
      <JewelleryCategoryGrid />

      {/* 4. Editorial Design Storytelling */}
      <JewelleryEditorialFeature />

      {/* 5. Promotional Consultation Banner */}
      <JewelleryPromoBanner />

      {/* 6. Explore Collections Showcase */}
      <ExploreCollectionsSection currentCollectionId="jewellery" />
    </div>
  );
}
