import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function AnimatedNumber({ value, isCurrency = false }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 800; // ms
    const startValue = 0;
    const targetValue = typeof value === 'number' ? value : parseFloat(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  if (isCurrency) {
    return (
      <span>
        ₹{displayValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  }

  return <span>{Math.round(displayValue).toLocaleString('en-IN')}</span>;
}

export function BentoKpiCard({
  title,
  value,
  isCurrency = false,
  supportingLabel,
  icon: Icon,
  accentColor = '#762F39',
  bgAccent = '#FBF8F5',
  trend,
  trendLabel,
  actionText,
  actionLink,
  onClick,
  statusBadge,
  children,
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(41, 40, 32, 0.08)' }}
      className="bg-[#FFFFFF] border border-[#E5E0D5] hover:border-[#D5CEC2] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors relative overflow-hidden group"
    >
      {/* Subtle top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#746F63]">
            {title}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: bgAccent, color: accentColor }}
          >
            {Icon && <Icon className="w-4 h-4" />}
          </div>
        </div>

        {/* Big Value */}
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="font-sans font-semibold text-2xl lg:text-3xl tracking-tight text-[#292820] tabular-nums">
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </h2>
          {statusBadge && <div>{statusBadge}</div>}
        </div>

        {/* Custom children e.g. mini breakdown */}
        {children}
      </div>

      {/* Footer / Trend / Action */}
      <div className="mt-4 pt-3 border-t border-[#F8F6F0] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                trend >= 0
                  ? 'bg-[#3F5A35]/10 text-[#3F5A35]'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          <span className="text-[11px] text-[#746F63] truncate">
            {supportingLabel || trendLabel}
          </span>
        </div>

        {actionText && actionLink && (
          <Link
            to={actionLink}
            className="text-[11px] font-medium text-[#762F39] hover:text-[#8F414B] inline-flex items-center gap-1 hover:underline"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
