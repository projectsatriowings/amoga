import React from 'react';
import { SareeHero } from './components/SareeHero';
import { SareeFeaturedGrid } from './components/SareeFeaturedGrid';
import { SareeCategoryGrid } from './components/SareeCategoryGrid';
import { EditorialTextileFeature } from './components/EditorialTextileFeature';
import { SareePromoBanner } from './components/SareePromoBanner';


export function SareesStorefront() {
  return (
    <div className="bg-[#2C0E1A] text-[#F6EBD8] min-h-screen">
      {/* 1. Editorial Hero Section */}
      <SareeHero />

      {/* 2. Featured Sarees Carousel / Grid (4 Verified Reference Sarees) */}
      <SareeFeaturedGrid />

      {/* 3. Shop by Collection Grid */}
      <SareeCategoryGrid />

      {/* 4. Editorial Textile Feature Storytelling */}
      <EditorialTextileFeature />

      {/* 5. Promotional Campaign Banner */}
      <SareePromoBanner />
    </div>
  );
}
