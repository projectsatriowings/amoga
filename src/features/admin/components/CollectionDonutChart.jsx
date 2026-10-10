import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Coffee, Sparkles, Gem } from 'lucide-react';

const COLLECTION_CONFIG = {
  food: {
    label: 'Wholesome Pantry',
    color: '#3F5A35',
    icon: Utensils,
  },
  tea: {
    label: 'Wellness Tea',
    color: '#B08A4D',
    icon: Coffee,
  },
  sarees: {
    label: 'Heritage Sarees',
    color: '#762F39',
    icon: Sparkles,
  },
  jewellery: {
    label: 'Silver Jewellery',
    color: '#292820',
    icon: Gem,
  },
};

export function CollectionDonutChart({ collectionPerformance = [] }) {
  const [hoveredCollection, setHoveredCollection] = useState(null);

  const totalRevenue = collectionPerformance.reduce(
    (acc, curr) => acc + (curr.totalRevenue || 0),
    0
  );

  const totalUnits = collectionPerformance.reduce(
    (acc, curr) => acc + (curr.totalQuantitySold || 0),
    0
  );

  // Normalize segments
  const segments = ['sarees', 'jewellery', 'food', 'tea'].map((colId) => {
    const item = collectionPerformance.find((c) => c.collectionId === colId) || {
      collectionId: colId,
      totalRevenue: 0,
      totalQuantitySold: 0,
    };
    const config = COLLECTION_CONFIG[colId] || {
      label: colId,
      color: '#762F39',
      icon: Sparkles,
    };
    const percentage = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 25;
    return {
      id: colId,
      label: config.label,
      color: config.color,
      icon: config.icon,
      revenue: item.totalRevenue,
      units: item.totalQuantitySold,
      percentage: Number(percentage.toFixed(1)),
    };
  });

  // SVG Geometry
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Chart Canvas and Center Stat */}
      <div className="relative flex items-center justify-center py-4">
        <svg
          viewBox="0 0 160 160"
          className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90 drop-shadow-xs"
        >
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#F0ECE3"
            strokeWidth="18"
          />

          {/* Animated Donut Segments */}
          {segments.map((segment) => {
            const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += segment.percentage;

            const isHovered = hoveredCollection === segment.id;

            return (
              <motion.circle
                key={segment.id}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={isHovered ? 22 : 18}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{
                  strokeDasharray,
                  strokeWidth: isHovered ? 22 : 18,
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredCollection(segment.id)}
                onMouseLeave={() => setHoveredCollection(null)}
              />
            );
          })}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <AnimatePresence mode="wait">
            {hoveredCollection ? (
              <motion.div
                key={hoveredCollection}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="space-y-0.5"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F63] block">
                  {COLLECTION_CONFIG[hoveredCollection]?.label}
                </span>
                <span className="font-sans font-bold text-base text-[#292820] tabular-nums block">
                  ₹{segments.find((s) => s.id === hoveredCollection)?.revenue.toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-[10px] font-mono font-medium text-[#762F39]">
                  {segments.find((s) => s.id === hoveredCollection)?.percentage}% share
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="overall"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-0.5"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F63] block">
                  Total Revenue
                </span>
                <span className="font-sans font-bold text-base sm:text-lg text-[#292820] tabular-nums block">
                  ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-mono text-[#3F5A35]">
                  {totalUnits} Units Sold
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="pt-3 border-t border-[#E5E0D5] grid grid-cols-2 gap-2 text-xs">
        {segments.map((seg) => {
          const isHovered = hoveredCollection === seg.id;
          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredCollection(seg.id)}
              onMouseLeave={() => setHoveredCollection(null)}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                isHovered ? 'bg-[#F8F6F0]' : 'hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-sans text-[11px] font-medium text-[#292820] truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 pl-4 text-[10px] font-mono text-[#746F63]">
                <span className="tabular-nums">₹{seg.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="font-semibold text-[#292820] tabular-nums">{seg.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
