import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDisplayDate(dateStr, totalCount) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parts[2];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || parts[1];

  // If showing 30 days, compact to day of month on small displays
  if (totalCount > 14) {
    return `${day}`;
  }
  return `${day} ${monthName}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parts[2];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || parts[1];
  const year = parts[0];
  return `${day} ${monthName} ${year}`;
}

export function SalesAnalyticsChart({
  salesTrends = [],
  activeRange = '7d',
  onRangeChange,
}) {
  const [internalRange, setInternalRange] = useState('7d');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const currentRange = onRangeChange ? activeRange : internalRange;

  const handleSelectRange = (range) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setInternalRange(range);
    }
  };

  // If onRangeChange is provided, salesTrends is already scoped by backend
  // If not, slice locally as fallback
  const visibleTrends = useMemo(() => {
    if (!salesTrends || salesTrends.length === 0) return [];
    if (onRangeChange) return salesTrends;

    if (currentRange === '7d') {
      return salesTrends.slice(-7);
    }
    if (currentRange === '14d') {
      return salesTrends.slice(-14);
    }
    return salesTrends.slice(-30);
  }, [salesTrends, currentRange, onRangeChange]);

  const maxRevenue = useMemo(() => {
    if (visibleTrends.length === 0) return 1;
    const max = Math.max(...visibleTrends.map((t) => Number(t.revenue) || 0));
    return max > 0 ? max : 1000;
  }, [visibleTrends]);

  const totalPeriodRevenue = useMemo(() => {
    return visibleTrends.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  }, [visibleTrends]);

  const totalPeriodOrders = useMemo(() => {
    return visibleTrends.reduce((acc, curr) => acc + (Number(curr.orders) || 0), 0);
  }, [visibleTrends]);

  const averageDailyRevenue = useMemo(() => {
    if (visibleTrends.length === 0) return 0;
    return totalPeriodRevenue / visibleTrends.length;
  }, [visibleTrends, totalPeriodRevenue]);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Controls & Financial Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-2xl tracking-tight text-[#292820] tabular-nums">
              ₹{totalPeriodRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#3F5A35]/10 text-[#3F5A35] font-medium border border-[#3F5A35]/20">
              {totalPeriodOrders} Orders Placed
            </span>
          </div>
          <p className="text-[11px] text-[#746F63] mt-0.5">
            Average ₹{averageDailyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / day in reporting period
          </p>
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1 bg-[#F8F6F0] p-1 rounded-lg border border-[#E5E0D5]">
          <button
            type="button"
            onClick={() => handleSelectRange('7d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
              currentRange === '7d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 7D
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('14d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
              currentRange === '14d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 14D
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('30d')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
              currentRange === '30d'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            Last 30D
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('all')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
              currentRange === 'all'
                ? 'bg-[#762F39] text-white shadow-xs'
                : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
            }`}
          >
            All Time
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
            const hasRevenue = trend.revenue > 0;
            const heightPercent = hasRevenue
              ? Math.max(8, Math.round((trend.revenue / maxRevenue) * 100))
              : 0;
            const isHovered = hoveredIndex === index;
            const dayLabel = formatDisplayDate(trend.date, visibleTrends.length);
            const fullDateLabel = formatFullDate(trend.date);

            // In 30-day view, skip odd labels on very narrow screens if dense
            const shouldHideLabel = visibleTrends.length > 20 && index % 2 !== 0;

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
                      className="absolute -top-16 bg-[#201916] text-white px-2.5 py-1.5 rounded-lg shadow-xl text-center pointer-events-none z-30 whitespace-nowrap border border-[#B08A4D]/30"
                    >
                      <p className="font-sans font-semibold text-xs text-[#F8F6F0] tabular-nums">
                        ₹{Number(trend.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#A89F93] font-mono mt-0.5">
                        <span>{trend.orders} {trend.orders === 1 ? 'order' : 'orders'}</span>
                        <span>•</span>
                        <span>{fullDateLabel}</span>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#201916] rotate-45 border-r border-b border-[#B08A4D]/30" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bar Track & Fill */}
                <div className="flex-1 w-full min-h-0 flex items-end justify-center relative">
                  {hasRevenue ? (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 110,
                        delay: Math.min(index * 0.015, 0.25),
                      }}
                      className={`w-full max-w-[28px] rounded-t-md transition-colors duration-200 ${
                        isHovered
                          ? 'bg-gradient-to-t from-[#5E242C] to-[#762F39] shadow-md shadow-[#762F39]/25'
                          : 'bg-gradient-to-t from-[#762F39] to-[#8C3A46] hover:from-[#5E242C] hover:to-[#762F39]'
                      }`}
                    />
                  ) : (
                    /* Clean baseline indicator for zero activity days */
                    <div
                      className={`w-full max-w-[28px] h-1 rounded-full transition-colors duration-150 ${
                        isHovered ? 'bg-[#B08A4D]' : 'bg-[#E5E0D5]'
                      }`}
                    />
                  )}
                </div>

                {/* Day label */}
                <span
                  className={`mt-2 text-[10px] font-mono transition-colors text-center ${
                    shouldHideLabel ? 'hidden sm:block' : ''
                  } ${
                    isHovered
                      ? 'text-[#292820] font-bold'
                      : hasRevenue
                      ? 'text-[#292820] font-medium'
                      : 'text-[#A89F93]'
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
