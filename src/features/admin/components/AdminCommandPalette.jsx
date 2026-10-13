import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  CreditCard,
  Users,
  MessageSquare,
  Sparkles,
  BarChart3,
  Settings,
  History,
  ExternalLink,
  ArrowRight,
  Command,
  X,
  AlertTriangle,
  Terminal,
  Code2,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminCommandPalette({ isOpen, onClose, onRefresh }) {
  const navigate = useNavigate();
  const { admin, isDeveloperMode, toggleDeveloperMode } = useAdminStore();
  const [query, setQuery] = useState('');

  // Lock backdrop and background scrolling while command palette is active
  useBodyScrollLock(Boolean(isOpen));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const role = admin?.role || 'CATALOGUE_MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const allItems = [
    {
      id: 'dash',
      title: 'Executive Dashboard',
      category: 'Overview',
      path: '/admin',
      icon: LayoutDashboard,
      shortcut: 'G D',
    },
    {
      id: 'products',
      title: 'Product Catalogue',
      category: 'Catalogue & Stock',
      path: '/admin/products',
      icon: Package,
      shortcut: 'G P',
    },
    {
      id: 'inventory',
      title: 'Stock & Inventory Management',
      category: 'Catalogue & Stock',
      path: '/admin/inventory',
      icon: Boxes,
      shortcut: 'G I',
    },
    {
      id: 'inventory-low',
      title: 'Low Stock Attention Items',
      category: 'Catalogue & Stock',
      path: '/admin/inventory?status=low',
      icon: AlertTriangle,
    },
    {
      id: 'orders',
      title: 'Customer Orders Stream',
      category: 'Commerce & Sales',
      path: '/admin/orders',
      icon: ShoppingBag,
      shortcut: 'G O',
    },
    {
      id: 'payments',
      title: 'Payment Transactions & Reconciliation',
      category: 'Commerce & Sales',
      path: '/admin/payments',
      icon: CreditCard,
    },
    {
      id: 'customers',
      title: 'Customer Directory & Profiles',
      category: 'Commerce & Sales',
      path: '/admin/customers',
      icon: Users,
    },
    {
      id: 'inquiries',
      title: 'Customer Inquiries & Concierge Desk',
      category: 'Commerce & Sales',
      path: '/admin/customer-inquiries',
      icon: MessageSquare,
      shortcut: 'G Q',
    },
    {
      id: 'promotions',
      title: 'Promotional Coupons & Rules',
      category: 'Content & Marketing',
      path: '/admin/promotions',
      icon: Sparkles,
    },
    {
      id: 'reports',
      title: 'Business Analytics & Data Export',
      category: 'Content & Marketing',
      path: '/admin/reports',
      icon: BarChart3,
    },
    {
      id: 'settings',
      title: 'Atelier Settings & Preferences',
      category: 'System & Settings',
      path: '/admin/settings',
      icon: Settings,
    },
    ...(isDeveloperMode
      ? [
          {
            id: 'collections',
            title: 'Collections Architecture',
            category: 'Developer Architecture',
            path: '/admin/collections',
            icon: FolderTree,
            shortcut: 'G C',
          },
          {
            id: 'audit',
            title: 'Audit Trail & Event Logs',
            category: 'Developer Architecture',
            path: '/admin/audit-logs',
            icon: History,
          },
        ]
      : []),
    ...((isDeveloperMode || query.toLowerCase().includes('dev') || query.toLowerCase().includes('code'))
      ? [
          {
            id: 'dev-mode-toggle',
            title: isDeveloperMode ? 'Lock Developer Mode (Return to Client View)' : 'Unlock Developer Mode (Passcode Required)',
            category: 'Developer Architecture',
            action: () => {
              onClose();
              toggleDeveloperMode();
            },
            icon: Terminal,
            shortcut: 'Ctrl+Alt+D',
          },
        ]
      : []),
    {
      id: 'storefront',
      title: 'Open Public Storefront',
      category: 'Quick Actions',
      action: () => window.open('/', '_blank'),
      icon: ExternalLink,
      shortcut: '⌘ O',
    },
  ];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          executeItem(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const executeItem = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overscroll-contain select-none"
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#161210]/60 backdrop-blur-sm touch-none select-none overscroll-contain"
            onClick={onClose}
          />

          {/* Palette Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] overscroll-contain select-text"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#E5E0D5] bg-[#FAF8F5]">
              <Search className="w-5 h-5 text-[#8C6320] flex-shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search admin pages, inventory, orders, settings..."
                className="w-full bg-transparent text-sm text-[#292820] placeholder-[#898477] focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-[#746F63] hover:text-[#292820] rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 ml-2 text-[10px] font-mono font-medium text-[#746F63] bg-[#EFEAE1] border border-[#D5CEC2] rounded">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#F5F2EB]">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#746F63]">
                  No matching admin destinations found for <span className="font-semibold text-[#292820]">"{query}"</span>.
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#762F39] text-white shadow-sm'
                          : 'text-[#292820] hover:bg-[#F8F6F0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-md ${
                            isSelected
                              ? 'bg-white/15 text-white'
                              : 'bg-[#F5F2EB] text-[#762F39]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-white' : 'text-[#292820]'}`}>
                            {item.title}
                          </p>
                          <p
                            className={`text-[10px] font-mono uppercase tracking-wider ${
                              isSelected ? 'text-white/70' : 'text-[#746F63]'
                            }`}
                          >
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.shortcut && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#EFEAE1] text-[#746F63] border border-[#D5CEC2]'
                            }`}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        <ArrowRight
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-white' : 'text-[#898477]'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 bg-[#F8F6F0] border-t border-[#E5E0D5] flex items-center justify-between text-[11px] font-mono text-[#746F63]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded text-[9px]">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded text-[9px]">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded text-[9px]">↵</kbd>
                  Select
                </span>
              </div>
              <span>Amoga Atelier Navigator</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
