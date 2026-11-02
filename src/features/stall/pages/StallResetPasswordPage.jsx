import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function StallResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setVerifying(false);
          setTokenValid(false);
          setTokenError('Staff reset token is missing from the link.');
        }
        return;
      }

      setVerifying(true);
      try {
        const res = await fetch(`/api/stall/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (isMounted) {
          if (res.ok && json.valid) {
            setTokenValid(true);
            setStaffInfo({ email: json.email, name: json.name, role: json.role });
          } else {
            setTokenValid(false);
            setTokenError(json.message || 'This staff reset link is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(err.message || 'Unable to verify stall reset link.');
        }
      } finally {
        if (isMounted) setVerifying(false);
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stall/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
      } else {
        setFormError(json.message || 'Failed to update staff password.');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred during password reset.');
    } finally {
      setSubmitting(false);
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
              Stall POS Security
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A2624] tracking-tight">
            Set Staff Password
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Configure your secure stall credentials for exhibition register operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 p-6 sm:p-8 backdrop-blur-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#762F39] via-[#8C6320] to-[#3F5A35]" />

          {verifying ? (
            <div className="py-12 text-center text-xs text-stone-500 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#762F39]" />
              <span>Verifying authorization token...</span>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4 py-4 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Reset Link Expired or Already Used
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  {tokenError || 'This staff password reset token is invalid or has expired. Contact your system administrator to generate a new reset link.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/stall/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
                >
                  <span>Return to Stall Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4 py-4 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Password Configured Successfully
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  Your new stall credentials are now active. All other register sessions have been rotated. You can now open the stall register.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/stall/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  <span>Sign In & Open Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {staffInfo && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                  Staff Account: <strong className="text-stone-900">{staffInfo.name || staffInfo.email}</strong>
                  <span className="block text-[11px] font-mono text-[#762F39] mt-0.5">
                    {staffInfo.role?.replace('_', ' ')}
                  </span>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="pl-10 py-2.5 text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:border-[#762F39] focus:ring-2 focus:ring-[#762F39]/20 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="pl-10 py-2.5 text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:border-[#762F39] focus:ring-2 focus:ring-[#762F39]/20 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#762F39]/20 hover:shadow-lg hover:shadow-[#762F39]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Secure Environment Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted Workspace</span>
            </div>
            <Link to="/stall/login" className="text-stone-500 hover:text-stone-800 transition-colors">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
