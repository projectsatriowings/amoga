import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export function OrderLifecycleCard({ ordersByStatus = {} }) {
  const statusMeta = [
    { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-[#3F5A35]', barColor: '#3F5A35', text: 'text-[#3F5A35]', bg: 'bg-[#3F5A35]/10', border: 'border-[#3F5A35]/30' },
    { key: 'PROCESSING', label: 'Processing', color: 'bg-[#B08A4D]', barColor: '#B08A4D', text: 'text-[#8C6320]', bg: 'bg-[#B08A4D]/10', border: 'border-[#B08A4D]/30' },
    { key: 'DISPATCHED', label: 'Dispatched', color: 'bg-[#762F39]', barColor: '#762F39', text: 'text-[#762F39]', bg: 'bg-[#762F39]/10', border: 'border-[#762F39]/30' },
    { key: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-600', barColor: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-500', barColor: '#E11D48', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    { key: 'PENDING_PAYMENT', label: 'Pending Payment', color: 'bg-stone-400', barColor: '#78716C', text: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200' },
  ];

  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="space-y-4">
      {/* High-level status bar */}
      <div className="h-2.5 w-full bg-[#F8F6F0] rounded-full overflow-hidden flex border border-[#E5E0D5]">
        {statusMeta.map((s) => {
          const count = ordersByStatus[s.key] || 0;
          const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
          if (percent === 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${percent}%`, backgroundColor: s.barColor }}
              title={`${s.label}: ${count} (${Math.round(percent)}%)`}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all"
            />
          );
        })}
      </div>

      {/* Status Item List */}
      <div className="divide-y divide-[#F8F6F0]">
        {statusMeta.map((s) => {
          const count = ordersByStatus[s.key] || 0;
          const percent = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;

          return (
            <Link
              key={s.key}
              to={`/admin/orders?status=${s.key}`}
              className="flex items-center justify-between py-2 px-1 text-xs hover:bg-[#F8F6F0] rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.barColor }} />
                <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${s.bg} ${s.text} ${s.border}`}>
                  {s.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#746F63]">
                  {percent}%
                </span>
                <span className="font-sans font-semibold text-sm text-[#292820] w-6 text-right tabular-nums">
                  {count}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#898477] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
