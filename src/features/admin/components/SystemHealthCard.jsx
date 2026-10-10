import React from 'react';
import { Database, ShieldCheck, CreditCard, Lock, Radio } from 'lucide-react';

export function SystemHealthCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* PostgreSQL Status */}
      <div className="p-3 bg-[#F8F6F0] border border-[#E5E0D5] rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#3F5A35]/15 text-[#3F5A35]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-[#292820]">PostgreSQL Cloud DB</p>
            <p className="text-[10px] text-[#746F63] font-mono">Neon Serverless Pooler • AWS us-east-2</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3F5A35] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#3F5A35] animate-pulse" />
          <span>Connected</span>
        </div>
      </div>

      {/* Razorpay Test Mode */}
      <div className="p-3 bg-[#F8F6F0] border border-[#E5E0D5] rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#B08A4D]/15 text-[#8C6320]">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-[#292820]">Payment Gateway</p>
            <p className="text-[10px] text-[#746F63] font-mono">Razorpay Test Simulator Active</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8C6320] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#B08A4D]" />
          <span>Sandbox Mode</span>
        </div>
      </div>

      {/* Cryptographic Security */}
      <div className="p-3 bg-[#F8F6F0] border border-[#E5E0D5] rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#762F39]/15 text-[#762F39]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-[#292820]">Security & RBAC</p>
            <p className="text-[10px] text-[#746F63] font-mono">Timing-Safe HMAC-SHA256 Signed</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#762F39] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#762F39]" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}
