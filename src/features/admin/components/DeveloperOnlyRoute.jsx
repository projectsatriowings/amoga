import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Lock, Unlock, Eye, EyeOff, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function DeveloperOnlyRoute({ children, pageTitle = 'Developer Area', description }) {
  const navigate = useNavigate();
  const { isDeveloperMode, unlockDeveloperMode, lockDeveloperMode } = useAdminStore();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handleUnlock = (e) => {
    e?.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the developer passcode');
      return;
    }

    const res = unlockDeveloperMode(passcode);
    if (res.success) {
      setSuccess(true);
      setError(null);
    } else {
      setError(res.error || 'Invalid passcode');
    }
  };

  // If unlocked, render developer status banner and protected page content
  if (isDeveloperMode) {
    return (
      <div className="space-y-4">
        {/* Subtle Developer Active Banner */}
        <div className="bg-[#201916] text-[#E8E2D8] border border-[#38312B] rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-bold text-[#B08A4D]">
              DEVELOPER ACCESS ACTIVE
            </span>
            <span className="text-[11px] text-stone-400 hidden md:inline">
              • Hidden from standard client navigation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
              Ctrl+Alt+D
            </span>
            <button
              onClick={lockDeveloperMode}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#322722] hover:bg-[#473932] text-stone-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer border border-[#4A3D36]"
              title="Lock Developer Mode and restore client view"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Lock Developer Mode</span>
            </button>
          </div>
        </div>

        {/* Child Protected Page */}
        {children}
      </div>
    );
  }

  // When Locked: Luxury In-Place Developer Access Gate
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E5E0D5] rounded-2xl shadow-sm p-6 sm:p-8 text-center"
      >
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#201916] text-[#B08A4D] flex items-center justify-center mx-auto mb-5 shadow-inner border border-[#38312B]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-mono font-medium mb-3">
          <Code2 className="w-3.5 h-3.5 text-amber-700" />
          <span>DEVELOPER ONLY AREA</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#292820] mb-2">
          {pageTitle} is Restricted
        </h2>

        <p className="text-sm text-[#746F63] max-w-md mx-auto mb-6 leading-relaxed">
          {description ||
            'This administrative area controls core underlying architecture. It is hidden from standard client administration to protect storefront stability.'}
        </p>

        {/* In-Place Passcode Unlock Form */}
        <div className="max-w-md mx-auto bg-[#FBF9F5] border border-[#EAE4D9] rounded-xl p-5 mb-6 text-left">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase tracking-wider mb-1.5">
                Enter Developer Passcode to Unlock
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. dev2026"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#D5CEC2] focus:border-[#762F39] rounded-lg text-xs font-mono text-[#292820] outline-none shadow-2xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1E1916] hover:bg-[#342D28] text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Developer Access</span>
            </button>
          </form>

          <p className="mt-3 text-[11px] text-stone-500 font-mono text-center">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-stone-200 rounded text-stone-700 text-[10px]">Ctrl+Shift+D</kbd> anywhere in Admin
          </p>
        </div>

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-xs text-[#746F63] hover:text-[#292820] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Client Admin Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
}
