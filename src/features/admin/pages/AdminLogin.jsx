import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';
  const { login, isLoading, error } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const result = await login(email, password);
    if (result.success) {
      navigate(redirectTarget);
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377] z-10">
                  <Lock className="h-4 w-4" />
                </div>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="block w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none transition-colors"
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
        </div>

        <p className="mt-4 text-center text-[11px] text-[#8C8377] font-mono">
          Authorized Staff Only • Strict Cryptographic Access Control
        </p>
      </div>
    </div>
  );
}
