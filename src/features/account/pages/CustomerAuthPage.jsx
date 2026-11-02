import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCustomerStore } from '../store/useCustomerStore';
import { Container } from '../../../components/ui/Container';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { forgotPasswordCustomerApi } from '../../../services/customerApi';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function CustomerAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { isAuthenticated, login, register, isLoading, error } = useCustomerStore();

  const initialMode = searchParams.get('mode') === 'register' 
    ? 'register' 
    : searchParams.get('mode') === 'forgot'
    ? 'forgot'
    : 'login';

  const [mode, setMode] = useState(initialMode);
  const [formError, setFormError] = useState(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);
  const [forgotError, setForgotError] = useState(null);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPasswordCustomerApi(forgotEmail.trim());
      setForgotMessage(
        res.message || 'If an eligible account is registered with this email, password reset instructions will be sent shortly.'
      );
    } catch (err) {
      setForgotError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-3 sm:pt-4 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <Container className="max-w-md mx-auto">
        {/* Brand Crest & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Link to="/" title="Amoga Storefront">
              <img
                src={amogaLogo}
                alt="Amoga"
                className="h-10 sm:h-11 w-auto object-contain hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>
          <span className="block text-[11px] font-mono uppercase tracking-widest text-[#8C6320] mb-1">
            Amoga Customer Account
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F0811]">
            {mode === 'login'
              ? 'Welcome Back'
              : mode === 'register'
              ? 'Create Your Account'
              : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-[#7A7167] mt-1.5 max-w-sm mx-auto">
            {mode === 'login'
              ? 'Access your order history, track your orders, and manage saved delivery addresses.'
              : mode === 'register'
              ? 'Create an account to save delivery addresses and track your orders easily.'
              : 'Enter your registered email address and we will send you secure instructions to reset your password.'}
          </p>
        </div>

        {/* Tab Switcher (Only visible for Login / Register) */}
        {mode !== 'forgot' ? (
          <div className="flex rounded-xl bg-[#EDE7DD] p-1 mb-6 border border-[#E0D7C9]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#722F37] shadow-sm font-bold'
                  : 'text-[#6B635A] hover:text-[#2C0E1A]'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setForgotError(null);
                setForgotMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#722F37] hover:text-[#5E2229] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 sm:p-8 shadow-sm">
          {(formError || error) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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
                    placeholder="yourname@example.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="pl-9 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setFormError(null);
                    setForgotError(null);
                    setForgotMessage(null);
                    if (loginEmail) setForgotEmail(loginEmail);
                  }}
                  className="text-xs font-semibold text-[#722F37] hover:text-[#5E2229] hover:underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : mode === 'register' ? (
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
                    autoComplete="name"
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
                    placeholder="yourname@example.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="pl-9 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <div className="space-y-4">
              {forgotMessage ? (
                <div className="space-y-4 py-2 text-center animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1F0811]">
                      Instructions Requested
                    </h3>
                    <p className="text-xs text-[#6B635A] mt-2 leading-relaxed">
                      {forgotMessage}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setForgotMessage(null);
                      }}
                      className="w-full py-2.5 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {forgotError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        autoComplete="email"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-[#7A7167] mt-1.5 leading-relaxed">
                      We will check our system and dispatch single-use, 30-minute password reset instructions.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-[#7A7167] hover:text-[#2C0E1A] underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Cancel and return to sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Security Trust Pill */}
          <div className="mt-6 pt-5 border-t border-[#EAE3D5] flex items-center justify-center gap-2 text-[11px] text-[#7A7167]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Secure &bull; Cryptographically Hashed &bull; Protected</span>
          </div>
        </div>

        {/* Guest Order Tracking Quick Link */}
        <div className="mt-6 text-center text-xs text-[#7A7167]">
          <span>Purchased as a guest? </span>
          <Link
            to="/track"
            className="text-[#722F37] font-semibold underline underline-offset-4 hover:text-[#5E2229]"
          >
            Track your order with Order Number
          </Link>
        </div>
      </Container>
    </div>
  );
}
