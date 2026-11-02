import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Shield,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';
  const { login, isLoading, error: storeError } = useAdminStore();

  // Mode: 'login' | 'forgot-password'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

    // Password Reset state
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [devOtp, setDevOtp] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState(null);
    const [resetSuccess, setResetSuccess] = useState(null);

    // Demo Fill Handler (Simulates NH Salem convenience pre-fill pattern)
    const handleDemoFill = () => {
      setEmail('admin@amoga.com');
      setPassword('Admin@Amoga2026!');
    };

    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      if (!email || !password) return;

      const result = await login(email, password);
      if (result.success) {
        navigate(redirectTarget);
      }
    };

    const handleRequestOtp = async (e) => {
      e.preventDefault();
      if (!resetEmail) {
        setResetError('Please enter your staff email address');
        return;
      }

      setResetLoading(true);
      setResetError(null);
      setResetSuccess(null);
      setDevOtp(null);

      try {
        const res = await fetch('/api/admin/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to dispatch reset code');
        }

        setOtpSent(true);
        setResetSuccess(data.message || 'Verification code dispatched to your registered email.');
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
      } catch (err) {
        setResetError(err.message);
      } finally {
        setResetLoading(false);
      }
    };

    const handleResetSubmit = async (e) => {
      e.preventDefault();
      if (!otp || !newPassword || !confirmPassword) {
        setResetError('Please fill in all required fields');
        return;
      }

      if (newPassword.length < 8) {
        setResetError('New password must be at least 8 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setResetError('New passwords do not match');
        return;
      }

      setResetLoading(true);
      setResetError(null);

      try {
        const res = await fetch('/api/admin/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resetEmail,
            otp,
            newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to update password');
        }

        // Success: Return to login with prefilled email
        setEmail(resetEmail);
        setPassword('');
        setMode('login');
        setResetSuccess('Master Password reset successfully! Please sign in with your new credentials.');
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setDevOtp(null);
      } catch (err) {
        setResetError(err.message);
      } finally {
        setResetLoading(false);
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
              {/* Quick Demo Fill Helper Pill */ }
          {mode === 'login' && (
              <div className="mb-6 flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D5]">
                <div className="flex items-center gap-2 text-xs text-[#6B6155]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B08A4D]" />
                  <span className="font-medium">Dev Convenience:</span>
                </div>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-xs font-semibold px-2.5 py-1 rounded bg-[#722F37]/10 text-[#722F37] hover:bg-[#722F37]/20 transition-colors cursor-pointer"
                >
                  Fill Super Admin
                </button>
              </div>
            )}

            {/* Alert Banners */}
            {storeError && mode === 'login' && (
              <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{storeError}</span>
              </div>
            )}

                  {resetError && mode === 'forgot-password' && (
                    <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="mb-6 p-3 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{resetSuccess}</span>
                    </div>
                  )}

                  {/* Dev Fallback OTP Notice Banner */}
                  {devOtp && mode === 'forgot-password' && (
                    <div className="mb-6 p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Dev Mode OTP Dispatched:</span>
                        <span className="font-mono text-sm tracking-widest bg-amber-200/70 px-2 py-0.5 rounded text-amber-950">
                          {devOtp}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        SMTP not active in .env. Click below to auto-fill code:
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtp)}
                        className="w-full text-center py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-medium rounded text-[11px] transition-colors"
                      >
                        Auto-Paste OTP ({devOtp})
                      </button>
                    </div>
                  )}

                        {/* 1. SIGN IN MODE */}
                        {mode === 'login' ? (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setResetEmail(email || 'admin@amoga.com');
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-xs text-[#B08A4D] hover:text-[#8C6D38] font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                        ) : (
                          /* 2. FORGOT PASSWORD / OTP RESET MODE */
                          <div className="space-y-5">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D5]">
                              <button
                                type="button"
                                onClick={() => {
                                  setMode('login');
                                  setResetError(null);
                                  setResetSuccess(null);
                                }}
                                className="p-1 rounded text-[#8C8377] hover:text-[#1A1817] hover:bg-[#FAF8F5] transition-colors"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </button>
                              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#292820]">
                                <KeyRound className="w-4 h-4 text-[#B08A4D]" />
                                <span>Reset Security Key via OTP</span>
                              </div>
                            </div>

                            {!otpSent ? (
                              /* Step 1: Request OTP */
                              <form className="space-y-4" onSubmit={handleRequestOtp}>
                                <div>
                                  <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                                    Registered Staff Email
                                  </label>
                                  <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377]">
                                      <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                      type="email"
                                      required
                                      value={resetEmail}
                                      onChange={(e) => setResetEmail(e.target.value)}
                                      placeholder="admin@amoga.com"
                                      className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none transition-colors"
                                    />
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#8C8377]">
                                    A 6-digit verification code will be dispatched to this email address.
                                  </p>
                                </div>

                                <button
                                  type="submit"
                                  disabled={resetLoading}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-sm text-xs font-semibold uppercase tracking-wider text-white bg-[#722F37] hover:bg-[#5E2229] disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  {resetLoading ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Dispatching Code...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Send Verification OTP</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </form>
                            ) : (
                /* Step 2: Verify OTP and Set New Password */
                <form className="space-y-4" onSubmit={handleResetSubmit}>
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="block w-full text-center tracking-[6px] font-mono font-bold text-lg py-2 bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                      New Master Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377]">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8377]">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D5CEC2] rounded text-[#1A1817] focus:ring-1 focus:ring-[#722F37] focus:border-[#722F37] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 py-2 px-3 border border-[#D5CEC2] rounded text-xs font-medium text-[#6B6155] hover:bg-[#FAF8F5] transition-colors"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-transparent rounded text-xs font-semibold uppercase tracking-wider text-white bg-[#722F37] hover:bg-[#5E2229] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save & Sign In</span>
                      )}
                    </button>
                  </div>
                </form>
                            )}
                    </div>
          )}
                  </div>

                  <p className="mt-4 text-center text-[11px] text-[#8C8377] font-mono">
                    Authorized Staff Only • Strict Cryptographic Access Control
                  </p>
                </div>
              </div>
              );
}
