import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Shield,
  MapPin,
  Clock,
  KeyRound,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Search,
  Store,
  MoreHorizontal,
  Eye,
  Edit3,
  Calendar,
  Building2,
  ExternalLink,
  Check,
  Trash2,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { PasswordInput } from '../../../components/ui/PasswordInput';

export function AdminStaffManagement({ addStaffTrigger }) {
  const { adminFetch, admin } = useAdminStore();

  // Data states
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', text: '' }

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Active action menu state
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [activeUser, setActiveUser] = useState(null); // Currently viewed or edited user

  // Confirmation Dialog
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    confirmStyle: 'burgundy', // 'burgundy' | 'rose' | 'emerald'
    onConfirm: null,
  });

  // Form states for Add Staff
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STALL_CASHIER',
    assignedLocations: [],
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Form states for Edit Staff
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'STALL_CASHIER',
    assignedLocations: [],
  });
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  // Action in-flight tracking
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Trigger Add Staff modal from parent page header action
  useEffect(() => {
    if (addStaffTrigger && addStaffTrigger > 0) {
      handleOpenAddModal();
    }
  }, [addStaffTrigger]);

  // Load staff records and stall locations
  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // 1. Fetch Staff Users
      const usersRes = await adminFetch('/api/admin/users');
      const usersJson = await usersRes.json();
      if (!usersRes.ok) {
        throw new Error(usersJson.message || 'Failed to load staff accounts');
      }
      setUsers(usersJson.users || []);

      // 2. Fetch Locations (Physical Stalls / Warehouses)
      try {
        const stallRes = await adminFetch('/api/admin/stall/locations');
        if (stallRes.ok) {
          const stallJson = await stallRes.json();
          const list = (stallJson.locations || []).map((loc) => ({
            id: loc.id,
            name: loc.name,
            code: loc.code,
            venue: loc.venue || loc.city || loc.type || 'Physical Stall',
            type: loc.type,
          }));
          setLocations(list);
        } else {
          // Fallback to pos/events if stall/locations is unavailable
          const eventsRes = await adminFetch('/api/admin/pos/events');
          if (eventsRes.ok) {
            const eventsJson = await eventsRes.json();
            const stallList = (eventsJson.events || []).map((e) => ({
              id: e.id,
              name: e.name,
              code: e.code,
              venue: e.venue || e.city || 'Physical Stall',
              type: 'STALL',
            }));
            setLocations(stallList);
          }
        }
      } catch (_) {
        // Non-critical fallback for locations
      }
    } catch (err) {
      console.error('[LOAD DATA ERROR]:', err);
      setLoadError(err.message || 'Unable to connect to staff service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format Helpers
  const formatDatePart = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const formatTimePart = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const getLocationNames = (assignedIds) => {
    if (!assignedIds) return 'All Stalls';
    let ids = [];
    if (Array.isArray(assignedIds)) {
      ids = assignedIds;
    } else if (typeof assignedIds === 'string') {
      try {
        ids = JSON.parse(assignedIds);
      } catch (_) {}
    }

    if (!ids || ids.length === 0) return 'All Stalls';

    const names = ids
      .map((id) => locations.find((l) => l.id === id)?.name || id.substring(0, 8))
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : 'All Stalls';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          bg: 'bg-stone-900 text-stone-100 border border-stone-800',
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          bg: 'bg-stone-800 text-stone-100 border border-stone-700',
        };
      case 'STALL_MANAGER':
        return {
          label: 'Stall Manager',
          bg: 'bg-[#762F39]/10 text-[#762F39] border border-[#762F39]/25',
        };
      case 'STALL_CASHIER':
        return {
          label: 'Stall Cashier',
          bg: 'bg-[#8C6320]/10 text-[#8C6320] border border-[#8C6320]/25',
        };
      case 'CATALOGUE_MANAGER':
        return {
          label: 'Catalogue Lead',
          bg: 'bg-[#3F5A35]/10 text-[#3F5A35] border border-[#3F5A35]/25',
        };
      case 'ORDER_MANAGER':
        return {
          label: 'Fulfilment Lead',
          bg: 'bg-[#B08A4D]/10 text-[#8C6320] border border-[#B08A4D]/25',
        };
      case 'CONTENT_MANAGER':
        return {
          label: 'Content Lead',
          bg: 'bg-purple-900/10 text-purple-900 border border-purple-900/25',
        };
      default:
        return {
          label: role?.replace('_', ' ') || 'Staff',
          bg: 'bg-stone-100 text-stone-700 border border-stone-200',
        };
    }
  };

  // KPI Calculations
  const totalStaffCount = users.length;
  const activeStaffCount = users.filter((u) => u.isActive).length;
  const inactiveStaffCount = users.filter((u) => !u.isActive).length;
  const posStaffCount = users.filter((u) => u.role === 'STALL_MANAGER' || u.role === 'STALL_CASHIER').length;

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;

      // 3. Location filter
      if (locationFilter !== 'ALL') {
        const assigned = Array.isArray(u.assignedLocationIds)
          ? u.assignedLocationIds
          : typeof u.assignedLocationIds === 'string'
          ? JSON.parse(u.assignedLocationIds || '[]')
          : [];
        // If user has specific assigned locations, must include filter; if empty/null, they have access to All
        if (assigned.length > 0 && !assigned.includes(locationFilter)) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (u.name || '').toLowerCase().includes(query);
        const emailMatch = (u.email || '').toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, locationFilter, searchQuery]);

  // Handlers
  const handleOpenAddModal = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'STALL_CASHIER',
      assignedLocations: [],
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (targetUser) => {
    setOpenActionMenuId(null);
    setActiveUser(targetUser);
    let assigned = [];
    if (Array.isArray(targetUser.assignedLocationIds)) {
      assigned = targetUser.assignedLocationIds;
    } else if (typeof targetUser.assignedLocationIds === 'string') {
      try {
        assigned = JSON.parse(targetUser.assignedLocationIds);
      } catch (_) {}
    }
    setEditForm({
      name: targetUser.name || '',
      role: targetUser.role || 'STALL_CASHIER',
      assignedLocations: assigned,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleOpenDetailsDrawer = (targetUser) => {
    setOpenActionMenuId(null);
    setActiveUser(targetUser);
    setShowDetailsDrawer(true);
  };

  // Submit Add Staff Form
  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError('Name, email, and initial password are required.');
      return;
    }

    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }

    setCreating(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
          assignedLocationIds: createForm.assignedLocations.length > 0 ? createForm.assignedLocations : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to create staff account.');
      }

      setUsers((prev) => [json.user, ...prev]);
      setShowCreateModal(false);
      setNotification({
        type: 'success',
        text: `Staff account created successfully for ${json.user.email}.`,
      });
    } catch (err) {
      setCreateError(err.message || 'Error creating staff account.');
    } finally {
      setCreating(false);
    }
  };

  // Submit Edit Staff Form
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('Name is required.');
      return;
    }

    setEditing(true);
    try {
      const res = await adminFetch(`/api/admin/users/${activeUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          role: editForm.role,
          assignedLocationIds: editForm.assignedLocations.length > 0 ? editForm.assignedLocations : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to update staff details.');
      }

      setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? json.user : u)));
      setShowEditModal(false);
      setNotification({
        type: 'success',
        text: `Staff details updated for ${json.user.email}.`,
      });
    } catch (err) {
      setEditError(err.message || 'Error updating staff details.');
    } finally {
      setEditing(false);
    }
  };

  // Trigger Send Password Reset Link with Confirmation
  const confirmSendResetLink = (targetUser) => {
    setOpenActionMenuId(null);
    if (!targetUser.isActive) {
      setNotification({
        type: 'error',
        text: 'Account is inactive. Reactivate the account before sending a reset link.',
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Issue Password Reset Link',
      message: `Are you sure you want to send a single-use password reset link to ${targetUser.name || targetUser.email}? An authorized credential reset token will be dispatched.`,
      confirmLabel: 'Send Reset Link',
      confirmStyle: 'burgundy',
      onConfirm: async () => {
        setActionInProgressId(targetUser.id);
        try {
          const res = await adminFetch(`/api/admin/users/${targetUser.id}/send-reset-link`, {
            method: 'POST',
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.message || json.error || 'Failed to issue reset link.');
          }
          setNotification({
            type: 'success',
            text: json.message || `Password reset link issued for ${targetUser.email}.`,
          });
        } catch (err) {
          setNotification({ type: 'error', text: err.message || 'Error sending reset link.' });
        } finally {
          setActionInProgressId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Trigger Toggle Active/Inactive Status with Confirmation
  const confirmToggleStatus = (targetUser) => {
    setOpenActionMenuId(null);
    if (targetUser.id === admin?.id) {
      setNotification({
        type: 'error',
        text: 'Safety Lock: You cannot deactivate your own current administrator account.',
      });
      return;
    }

    const isDeactivating = targetUser.isActive;
    setConfirmModal({
      isOpen: true,
      title: isDeactivating ? 'Deactivate Staff Account' : 'Reactivate Staff Account',
      message: isDeactivating
        ? `Are you sure you want to deactivate ${targetUser.name || targetUser.email}? Their terminal sessions will be terminated immediately and they will be barred from logging in.`
        : `Reactivate access for ${targetUser.name || targetUser.email}? They will regain terminal login permissions.`,
      confirmLabel: isDeactivating ? 'Deactivate Account' : 'Reactivate Account',
      confirmStyle: isDeactivating ? 'rose' : 'emerald',
      onConfirm: async () => {
        setActionInProgressId(targetUser.id);
        try {
          const res = await adminFetch(`/api/admin/users/${targetUser.id}/toggle`, {
            method: 'PATCH',
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.message || json.error || 'Failed to update account status.');
          }
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: json.user.isActive } : u))
          );
          setNotification({
            type: 'success',
            text: `Account for ${targetUser.email} is now ${json.user.isActive ? 'Active' : 'Deactivated'}.`,
          });
        } catch (err) {
          setNotification({ type: 'error', text: err.message || 'Error updating status.' });
        } finally {
          setActionInProgressId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const confirmDeleteStaff = (targetUser) => {
    if (targetUser.id === admin?.id) {
      alert('You cannot delete your own logged-in Super Admin account.');
      return;
    }
    setOpenActionMenuId(null);
    setConfirmModal({
      isOpen: true,
      title: `Permanently Delete ${targetUser.name}?`,
      message: `Are you sure you want to delete ${targetUser.email}? This will revoke their access and permanently remove their staff login.`,
      confirmText: 'Delete Staff Account',
      variant: 'danger',
      onConfirm: async () => {
        setActionInProgressId(targetUser.id);
        try {
          const res = await adminFetch(`/api/admin/users/${targetUser.id}`, {
            method: 'DELETE',
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || 'Failed to delete staff member.');

          setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
          setNotification({
            type: 'success',
            text: `Staff account ${targetUser.email} has been permanently deleted.`,
          });
        } catch (err) {
          setNotification({ type: 'error', text: err.message || 'Error deleting account.' });
        } finally {
          setActionInProgressId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs animate-fadeIn transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staff Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E0D5] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A7167] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Total Staff</span>
            <div className="w-7 h-7 rounded-lg bg-[#762F39]/10 text-[#762F39] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1A1817] tracking-tight">{totalStaffCount}</div>
          <span className="text-[11px] text-[#7A7167] mt-0.5 block">Configured team accounts</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E0D5] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A7167] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Active</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{activeStaffCount}</div>
          <span className="text-[11px] text-[#7A7167] mt-0.5 block">Authorized for login</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E0D5] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A7167] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Inactive</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-700 tracking-tight">{inactiveStaffCount}</div>
          <span className="text-[11px] text-[#7A7167] mt-0.5 block">Disabled credentials</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E0D5] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A7167] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Stall Managers & Cashiers</span>
            <div className="w-7 h-7 rounded-lg bg-[#8C6320]/10 text-[#8C6320] flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1A1817] tracking-tight">{posStaffCount}</div>
          <span className="text-[11px] text-[#7A7167] mt-0.5 block">Physical POS billing roles</span>
        </div>
      </div>

      {/* Staff Table Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E0D5] shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#7A7167] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-[#1A1817] placeholder:text-[#9A9187] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl pl-3 pr-8 py-2 text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#722F37] cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">All Roles ({totalStaffCount})</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="CATALOGUE_MANAGER">Catalogue Lead</option>
                <option value="ORDER_MANAGER">Fulfilment Lead</option>
                <option value="CONTENT_MANAGER">Content Lead</option>
                <option value="STALL_MANAGER">Stall Manager</option>
                <option value="STALL_CASHIER">Stall Cashier</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A7167] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl pl-3 pr-8 py-2 text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#722F37] cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active ({activeStaffCount})</option>
                <option value="INACTIVE">Inactive ({inactiveStaffCount})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A7167] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Stall Location Filter */}
            {locations.length > 0 && (
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-xs bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl pl-3 pr-8 py-2 text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#722F37] cursor-pointer appearance-none shadow-2xs max-w-[160px] truncate"
                >
                  <option value="ALL">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A7167] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              title="Refresh staff records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#722F37]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Results Counter / Filter Indicator */}
        <div className="flex items-center justify-between text-xs text-[#7A7167] pt-1 border-t border-[#F0EBE1]">
          <span>
            Showing <strong className="text-stone-900">{filteredUsers.length}</strong> of{' '}
            <strong className="text-stone-900">{totalStaffCount}</strong> staff members
          </span>

          {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || locationFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setLocationFilter('ALL');
              }}
              className="text-[11px] text-[#722F37] hover:underline font-medium cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Error Banner with Retry */}
      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-800 font-medium hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Staff Accounts Table Container */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[960px]">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D9] text-[#7A7167] uppercase font-mono tracking-wider text-[11px]">
                <th className="py-3.5 px-5 w-[28%]">Staff Member</th>
                <th className="py-3.5 px-4 w-[16%]">Role</th>
                <th className="py-3.5 px-4 w-[20%]">Assigned Stalls</th>
                <th className="py-3.5 px-4 w-[12%]">Status</th>
                <th className="py-3.5 px-4 w-[14%]">Last Login</th>
                <th className="py-3.5 px-5 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {loading ? (
                // Shimmering Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-stone-200 rounded w-28" />
                          <div className="h-2.5 bg-stone-100 rounded w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-stone-100 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 bg-stone-100 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-stone-100 rounded-full w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 bg-stone-100 rounded w-20" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="w-7 h-7 bg-stone-100 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="6" className="py-14 text-center text-stone-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
                      <p className="text-stone-800 font-semibold text-xs">No staff accounts found.</p>
                      <p className="text-[11px] text-stone-500">
                        {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || locationFilter !== 'ALL'
                          ? 'No staff members match your active filters.'
                          : 'No staff accounts exist in the directory.'}
                      </p>
                      {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || locationFilter !== 'ALL') ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setRoleFilter('ALL');
                            setStatusFilter('ALL');
                            setLocationFilter('ALL');
                          }}
                          className="mt-2 inline-block text-[11px] text-[#722F37] font-semibold hover:underline"
                        >
                          Clear all filters
                        </button>
                      ) : isSuperAdmin ? (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#722F37] text-white rounded-lg text-xs font-semibold hover:bg-[#5E2229]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Staff User</span>
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const isActionBusy = actionInProgressId === u.id;
                  const initial = u.name ? u.name[0].toUpperCase() : u.email ? u.email[0].toUpperCase() : 'S';
                  const datePart = formatDatePart(u.lastLoginAt);
                  const timePart = formatTimePart(u.lastLoginAt);
                  const isMenuOpen = openActionMenuId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#FCFAF7] transition-colors group">
                      {/* Name & Avatar & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#722F37]/10 text-[#722F37] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#722F37]/20 select-none shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 leading-snug truncate">
                              {u.name || 'Staff User'}
                            </div>
                            <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold tracking-wide ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Assigned Stalls */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="flex items-center gap-1.5" title={getLocationNames(u.assignedLocationIds)}>
                          <MapPin className="w-3.5 h-3.5 text-[#722F37] shrink-0" />
                          <span className="truncate max-w-[190px] font-medium text-[11px]">
                            {getLocationNames(u.assignedLocationIds)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-stone-400'}`}
                          />
                          <span>{u.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                        {datePart ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-900 text-[11px]">{datePart}</span>
                            <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {timePart}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Never logged in</span>
                        )}
                      </td>

                      {/* Actions: Compact 3-Dot Dropdown Menu */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left" ref={isMenuOpen ? actionMenuRef : null}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(isMenuOpen ? null : u.id);
                            }}
                            disabled={isActionBusy}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
                            title="Actions"
                          >
                            {isActionBusy ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#722F37]" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </button>

                          {/* Dropdown Menu Window */}
                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 ${
                                filteredUsers.indexOf(u) >= Math.max(1, filteredUsers.length - 2)
                                  ? 'bottom-full mb-1.5'
                                  : 'top-full mt-1.5'
                              } w-48 bg-white rounded-xl shadow-xl border border-[#E5E0D5] py-1.5 z-40 text-left animate-fadeIn`}
                            >
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => handleOpenDetailsDrawer(u)}
                                className="w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-stone-400" />
                                <span>View Details</span>
                              </button>

                              {/* Edit Staff Details */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(u)}
                                  className="w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Edit Staff</span>
                                </button>
                              )}

                              {/* Send Reset Link */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => confirmSendResetLink(u)}
                                  disabled={!u.isActive}
                                  className="w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-[#722F37]" />
                                  <span>Send Reset Link</span>
                                </button>
                              )}

                              {/* Activate / Deactivate Toggle */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => confirmToggleStatus(u)}
                                  className={`w-full px-3 py-2 text-xs border-t border-stone-100 flex items-center gap-2 cursor-pointer transition-colors ${
                                    u.isActive
                                      ? 'text-rose-700 hover:bg-rose-50'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {u.isActive ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Deactivate Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Activate Account</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Permanently Delete Account (Super Admin only, not self) */}
                              {isSuperAdmin && u.id !== admin?.id && (
                                <button
                                  type="button"
                                  onClick={() => confirmDeleteStaff(u)}
                                  className="w-full px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 border-t border-stone-100 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete Staff Account</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD STAFF MEMBER ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E0D5] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#722F37]" />

            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 leading-tight">
                    Add New Staff Member
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Configure staff login credentials and physical stall authorizations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* 1. Personal Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-100 pb-1">
                  1. Personal Details
                </h4>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Staff Email / Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="staff@amoga.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  />
                </div>
              </div>

              {/* 2. Access & Role */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-100 pb-1">
                  2. Access & Role
                </h4>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Staff Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  >
                    <option value="STALL_CASHIER">Stall Cashier (POS Terminal Operator)</option>
                    <option value="STALL_MANAGER">Stall Manager (POS + Stock Transfers)</option>
                    <option value="CATALOGUE_MANAGER">Catalogue Lead</option>
                    <option value="ORDER_MANAGER">Fulfilment Lead</option>
                    <option value="CONTENT_MANAGER">Content Lead</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Initial Password (min. 6 characters) <span className="text-rose-500">*</span>
                  </label>
                  <PasswordInput
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Set secure password"
                    autoComplete="new-password"
                    className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  />
                </div>
              </div>

              {/* 3. Stall Assignment */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-100 pb-1">
                  3. Physical Stall Assignment
                </h4>
                <p className="text-[10px] text-stone-500">
                  Select specific stall locations this staff member can bill at. Leave blank to authorize access to all stalls.
                </p>
                <div className="max-h-28 overflow-y-auto border border-stone-200 rounded-lg p-2 space-y-1 bg-stone-50">
                  {locations.map((loc) => {
                    const isChecked = createForm.assignedLocations.includes(loc.id);
                    return (
                      <label key={loc.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                assignedLocations: [...createForm.assignedLocations, loc.id],
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                assignedLocations: createForm.assignedLocations.filter((id) => id !== loc.id),
                              });
                            }
                          }}
                          className="rounded text-[#722F37] focus:ring-[#722F37]"
                        />
                        <span className="text-xs text-stone-800">{loc.name}</span>
                      </label>
                    );
                  })}
                  {locations.length === 0 && (
                    <span className="text-[11px] text-stone-400 italic">No physical stalls defined yet.</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Staff Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT STAFF MEMBER ================= */}
      {showEditModal && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E0D5] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#722F37]" />

            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#722F37]/10 text-[#722F37] flex items-center justify-center">
                  <Edit3 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 leading-tight">
                    Edit Staff Member
                  </h3>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {activeUser.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="p-5 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                />
              </div>

              {/* 2. Staff Role */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Staff Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                >
                  <option value="STALL_CASHIER">Stall Cashier (POS Terminal Operator)</option>
                  <option value="STALL_MANAGER">Stall Manager (POS + Stock Transfers)</option>
                  <option value="CATALOGUE_MANAGER">Catalogue Lead</option>
                  <option value="ORDER_MANAGER">Fulfilment Lead</option>
                  <option value="CONTENT_MANAGER">Content Lead</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>

              {/* 3. Physical Stall Assignment */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-semibold">
                  Physical Stall Assignments
                </label>
                <p className="text-[10px] text-stone-500">
                  Select assigned physical stalls. Leave all unchecked to authorize access to all stall locations.
                </p>
                <div className="max-h-32 overflow-y-auto border border-stone-200 rounded-lg p-2 space-y-1 bg-stone-50">
                  {locations.map((loc) => {
                    const isChecked = editForm.assignedLocations.includes(loc.id);
                    return (
                      <label key={loc.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({
                                ...editForm,
                                assignedLocations: [...editForm.assignedLocations, loc.id],
                              });
                            } else {
                              setEditForm({
                                ...editForm,
                                assignedLocations: editForm.assignedLocations.filter((id) => id !== loc.id),
                              });
                            }
                          }}
                          className="rounded text-[#722F37] focus:ring-[#722F37]"
                        />
                        <span className="text-xs text-stone-800">{loc.name}</span>
                      </label>
                    );
                  })}
                  {locations.length === 0 && (
                    <span className="text-[11px] text-stone-400 italic">No physical stalls defined yet.</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {editing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DRAWER: VIEW STAFF DETAILS ================= */}
      {showDetailsDrawer && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E5E0D5] flex flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div>
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#722F37]/10 text-[#722F37] font-bold text-sm flex items-center justify-center border border-[#722F37]/20 shadow-2xs">
                    {activeUser.name ? activeUser.name[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900 leading-tight">
                      {activeUser.name || 'Staff User'}
                    </h3>
                    <span className="text-xs font-mono text-stone-500">{activeUser.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 text-xs text-stone-700">
                {/* Status & Role Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide ${
                      activeUser.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${activeUser.isActive ? 'bg-emerald-500' : 'bg-stone-400'}`}
                    />
                    <span>{activeUser.isActive ? 'ACTIVE ACCOUNT' : 'DEACTIVATED'}</span>
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold ${getRoleBadge(activeUser.role).bg}`}>
                    {getRoleBadge(activeUser.role).label}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D5] space-y-3 font-mono text-[11px]">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Account ID</span>
                    <span className="text-stone-800 select-all">{activeUser.id}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Created Date</span>
                    <span className="text-stone-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {formatDatePart(activeUser.createdAt) || 'System Seeded'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Last Login Timestamp</span>
                    <span className="text-stone-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {activeUser.lastLoginAt ? (
                        `${formatDatePart(activeUser.lastLoginAt)} at ${formatTimePart(activeUser.lastLoginAt)}`
                      ) : (
                        <span className="italic text-stone-400">Never logged in</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Assigned Stalls */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-2">
                    Physical Stall Authorizations
                  </h4>
                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50">
                    <div className="flex items-center gap-2 text-stone-800">
                      <Building2 className="w-4 h-4 text-[#722F37] shrink-0" />
                      <span className="font-semibold">{getLocationNames(activeUser.assignedLocationIds)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-stone-100 bg-[#FAF8F5] space-y-2">
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsDrawer(false);
                      handleOpenEditModal(activeUser);
                    }}
                    className="flex-1 py-2 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsDrawer(false);
                      confirmSendResetLink(activeUser);
                    }}
                    disabled={!activeUser.isActive}
                    className="flex-1 py-2 text-xs font-semibold bg-white border border-[#722F37]/30 text-[#722F37] hover:bg-[#722F37]/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Link</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION DIALOG MODAL ================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E5E0D5] space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.confirmStyle === 'rose'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmModal.confirmStyle === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-[#722F37]/10 text-[#722F37]'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-stone-900 leading-snug">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer shadow-xs ${
                  confirmModal.confirmStyle === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmModal.confirmStyle === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#722F37] hover:bg-[#5E2229]'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
