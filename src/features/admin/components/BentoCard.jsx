import React from 'react';
import { motion } from 'framer-motion';

export function BentoCard({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  headerClassName = '',
  noPadding = false,
  onClick,
}) {
  const isClickable = Boolean(onClick);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileHover={
        isClickable
          ? { y: -2, boxShadow: '0 10px 25px -5px rgba(41, 40, 32, 0.08), 0 8px 10px -6px rgba(41, 40, 32, 0.04)' }
          : { boxShadow: '0 4px 20px -2px rgba(41, 40, 32, 0.05)' }
      }
      whileTap={isClickable ? { scale: 0.995 } : undefined}
      onClick={onClick}
      className={`bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl overflow-hidden flex flex-col transition-colors duration-200 hover:border-[#D5CEC2] ${
        isClickable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div
          className={`px-5 py-4 border-b border-[#E5E0D5]/70 flex items-center justify-between gap-3 ${headerClassName}`}
        >
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-serif font-bold text-sm tracking-tight text-[#292820]">
                  {title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-[11px] text-[#746F63] font-sans mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={`flex-1 ${noPadding ? '' : 'p-5'}`}>{children}</div>
    </motion.div>
  );
}
