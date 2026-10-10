import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  CreditCard,
  Users,
  Image as ImageIcon,
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
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, isAuthenticated, logout, checkSession } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    } else {
      checkSession();
    }
  }, [isAuthenticated, navigate, checkSession]);

  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#6B635B] font-mono">Authenticating Staff...</span>
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
        { label: 'Homepage Banners', path: '/admin/banners', icon: ImageIcon },
        { label: 'Storefront CMS', path: '/admin/homepage', icon: Sparkles },
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
        return { label: 'Super Admin', bg: 'bg-[#722F37] text-white' };
      case 'CATALOGUE_MANAGER':
        return { label: 'Catalogue Lead', bg: 'bg-[#287A25]/15 text-[#1B5219] border border-[#287A25]/30' };
      case 'ORDER_MANAGER':
        return { label: 'Fulfilment Lead', bg: 'bg-[#8C6320]/15 text-[#5C4010] border border-[#8C6320]/30' };
      case 'CONTENT_MANAGER':
        return { label: 'Content Lead', bg: 'bg-[#5B3E6E]/15 text-[#3D284B] border border-[#5B3E6E]/30' };
      default:
        return { label: userRole, bg: 'bg-stone-200 text-stone-800' };
    }
  };

  const roleBadge = getRoleBadge(role);

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex text-[#1A1817] font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1E1916] text-[#E8E2D8] border-r border-[#38312B] flex-shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#38312B]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#722F37] flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm border border-[#C5A46D]/40">
              A
            </div>
            <div>
              <h1 className="font-serif tracking-widest text-lg font-bold text-[#F5F2EB]">AMOGA</h1>
              <p className="text-[10px] tracking-widest uppercase text-[#C5A46D] font-mono">Atelier Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-[#9E9385]">
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
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-all duration-150 ${
                      isActive
                        ? 'bg-[#722F37] text-white shadow-sm font-semibold'
                        : 'text-[#C5BDB2] hover:bg-[#2C2520] hover:text-[#F5F2EB]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5F2EB]' : 'text-[#A89F93]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-[#38312B] bg-[#161210]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#3D332C] text-[#C5A46D] font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">
                {admin.name ? admin.name[0].toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-[#F5F2EB] truncate">{admin.name}</p>
                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-[#A89F93] hover:text-[#E25555] hover:bg-[#2C2520] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-[#FBF9F5] border-b border-[#E8E2D8] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#4A423B] hover:bg-[#EFEAE1] rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#7A7167]">
              <span>Amoga</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#A89F93]" />
              <span className="text-[#1A1817] font-medium capitalize">
                {location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#5C544C] bg-[#EFEBE3] px-2.5 py-1 rounded border border-[#DFD8CC]">
              <Database className="w-3 h-3 text-[#287A25]" />
              <span>PostgreSQL (Neon)</span>
              <span className="text-[#9E9385]">•</span>
              <span className="text-[#B88E38]">Razorpay Sandbox</span>
            </div>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#722F37] hover:text-[#521C22] font-medium px-2.5 py-1.5 rounded hover:bg-[#722F37]/10 transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#1E1916] text-[#E8E2D8] flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-[#38312B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#722F37] flex items-center justify-center text-white font-serif font-bold text-sm">
                  A
                </div>
                <span className="font-serif font-bold tracking-widest text-[#F5F2EB]">AMOGA ADMIN</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#C5BDB2] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-4">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-[#9E9385]">
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
                        className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded ${
                          isActive ? 'bg-[#722F37] text-white' : 'text-[#C5BDB2] hover:bg-[#2C2520]'
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
                <p className="font-medium text-[#F5F2EB]">{admin.name}</p>
                <p className="text-[10px] text-[#C5A46D] font-mono">{roleBadge.label}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-[#A89F93] hover:text-[#E25555]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
