import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Coffee, Sparkles, Gem, Utensils, ArrowRight } from 'lucide-react';

export function CollectionContributionCard({ collectionPerformance = [] }) {
  const collectionMeta = {
    food: {
      name: 'Wholesome Pantry',
      icon: Utensils,
      color: '#3F5A35',
      bg: 'bg-[#3F5A35]/10',
      border: 'border-[#3F5A35]/30',
      text: 'text-[#3F5A35]',
    },
    tea: {
      name: 'Wellness Tea',
      icon: Coffee,
      color: '#8C6320',
      bg: 'bg-[#8C6320]/10',
      border: 'border-[#8C6320]/30',
      text: 'text-[#8C6320]',
    },
    sarees: {
      name: 'Heritage Sarees',
      icon: Sparkles,
      color: '#762F39',
      bg: 'bg-[#762F39]/10',
      border: 'border-[#762F39]/30',
      text: 'text-[#762F39]',
    },
    jewellery: {
      name: 'Sterling Silver',
      icon: Gem,
      color: '#292820',
      bg: 'bg-[#292820]/10',
      border: 'border-[#292820]/30',
      text: 'text-[#292820]',
    },
  };

  const totalRevenue = collectionPerformance.reduce(
    (acc, c) => acc + (c.totalRevenue || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {['food', 'tea', 'sarees', 'jewellery'].map((colId) => {
          const colData = collectionPerformance.find((c) => c.collectionId === colId) || {
            collectionId: colId,
            totalRevenue: 0,
            totalQuantitySold: 0,
            itemsCount: 0,
          };
          const meta = collectionMeta[colId] || {
            name: colId,
            icon: Sparkles,
            color: '#762F39',
            bg: 'bg-stone-100',
            border: 'border-stone-200',
            text: 'text-stone-800',
          };
          const Icon = meta.icon;
          const sharePercent =
            totalRevenue > 0 ? Math.round((colData.totalRevenue / totalRevenue) * 100) : 0;

          return (
            <motion.div
              key={colId}
              whileHover={{ y: -2 }}
              className="bg-[#F8F6F0] p-4 rounded-xl border border-[#E5E0D5] hover:border-[#D5CEC2] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${meta.bg} ${meta.text}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E0D5] text-[#746F63] font-medium">
                    {sharePercent}% Share
                  </span>
                </div>

                <p className="text-xs font-serif font-bold text-[#292820] tracking-tight">
                  {meta.name}
                </p>

                <p className="font-sans font-semibold text-lg text-[#292820] mt-1 tabular-nums">
                  ₹{colData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Progress mini bar & stats */}
              <div className="mt-3 pt-2.5 border-t border-[#E5E0D5]/60">
                <div className="h-1.5 w-full bg-[#E5E0D5] rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, sharePercent)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#746F63] font-mono">
                  <span>Units: {colData.totalQuantitySold}</span>
                  <span>Items: {colData.itemsCount}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
