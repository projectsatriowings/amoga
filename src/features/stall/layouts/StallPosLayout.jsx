import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  User,
  LogOut,
  Clock,
  Store,
  ChevronDown,
  KeyRound,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useStallAuthStore } from '../store/useStallAuthStore';
import { stallApi } from '../services/stallApiClient';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import amogaLogo from '../../../assets/images/amoga-logo.png';

function formatRole(role) {
  switch (role) {
    case 'STALL_MANAGER':
      return 'Stall Manager';
    case 'STALL_CASHIER':
      return 'Stall Cashier';
    case 'SUPER_ADMIN':
      return 'Administrator';
    default:
      return role ? role.replace(/_/g, ' ') : 'Staff';
  }
}

export function StallPosLayout({ children, activeLocation, onSelectLocation, locations = [] }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useStallAuthStore();
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/stall/login', { replace: true });
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      setPwdError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await stallApi.changePassword({
        currentPassword: currPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPwdSuccess('Your password has been changed successfully! Other sessions have been rotated.');
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdSuccess('');
        }, 2200);
      } else {
        setPwdError(res.message || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // If staff has only 1 assigned location and is not super admin, lock selector
  const isLocationLocked =
    user?.role !== 'SUPER_ADMIN' &&
    Array.isArray(user?.assignedLocationIds) &&
    user.assignedLocationIds.length === 1 &&
    locations.length <= 1;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-stone-900 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top POS Header Bar */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        {/* Left: Branding & Stall Location */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <div className="flex items-center gap-2">
            <img src={amogaLogo} alt="Amoga" className="h-7 w-auto object-contain" />
            <div className="hidden sm:block border-l border-stone-200 pl-2.5">
              <span className="text-[11px] font-serif tracking-widest uppercase font-bold text-[#762F39] block leading-none">
                AMOGA ATELIER
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block leading-tight">
                Stall POS Register
              </span>
            </div>
          </div>

          {/* Location Selector Dropdown / Badge */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2 sm:px-2.5 py-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#762F39] shrink-0" />
            {isLocationLocked ? (
              <span className="font-semibold text-stone-800 text-xs truncate max-w-[150px] sm:max-w-[200px]" title={activeLocation?.name}>
                {activeLocation?.name || 'Assigned Stall'}
              </span>
            ) : (
              <div className="relative flex items-center">
                <select
                  value={activeLocation?.id || ''}
                  onChange={(e) => {
                    const loc = locations.find((l) => l.id === e.target.value);
                    if (loc && onSelectLocation) onSelectLocation(loc);
                  }}
                  className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none pr-4 cursor-pointer truncate max-w-[140px] sm:max-w-[220px]"
                  title="Select Authorized Stall"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.type === 'STALL' ? '🎪' : '🏢'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-stone-400 absolute right-0 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Center: Connectivity & Clock */}
        <div className="hidden md:flex items-center gap-3 text-xs text-stone-600">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono ${
              isOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
            title={isOnline ? 'Online - Live terminal synchronisation active' : 'Offline - Network disconnected'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <span className="font-mono text-stone-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            {currentTime}
          </span>
        </div>

        {/* Right: Authenticated Staff Info & Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* Authenticated Staff Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
                <div className="w-5 h-5 rounded-full bg-[#762F39]/10 text-[#762F39] flex items-center justify-center font-bold text-[10px]">
                  {(user.name || user.email || 'S')[0].toUpperCase()}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <span className="font-semibold text-stone-800 text-xs block truncate max-w-[120px]">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-[#762F39] font-mono font-medium block">
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>

              {/* Self-Service Change Password Action */}
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(true);
                  setPwdError('');
                  setPwdSuccess('');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-[#762F39] bg-stone-100 hover:bg-[#762F39]/10 border border-stone-200 hover:border-[#762F39]/20 rounded-lg transition-colors cursor-pointer"
                title="Change your account password"
              >
                <KeyRound className="w-3.5 h-3.5 text-stone-500 hover:text-[#762F39]" />
                <span className="hidden sm:inline">Change Password</span>
              </button>

              {/* Compact Sign-out Action */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Sign out of POS Terminal"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500 group-hover:text-rose-600" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/stall/login')}
              className="text-xs text-[#762F39] font-medium bg-[#762F39]/10 hover:bg-[#762F39]/20 px-3 py-1.5 rounded-lg border border-[#762F39]/20 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>

      {/* Staff Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#762F39]" />

            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#762F39]/10 text-[#762F39] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 leading-tight">
                    Change Staff Password
                  </h3>
                  <span className="text-[11px] font-mono text-stone-500">
                    {user?.name || user?.email} ({formatRole(user?.role)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {pwdError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Current Password *
                  </label>
                  <PasswordInput
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    New Password (min. 6 characters) *
                  </label>
                  <PasswordInput
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    autoComplete="new-password"
                    className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Confirm New Password *
                  </label>
                  <PasswordInput
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-3.5 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {pwdLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
