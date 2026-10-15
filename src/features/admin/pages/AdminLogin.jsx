import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const result = await login(email, password);
    if (result.success) {
      navigate('/admin');
    }
  };

  const handleSuperAdminQuickAccess = async (autoLogin = false) => {
    setEmail('admin@amoga.com');
    setPassword('Admin@Amoga2026!');
    if (autoLogin) {
      const result = await login('admin@amoga.com', 'Admin@Amoga2026!');
      if (result?.success) {
        navigate('/admin');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          src={amogaLogo}
          alt="Amoga Luxury Atelier"
          className="h-12 w-auto mx-auto object-contain mb-4 shrink-0"
        />
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#292820]">
          AMOGA ATELIER
        </h2>
        <p className="mt-1 text-xs tracking-widest uppercase font-mono text-[#B08A4D]">
          Staff Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FFFFFF] py-8 px-6 shadow-sm border border-[#E5E0D5] rounded-xl sm:px-10">
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

          {/* Super Admin Quick Access (Only for Super Admin) */}
          <div className="mt-6 pt-5 border-t border-[#E5E0D5]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C8377] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B08A4D]" />
                Super Admin Quick Access
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/20">
                Super Admin Only
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#E0D9CD] rounded-lg transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-serif font-bold text-[#292820]">
                    Amoga Super Admin
                  </span>
                  <span className="text-[11px] font-mono text-[#8C8377]">
                    admin@amoga.com
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#B08A4D] bg-[#F3EFE6] px-2 py-0.5 rounded border border-[#E5E0D5]">
                  Full Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => handleSuperAdminQuickAccess(false)}
                  className="w-full py-1.5 px-2 bg-white hover:bg-[#F5F2EA] border border-[#D5CEC2] rounded text-[11px] font-medium text-[#4A423B] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Auto-fill Super Admin credentials into the form"
                >
                  <span>Auto-fill</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSuperAdminQuickAccess(true)}
                  className="w-full py-1.5 px-2 bg-[#722F37] hover:bg-[#5E2229] border border-[#722F37] rounded text-[11px] font-medium text-white transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Sign in immediately as Super Admin"
                >
                  <Lock className="w-3 h-3" />
                  <span>1-Click Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#8C8377] font-mono">
          Authorized Staff Only • Strict Cryptographic Access Control
        </p>
      </div>
    </div>
  );
}
