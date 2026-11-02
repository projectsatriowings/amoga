import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container } from '../../../components/ui/Container';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import {
  verifyCustomerResetTokenApi,
  resetPasswordCustomerApi,
} from '../../../services/customerApi';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
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
          setTokenError('Password reset token is missing from URL.');
        }
        return;
      }

      setVerifying(true);
      try {
        const res = await verifyCustomerResetTokenApi(token);
        if (isMounted) {
          if (res.valid) {
            setTokenValid(true);
            setTargetEmail(res.email || '');
          } else {
            setTokenValid(false);
            setTokenError(res.message || 'This reset link is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(err.message || 'Unable to verify reset token. It may have expired or already been used.');
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
      setFormError('New password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordCustomerApi({
        token,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setFormError(res.message || 'Failed to reset password. Please try requesting a new link.');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while resetting your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-4 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <Container className="max-w-md mx-auto">
        {/* Brand Crest */}
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
            Amoga Customer Security
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F0811]">
            Create New Password
          </h1>
          <p className="text-xs text-[#7A7167] mt-1.5 max-w-sm mx-auto">
            Set a new secure password for your Amoga customer account.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 sm:p-8 shadow-sm">
          {verifying ? (
            <div className="py-12 text-center text-xs text-[#7A7167] flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#722F37]" />
              <span>Verifying security token...</span>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4 py-4 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#1F0811]">
                  Reset Link Expired or Invalid
                </h3>
                <p className="text-xs text-[#7A7167] mt-1.5 leading-relaxed">
                  {tokenError || 'For your security, password reset links expire after 30 minutes and can only be used once.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/account/login?mode=forgot"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
                >
                  <span>Request New Reset Link</span>
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
                <h3 className="font-serif text-lg font-bold text-[#1F0811]">
                  Password Successfully Reset
                </h3>
                <p className="text-xs text-[#7A7167] mt-1.5 leading-relaxed">
                  Your password has been updated. All previous active sessions have been securely revoked. You can now sign in with your new password.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/account/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  <span>Sign In To Your Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {targetEmail && (
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#524B43]">
                  Resetting password for: <strong className="text-[#1F0811]">{targetEmail}</strong>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="pl-9 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C6320] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <PasswordInput
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="pl-9 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#2C0E1A] placeholder-[#8A8177] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Security Trust Pill */}
          <div className="mt-6 pt-5 border-t border-[#EAE3D5] flex items-center justify-center gap-2 text-[11px] text-[#7A7167]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cryptographically Secure Single-Use Reset</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
