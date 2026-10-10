import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, DollarSign, Layers } from 'lucide-react';

export function SalesAnalyticsChart({ salesTrends = [] }) {
  const [timeRange, setTimeRange] = useState('14d'); // '7d' | '14d'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filter trends based on selected range
  const visibleTrends = useMemo(() => {
    if (!salesTrends || salesTrends.length === 0) return [];
    if (timeRange === '7d') {
      return salesTrends.slice(-7);
    }
    if (timeRange === '14d') {
      return salesTrends.slice(-14);
    }
    return salesTrends.slice(-30);
  }, [salesTrends, timeRange]);

  const maxRevenue = useMemo(() => {
    if (visibleTrends.length === 0) return 1;
    const max = Math.max(...visibleTrends.map((t) => t.revenue));
    return max > 0 ? max : 1000;
  }, [visibleTrends]);

  const totalPeriodRevenue = useMemo(() => {
    return visibleTrends.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  }, [visibleTrends]);

  const totalPeriodOrders = useMemo(() => {
    return visibleTrends.reduce((acc, curr) => acc + (curr.orders || 0), 0);
  }, [visibleTrends]);

  const averageDailyRevenue = useMemo(() => {
    if (visibleTrends.length === 0) return 0;
    return totalPeriodRevenue / visibleTrends.length;
  }, [visibleTrends, totalPeriodRevenue]);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Controls & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-2xl tracking-tight text-[#292820] tabular-nums">
              ₹{totalPeriodRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#3F5A35]/10 text-[#3F5A35] font-medium border border-[#3F5A35]/20">
              {totalPeriodOrders} Orders Placed
            </span>
          </div>
          <p className="text-[11px] text-[#746F63] mt-0.5">
            Average ₹{averageDailyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / day
          </p>
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1 bg-[#F8F6F0] p-1 rounded-lg border border-[#E5E0D5]">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
              timeRange === '7d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 7D
          </button>
          <button
            onClick={() => setTimeRange('14d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
              timeRange === '14d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 14D
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
              timeRange === '30d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 30D
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative h-48 sm:h-56 w-full pt-4 pb-2 flex flex-col justify-end">
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-[#E5E0D5] w-full" />
          <div className="border-b border-dashed border-[#E5E0D5] w-full" />
          <div className="border-b border-dashed border-[#E5E0D5] w-full" />
          <div className="border-b border-[#E5E0D5] w-full" />
        </div>

        {/* Dynamic Interactive Bars */}
        <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-2 h-full">
          {visibleTrends.map((trend, index) => {
            const heightPercent = Math.max(6, Math.round((trend.revenue / maxRevenue) * 100));
            const isHovered = hoveredIndex === index;
            const dayParts = trend.date ? trend.date.split('-') : [];
            const dayLabel = dayParts.length >= 3 ? `${dayParts[2]}/${dayParts[1]}` : trend.date;

            return (
              <div
                key={trend.date || index}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip Popover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-14 bg-[#201916] text-white px-2.5 py-1.5 rounded-lg shadow-xl text-center pointer-events-none z-30 whitespace-nowrap border border-[#B08A4D]/30"
                    >
                      <p className="font-sans font-semibold text-xs text-[#F8F6F0] tabular-nums">
                        ₹{trend.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#A89F93] font-mono">
                        <span>{trend.orders} {trend.orders === 1 ? 'order' : 'orders'}</span>
                        <span>•</span>
                        <span>{trend.date}</span>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#201916] rotate-45 border-r border-b border-[#B08A4D]/30" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bar Track & Fill */}
                <div className="w-full h-full flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{
                      type: 'spring',
                      damping: 20,
                      stiffness: 120,
                      delay: index * 0.02,
                    }}
                    className={`w-full max-w-[28px] rounded-t-md transition-colors duration-200 ${
                      isHovered
                        ? 'bg-[#762F39] shadow-md shadow-[#762F39]/20'
                        : trend.revenue > 0
                        ? 'bg-[#762F39]/70 hover:bg-[#762F39]'
                        : 'bg-[#E5E0D5]/60 hover:bg-[#E5E0D5]'
                    }`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`mt-2 text-[10px] font-mono transition-colors ${
                    isHovered ? 'text-[#292820] font-bold' : 'text-[#746F63]'
                  }`}
                >
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
