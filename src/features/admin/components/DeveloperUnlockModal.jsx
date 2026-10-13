import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, Unlock, Eye, EyeOff, X, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function DeveloperUnlockModal({ isOpen, onClose }) {
  const { isDeveloperMode, unlockDeveloperMode, lockDeveloperMode } = useAdminStore();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const inputRef = useRef(null);

  useBodyScrollLock(Boolean(isOpen));

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(null);
      setSuccessMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleUnlock = (e) => {
    e?.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the developer passcode');
      return;
    }

    const res = unlockDeveloperMode(passcode);
    if (res.success) {
      setSuccessMsg('Developer mode unlocked successfully');
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setError(res.error || 'Invalid passcode');
    }
  };

  const handleLock = () => {
    lockDeveloperMode();
    setSuccessMsg('Developer mode locked. Client mode restored.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F0C0B]/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#1C1614] text-[#E8E2D8] border border-[#38312B] rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
        >
          {/* Subtle architectural background accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#B08A4D]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isDeveloperMode
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-[#2A221E] border-[#4A3D36] text-[#B08A4D]'
            }`}>
              {isDeveloperMode ? <Terminal className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-white tracking-wide">
                  Developer Mode
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDeveloperMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {isDeveloperMode ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Collections Architecture & System Audit Trail
              </p>
            </div>
          </div>

          {/* Mode Explainer */}
          <div className="p-3.5 bg-[#251E1A] border border-[#38312B] rounded-xl text-xs text-stone-300 space-y-1.5 mb-5">
            <p className="font-medium text-stone-200">
              {isDeveloperMode
                ? 'Developer tools are currently unlocked.'
                : 'Client protection is active.'}
            </p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {isDeveloperMode
                ? 'Collections Architecture and System Audit Trail are currently visible in the navigation. Lock developer mode before handing the panel to the client.'
                : 'Collections Architecture and System Audit Trail are hidden to prevent accidental edits by client administrators.'}
            </p>
          </div>

          {/* Success / Error alerts */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isDeveloperMode ? (
            /* Action when already unlocked: Lock button */
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLock}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#762F39] hover:bg-[#8F414B] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Developer Mode (Switch to Client Mode)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 bg-transparent hover:bg-stone-800 text-stone-400 rounded-xl text-xs transition-colors"
              >
                Keep Unlocked & Close
              </button>
            </div>
          ) : (
            /* Action when locked: Passcode input & unlock */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Developer Passcode
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
                    placeholder="Enter passcode (e.g. dev2026)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#140F0E] border border-[#38312B] focus:border-[#B08A4D] rounded-xl text-xs font-mono text-white placeholder:text-stone-600 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                    title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#B08A4D] hover:bg-[#C29D5D] text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Developer Access</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="pt-2 text-center text-[10px] text-stone-500 font-mono space-y-1">
                <div>Shortcut: <span className="text-stone-300 font-bold">Ctrl + Alt + D</span> or <span className="text-stone-300 font-bold">Ctrl + Shift + X</span></div>
                <div>Passcode: <span className="text-amber-400 font-bold tracking-wider">dev2026</span> • Or click Amoga logo 5 times</div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
