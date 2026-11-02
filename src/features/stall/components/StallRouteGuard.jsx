import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowLeft, RefreshCw, Lock, Store } from 'lucide-react';
import { useStallAuthStore } from '../store/useStallAuthStore';
import amogaLogo from '../../../assets/images/amoga-logo.png';

const ALLOWED_STALL_ROLES = ['SUPER_ADMIN', 'STALL_MANAGER', 'STALL_CASHIER'];

export function StallRouteGuard({ children }) {
  const { token, user, isAuthenticated, logout, checkSession } = useStallAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [serverVerified, setServerVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      const storedToken = localStorage.getItem('amoga_stall_token') || localStorage.getItem('amoga_admin_token') || token;
      if (!storedToken) {
        if (isMounted) {
          setIsVerifying(false);
          setServerVerified(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/stall/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'x-stall-token': storedToken,
          },
        });

        if (!res.ok) {
          // Token is invalid, expired, or deactivated on the server
          await logout();
          if (isMounted) {
            setIsVerifying(false);
            setServerVerified(false);
          }
          return;
        }

        const data = await res.json();
        if (data?.user && isMounted) {
          useStallAuthStore.setState({
            user: data.user,
            isAuthenticated: true,
            token: storedToken,
          });
          localStorage.setItem('amoga_stall_user', JSON.stringify(data.user));
          setServerVerified(true);
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('[StallRouteGuard] Server verification error:', err);
        if (isMounted) {
          if (isAuthenticated && user) {
            setServerVerified(true);
          }
          setIsVerifying(false);
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated, logout]);

  // Loading state while verifying server session
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <img
          src={amogaLogo}
          alt="Amoga"
          className="h-10 w-auto mb-4 object-contain animate-pulse"
        />
        <div className="flex items-center gap-2.5 text-xs font-mono tracking-widest uppercase text-[#762F39]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#762F39]" />
          <span>Validating Stall Staff Session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to dedicated /stall/login with return redirect
  if (!isAuthenticated || !serverVerified || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/stall/login?redirect=${returnUrl}`} replace />;
  }

  // Authenticated, check role permissions
  const userRole = user.role;
  const isAuthorized = ALLOWED_STALL_ROLES.includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-700 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full">
              403 Forbidden
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#292820] mt-3">
              Stall POS Access Denied
            </h1>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Your account <strong className="text-stone-800">{user.email}</strong> is assigned the role <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 font-mono text-[11px]">{userRole}</code>, which does not have permission to operate the Stall POS register.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-semibold">
              Authorized Stall Roles
            </div>
            <div className="text-stone-700 font-mono text-[11px]">
              STALL_MANAGER • STALL_CASHIER • SUPER_ADMIN
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/stall/login');
              }}
              className="w-full py-2.5 px-4 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In With Staff Account</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated & authorized
  return children;
}
