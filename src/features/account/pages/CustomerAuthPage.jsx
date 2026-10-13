import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCustomerStore } from '../store/useCustomerStore';
import { Container } from '../../../components/ui/Container';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export function CustomerAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { isAuthenticated, login, register, isLoading, error } = useCustomerStore();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [formError, setFormError] = useState(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const res = await login({ email: loginEmail, password: loginPassword });
    if (res.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setFormError(res.error || 'Failed to sign in. Please verify your email and password.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (regPassword.length < 6) {
      setFormError('Password must contain at least 6 characters.');
      return;
    }
    const res = await register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    });
    if (res.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setFormError(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-24 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <Container className="max-w-md mx-auto">
        {/* Brand Crest & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/20 mb-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-[#C5A46D]" />
          </div>
          <span className="block text-[11px] font-mono uppercase tracking-widest text-[#8C6320] mb-1">
            Amoga Client Concierge
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F0811]">
            {mode === 'login' ? 'Welcome Back' : 'Join Amoga Privilege'}
          </h1>
          <p className="text-xs text-[#7A7167] mt-1.5 max-w-sm mx-auto">
            {mode === 'login'
              ? 'Access your bespoke order history, track active shipments, and manage saved residences.'
              : 'Create an artisanal client profile to save delivery addresses and track handloom creations.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#EDE7DD] p-1 mb-6 border border-[#E0D7C9]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-[#722F37] shadow-sm font-bold'
                : 'text-[#6B635A] hover:text-[#2C0E1A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-[#722F37] shadow-sm font-bold'
                : 'text-[#6B635A] hover:text-[#2C0E1A]'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Container Card */}
        <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 sm:p-8 shadow-sm">
          {(formError || error) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <span className="font-bold shrink-0">Alert:</span>
              <span>{formError || error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="client@luxury.amoga.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sripadhma Priya"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="client@luxury.amoga.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Amoga Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Security Trust Pill */}
          <div className="mt-6 pt-5 border-t border-[#EAE3D5] flex items-center justify-center gap-2 text-[11px] text-[#7A7167]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Encrypted 256-bit Session &bull; Private Client Data</span>
          </div>
        </div>

        {/* Guest Order Tracking Quick Link */}
        <div className="mt-6 text-center text-xs text-[#7A7167]">
          <span>Purchased as a guest? </span>
          <Link
            to="/track"
            className="text-[#722F37] font-semibold underline underline-offset-4 hover:text-[#5E2229]"
          >
            Track your order with Order ID
          </Link>
        </div>
      </Container>
    </div>
  );
}
