import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  MapPin,
  User,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { posApi } from '../../admin/pos/services/posApiClient';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function StallPosLayout({ children, activeLocation, onSelectLocation, locations = [] }) {
  const navigate = useNavigate();
  const { admin, isAuthenticated, logout } = useAdminStore();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);

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
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-stone-900 flex flex-col font-sans select-none">
      {/* Top POS Header Bar */}
      <header className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        {/* Left: Branding & Stall Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={amogaLogo} alt="Amoga" className="h-7 w-auto object-contain" />
            <div className="hidden sm:block border-l border-stone-300 pl-2.5">
              <span className="text-xs font-serif tracking-widest uppercase font-semibold text-[#762F39] block leading-none">
                AMOGA ATELIER
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block leading-tight">
                Dedicated Stall POS
              </span>
            </div>
          </div>

          {/* Location Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-100/90 border border-stone-300 rounded-lg px-2.5 py-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#762F39] shrink-0" />
            <select
              value={activeLocation?.id || ''}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc && onSelectLocation) onSelectLocation(loc);
              }}
              className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer pr-1"
              title="Active Stall Location"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.type === 'STALL' ? '🎪' : '🏢'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: System Status & Clock */}
        <div className="hidden md:flex items-center gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-mono">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-medium">ONLINE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-700 font-medium">OFFLINE</span>
              </>
            )}
          </div>
          <span className="font-mono text-stone-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            {currentTime}
          </span>
        </div>

        {/* Right: Staff Info & Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && admin ? (
            <>
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-medium text-stone-800 truncate max-w-[120px]">
                  {admin.name || admin.email}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#762F39]/10 text-[#762F39] font-mono font-medium">
                  {admin.role}
                </span>
              </div>

              <Link
                to="/admin/pos/stalls"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
                title="Go to Admin Panel"
              >
                <span>Admin Atelier</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Sign out of POS Terminal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              Staff Authorization Required
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
