import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function SupportingPerformanceCard({
  averageOrderValue = 0,
  paymentSuccessRate = 100,
  grossSales = 0,
}) {
  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      {/* Metric 1: Average Order Value (AOV) */}
      <div className="p-4 bg-[#F8F6F0] border border-[#E5E0D5] rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F63] block">
            Average Order Value (AOV)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-sans font-semibold text-2xl text-[#292820] tabular-nums">
              ₹{averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-[#A89F93] mt-0.5">
            Calculated across confirmed checkout orders
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-[#3F5A35]/10 text-[#3F5A35] flex-shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 2: Authoritative Payment Completion Rate */}
      <div className="p-4 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl flex flex-col justify-between flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F63] block">
              Payment Conversion Efficiency
            </span>
            <p className="font-sans font-semibold text-xl text-[#292820] mt-1 tabular-nums">
              {paymentSuccessRate}% Successful
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#166534]/10 text-[#166534]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Progress Arc / Bar */}
        <div className="mt-3">
          <div className="h-2 w-full bg-[#F0ECE3] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, paymentSuccessRate)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-[#166534] rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-[#746F63]">
            <span>HMAC-SHA256 Verified</span>
            <span className="text-[#166534] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Optimal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
