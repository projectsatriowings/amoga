import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Layers, ShieldCheck, Clock, Users } from 'lucide-react';

export function SecondaryKpiRow({ metrics = {} }) {
  const {
    totalOrders = 0,
    totalUnitsSold = 0,
    paymentSuccessRate = 100,
    pendingPayments = 0,
    uniqueCustomersCount = 0,
  } = metrics;

  const items = [
    {
      id: 'total-orders',
      label: 'Orders in Window',
      value: totalOrders,
      suffix: '',
      subtext: 'Transactions within reporting window',
      icon: ShoppingBag,
      color: '#762F39',
      bg: 'bg-[#762F39]/10',
    },
    {
      id: 'units-sold',
      label: 'Units Sold',
      value: totalUnitsSold,
      suffix: ' units',
      subtext: 'Across eligible completed orders',
      icon: Layers,
      color: '#3F5A35',
      bg: 'bg-[#3F5A35]/10',
    },
    {
      id: 'payment-success',
      label: 'Payment Success Rate',
      value: paymentSuccessRate,
      suffix: '%',
      subtext: 'Verified capture efficiency',
      icon: ShieldCheck,
      color: '#166534',
      bg: 'bg-[#166534]/10',
    },
    {
      id: 'pending-payments',
      label: 'Pending Inquiries',
      value: pendingPayments,
      suffix: ' awaiting',
      subtext: 'Uncompleted checkout sessions',
      icon: Clock,
      color: '#B08A4D',
      bg: 'bg-[#B08A4D]/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            whileHover={{ y: -2 }}
            className="p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#746F63] block truncate">
                {item.label}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-sans font-semibold text-lg sm:text-xl text-[#292820] tabular-nums">
                  {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
                </span>
                {item.suffix && (
                  <span className="text-xs font-mono text-[#746F63]">
                    {item.suffix}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#A89F93] mt-0.5 truncate hidden sm:block">
                {item.subtext}
              </p>
            </div>
            <div
              className={`p-2.5 rounded-lg flex-shrink-0 ${item.bg}`}
              style={{ color: item.color }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
