import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  CreditCard,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  Database,
  Lock,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminCommandPalette } from './AdminCommandPalette';
import amogaLogo from '../../../assets/images/amoga-logo.png';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, isAuthenticated, logout, checkSession } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useBodyScrollLock(Boolean(mobileMenuOpen));

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    } else {
      checkSession();
    }
  }, [isAuthenticated, navigate, checkSession]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#746F63] font-mono">
            Verifying Atelier Credentials...
          </span>
        </div>
      </div>
    );
  }

  const role = admin.role || 'CATALOGUE_MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CATALOGUE & STOCK',
      items: [
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Collections', path: '/admin/collections', icon: FolderTree },
        { label: 'Inventory', path: '/admin/inventory', icon: Boxes },
      ],
    },
    {
      title: 'COMMERCE & SALES',
      items: [
        { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Payments', path: '/admin/payments', icon: CreditCard },
        { label: 'Customers', path: '/admin/customers', icon: Users },
      ],
    },
    {
      title: 'CONTENT & MARKETING',
      items: [
        { label: 'Promotions', path: '/admin/promotions', icon: Sparkles },
        { label: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { label: 'Settings', path: '/admin/settings', icon: Settings },
        ...(isSuperAdmin
          ? [
              { label: 'Staff & Roles', path: '/admin/users', icon: ShieldCheck },
              { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
            ]
          : []),
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-[#762F39] text-white' };
      case 'CATALOGUE_MANAGER':
        return { label: 'Catalogue Lead', bg: 'bg-[#3F5A35]/15 text-[#3F5A35] border border-[#3F5A35]/30' };
      case 'ORDER_MANAGER':
        return { label: 'Fulfilment Lead', bg: 'bg-[#B08A4D]/15 text-[#8C6320] border border-[#B08A4D]/30' };
      case 'CONTENT_MANAGER':
        return { label: 'Content Lead', bg: 'bg-purple-900/15 text-purple-900 border border-purple-900/30' };
      default:
        return { label: userRole, bg: 'bg-stone-200 text-stone-800' };
    }
  };

  const roleBadge = getRoleBadge(role);

  // Compute breadcrumbs title
  const currentPath = location.pathname;
  let pageTitle = 'Executive Dashboard';
  if (currentPath === '/admin/products') pageTitle = 'Product Catalogue';
  else if (currentPath === '/admin/collections') pageTitle = 'Collection Architecture';
  else if (currentPath === '/admin/inventory') pageTitle = 'Stock & Inventory Control';
  else if (currentPath === '/admin/orders') pageTitle = 'Customer Order Stream';
  else if (currentPath === '/admin/payments') pageTitle = 'Payment Reconciliation';
  else if (currentPath === '/admin/customers') pageTitle = 'Customer Profiles';
  else if (currentPath === '/admin/promotions') pageTitle = 'Coupons & Promotions';
  else if (currentPath === '/admin/reports') pageTitle = 'Business Intelligence & Exports';
  else if (currentPath === '/admin/settings') pageTitle = 'Atelier Settings';
  else if (currentPath === '/admin/users') pageTitle = 'Staff Authorization & Roles';
  else if (currentPath === '/admin/audit-logs') pageTitle = 'System Audit Trail';

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex text-[#292820] font-sans antialiased selection:bg-[#762F39] selection:text-white">
      {/* Command Palette Modal */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Sidebar Desktop Spacer (preserves document flow while aside is fixed) */}
      <motion.div
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:block shrink-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Sidebar Desktop - Fixed & Sticky */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:flex flex-col bg-[#201916] text-[#E8E2D8] border-r border-[#38312B] flex-shrink-0 select-none z-30 fixed top-0 bottom-0 left-0 h-screen"
      >
        {/* Brand Header */}
        <div
          className={`border-b border-[#38312B]/70 flex items-center shrink-0 transition-all ${
            isCollapsed ? 'p-3 flex-col gap-2.5 items-center justify-center' : 'p-4 justify-between'
          }`}
        >
          <Link
            to="/admin"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 overflow-hidden"
            title="Amoga Atelier Admin"
          >
            <img
              src={amogaLogo}
              alt="Amoga"
              className={`${
                isCollapsed ? 'h-8 w-auto max-w-[48px]' : 'h-8 w-auto max-w-[130px]'
              } object-contain shrink-0`}
            />
            {!isCollapsed && (
              <span className="text-[9px] tracking-widest uppercase text-[#B08A4D] font-mono whitespace-nowrap pl-2 border-l border-[#38312B]">
                Admin
              </span>
            )}
          </Link>

          {/* Sidebar Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-[#A89F93] hover:text-[#F8F6F0] hover:bg-[#2C2520] rounded-md transition-colors shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[9px] uppercase font-mono tracking-wider text-[#A89F93]/70 font-semibold">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-[#C5BDB2] hover:bg-[#2C2520] hover:text-[#F8F6F0]'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 bg-[#762F39] rounded-lg shadow-sm"
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#A89F93]'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-[#38312B] bg-[#161210] shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1 justify-center">
              <div
                title={admin.name || 'Account'}
                className="w-8 h-8 rounded-full bg-[#3D332C] text-[#B08A4D] font-mono text-xs flex items-center justify-center font-bold shrink-0 border border-[#B08A4D]/30"
              >
                {admin.name ? admin.name[0].toUpperCase() : 'A'}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-[#A89F93] hover:text-rose-400 hover:bg-[#2C2520] rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#3D332C] text-[#B08A4D] font-mono text-xs flex items-center justify-center font-bold shrink-0 border border-[#B08A4D]/30">
                  {admin.name ? admin.name[0].toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#F8F6F0] truncate">{admin.name}</p>
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono font-medium truncate ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-[#A89F93] hover:text-rose-400 hover:bg-[#2C2520] rounded-md transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E0D5] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left Controls & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#292820] hover:bg-[#F8F6F0] rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-serif font-bold text-[#762F39]">AMOGA</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#898477]" />
              <span className="text-[#292820] font-medium hidden sm:inline">{pageTitle}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F6F0] hover:bg-[#EFEAE1] border border-[#E5E0D5] rounded-lg text-xs text-[#746F63] transition-colors"
              title="Quick Search (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-[#8C6320]" />
              <span className="hidden md:inline font-sans text-xs">Command Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#746F63] bg-[#FFFFFF] border border-[#E5E0D5] rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Environment Badge */}
            <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-[#292820] bg-[#F8F6F0] px-2.5 py-1 rounded-lg border border-[#E5E0D5]">
              <Database className="w-3 h-3 text-[#3F5A35]" />
              <span>Neon PostgreSQL</span>
              <span className="text-[#E5E0D5]">•</span>
              <span className="text-[#B08A4D]">Razorpay Test</span>
            </div>

            {/* Public Storefront Link */}
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#762F39] hover:text-[#8F414B] font-medium px-2.5 py-1.5 rounded-lg hover:bg-[#762F39]/10 transition-colors"
              title="Open Public Storefront"
            >
              <span className="hidden sm:inline">Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-[#746F63] hover:text-[#292820] hover:bg-[#F8F6F0] rounded-lg relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#762F39]" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl shadow-xl p-3 z-30"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#F8F6F0]">
                      <span className="text-xs font-semibold text-[#292820]">Operational Alerts</span>
                      <span className="text-[10px] font-mono text-[#3F5A35] bg-[#3F5A35]/10 px-1.5 py-0.5 rounded">
                        All Healthy
                      </span>
                    </div>
                    <div className="py-3 text-xs text-[#746F63] space-y-2">
                      <div className="flex items-start gap-2 p-1.5 rounded hover:bg-[#F8F6F0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3F5A35] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#292820]">Tea Pricing Verified</p>
                          <p className="text-[10px] font-mono">All 5 botanical teas priced & purchasable.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-1.5 rounded hover:bg-[#F8F6F0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3F5A35] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#292820]">Payment Reconciliation</p>
                          <p className="text-[10px] font-mono">Razorpay sandbox signature verification active.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-[#F8F6F0] transition-colors border border-transparent hover:border-[#E5E0D5]"
              >
                <div className="w-7 h-7 rounded-full bg-[#762F39] text-white font-mono text-xs flex items-center justify-center font-bold">
                  {admin.name ? admin.name[0].toUpperCase() : 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-[#292820] leading-tight truncate max-w-[120px]">
                    {admin.name}
                  </p>
                  <p className="text-[9px] font-mono text-[#746F63] leading-tight">
                    {roleBadge.label}
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl shadow-xl py-1 z-30"
                  >
                    <div className="px-3 py-2 border-b border-[#F8F6F0]">
                      <p className="text-xs font-medium text-[#292820]">{admin.name}</p>
                      <p className="text-[10px] text-[#746F63] font-mono truncate">{admin.email}</p>
                    </div>
                    <Link
                      to="/admin/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#292820] hover:bg-[#F8F6F0]"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#746F63]" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex overscroll-contain select-none"
            onWheel={(e) => {
              if (e.target === e.currentTarget) e.preventDefault();
            }}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) e.preventDefault();
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#201916]/60 backdrop-blur-sm touch-none overscroll-contain"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              data-modal-dialog
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 bg-[#201916] text-[#E8E2D8] flex flex-col h-full z-10 shadow-2xl overscroll-contain select-text"
            >
              <div className="p-4 border-b border-[#38312B] flex items-center justify-between">
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src={amogaLogo}
                    alt="Amoga"
                    className="h-8 w-auto max-w-[130px] object-contain shrink-0"
                  />
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[#B08A4D] pl-2 border-l border-[#38312B]">
                    Admin
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#C5BDB2] hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 text-[9px] uppercase font-mono tracking-wider text-[#A89F93] font-semibold">
                      {group.title}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.path === '/admin'
                          ? location.pathname === '/admin'
                          : location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg ${
                            isActive
                              ? 'bg-[#762F39] text-white shadow-sm font-semibold'
                              : 'text-[#C5BDB2] hover:bg-[#2C2520]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-[#38312B] bg-[#161210] flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-medium text-[#F8F6F0]">{admin.name}</p>
                  <p className="text-[10px] text-[#B08A4D] font-mono">{roleBadge.label}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#A89F93] hover:text-rose-400 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
