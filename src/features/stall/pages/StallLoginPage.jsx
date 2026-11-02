import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Store } from 'lucide-react';
import { useStallAuthStore } from '../store/useStallAuthStore';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function StallLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login, isAuthenticated, isLoading, error, clearError } = useStallAuthStore();

  // Validate return path: ONLY allow approved stall routes
  const rawRedirect = searchParams.get('redirect') || '/stall';
  const targetRedirect = rawRedirect.startsWith('/stall') && !rawRedirect.startsWith('/admin')
    ? rawRedirect
    : '/stall';

  useEffect(() => {
    // If already authenticated with a valid stall session, go straight to stall POS
    if (isAuthenticated) {
      navigate(targetRedirect, { replace: true });
    }
  }, [isAuthenticated, navigate, targetRedirect]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate(targetRedirect, { replace: true });
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block transition-transform hover:scale-105" title="Amoga Storefront">
            <img
              src={amogaLogo}
              alt="Amoga Atelier"
              className="h-12 w-auto mx-auto object-contain mb-3"
            />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#762F39]/10 text-[#762F39] text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-[#762F39]/20">
              <Store className="w-3.5 h-3.5" />
              Stall POS Terminal
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A2624] tracking-tight">
            Staff Authentication
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Sign in with your assigned Stall Manager or Cashier credentials
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 p-6 sm:p-8 backdrop-blur-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#762F39] via-[#8C6320] to-[#3F5A35]" />

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Staff Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@amoga.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:border-[#762F39] focus:ring-2 focus:ring-[#762F39]/20 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:border-[#762F39] focus:ring-2 focus:ring-[#762F39]/20 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer rounded-md focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  tabIndex={0}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#762F39]/20 hover:shadow-lg hover:shadow-[#762F39]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Open Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Environment Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted POS Workspace</span>
            </div>
            <Link to="/" className="text-stone-500 hover:text-stone-800 transition-colors">
              Return to Storefront
            </Link>
          </div>
        </div>

        {/* Security Policy Reminder */}
        <p className="text-center text-[11px] text-stone-600 mt-6 font-mono leading-relaxed">
          Access is monitored. Unauthorized login attempts are logged with client telemetry.
        </p>
      </div>
    </div>
  );
}
