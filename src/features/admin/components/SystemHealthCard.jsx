import React from 'react';
import { Database, ShieldCheck, CreditCard, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SystemHealthCard({ health, onRefresh, refreshing }) {
  const db = health?.database;
  const gateway = health?.paymentGateway;
  const security = health?.security;

  const isDbConnected = db?.status === 'CONNECTED';
  const isGatewayLive = gateway?.isLive;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* PostgreSQL Status */}
        <div className="p-3.5 bg-[#F8F6F0] border border-[#E5E0D5] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDbConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1817]">PostgreSQL Database</p>
              <p className="text-[10px] text-[#7A7167] font-mono">
                {db?.engine || 'Neon Serverless Pooler'}
              </p>
              {isDbConnected && db?.latencyMs !== undefined && (
                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  Latency: {db.latencyMs}ms ping
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1.5 text-[11px] font-mono font-bold ${isDbConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>{isDbConnected ? 'Connected' : 'Unavailable'}</span>
            </div>
            {db?.checkedAt && (
              <span className="text-[9px] font-mono text-[#8C8377] mt-0.5">
                {new Date(db.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Payment Gateway Mode */}
        <div className="p-3.5 bg-[#F8F6F0] border border-[#E5E0D5] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1817]">Payment Provider</p>
              <p className="text-[10px] text-[#7A7167] font-mono">
                {gateway?.mode || 'Sandbox Test Mode'}
              </p>
              <p className="text-[10px] text-amber-800 font-mono mt-0.5">
                {gateway?.isConfigured ? 'Keys Configured' : 'No Keys Set'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-800">
              <span className={`w-2 h-2 rounded-full ${isGatewayLive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              <span>{isGatewayLive ? 'Live Mode' : 'Sandbox Mode'}</span>
            </div>
            <span className="text-[9px] font-mono text-[#8C8377] mt-0.5">
              {gateway?.provider?.toUpperCase() || 'TEST'}
            </span>
          </div>
        </div>

        {/* Cryptographic Security & RBAC */}
        <div className="p-3.5 bg-[#F8F6F0] border border-[#E5E0D5] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#722F37]/15 text-[#722F37]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1817]">Security & RBAC</p>
              <p className="text-[10px] text-[#7A7167] font-mono">
                PBKDF2-SHA512 + Session TTL
              </p>
              <p className="text-[10px] text-[#722F37] font-mono mt-0.5">
                {security?.activeStaffCount || 0} active staff identities
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#722F37]">
              <span className="w-2 h-2 rounded-full bg-[#722F37]" />
              <span>{security?.status || 'Active'}</span>
            </div>
            <span className="text-[9px] font-mono text-[#8C8377] mt-0.5">
              Timing-Safe HMAC
            </span>
          </div>
        </div>
      </div>

      {onRefresh && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={refreshing}
            onClick={onRefresh}
            className="text-[11px] font-mono text-[#7A7167] hover:text-[#1A1817] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Re-check Infrastructure Health</span>
          </button>
        </div>
      )}
    </div>
  );
}
