import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'admin@amoga.com',
      pass: 'Admin@Amoga2026!',
      badge: 'bg-[#722F37] text-white',
    },
    {
      role: 'Catalogue Manager',
      email: 'catalogue@amoga.com',
      pass: 'Catalogue@Amoga2026!',
      badge: 'bg-[#287A25]/15 text-[#1B5219]',
    },
    {
      role: 'Fulfilment Lead',
      email: 'orders@amoga.com',
      pass: 'Orders@Amoga2026!',
      badge: 'bg-[#8C6320]/15 text-[#5C4010]',
    },
    {
      role: 'Content Lead',
      email: 'content@amoga.com',
      pass: 'Content@Amoga2026!',
      badge: 'bg-[#5B3E6E]/15 text-[#3D284B]',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const result = await login(email, password);
    if (result.success) {
      navigate('/admin');
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-[#722F37] text-white font-serif font-bold text-2xl shadow-lg border border-[#C5A46D]/50 mb-4">
          A
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1A1817]">
          AMOGA ATELIER
        </h2>
        <p className="mt-1 text-xs tracking-widest uppercase font-mono text-[#8C6320]">
          Staff Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FBF9F5] py-8 px-6 shadow-sm border border-[#E5E0D5] rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amoga.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-sm text-xs font-semibold uppercase tracking-wider text-white bg-[#722F37] hover:bg-[#5E2229] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#722F37] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Atelier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Staff Logins */}
          <div className="mt-8 pt-6 border-t border-[#E5E0D5]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#8C8377] mb-3 text-center">
              Quick Staff Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="p-2 text-left bg-[#F5F2EB] hover:bg-[#EFEAE1] border border-[#E0D9CD] rounded text-xs transition-colors flex flex-col justify-between"
                >
                  <span className={`inline-block text-[9px] font-mono px-1 rounded w-fit mb-1 ${acc.badge}`}>
                    {acc.role}
                  </span>
                  <span className="text-[11px] font-mono text-[#332D28] truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#8C8377] font-mono">
          Strict Cryptographic Access Control • Neon PostgreSQL & Razorpay Test
        </p>
      </div>
    </div>
  );
}
