import React, { useState, useEffect } from 'react';
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
  Send,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { PasswordInput } from '../../../components/ui/PasswordInput';

export function AdminStaffManagement() {
  const { adminFetch, admin } = useAdminStore();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'STALL_ONLY' | 'STALL_MANAGER' | 'STALL_CASHIER'
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }

  // Action loading states
  const [resettingId, setResettingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('STALL_CASHIER');
  const [newStaffLocations, setNewStaffLocations] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, locsRes] = await Promise.all([
        adminFetch('/api/admin/users'),
        adminFetch('/api/admin/stall/locations').catch(() => ({ ok: false })),
      ]);

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.users) setUsers(usersJson.users);
      }

      if (locsRes && locsRes.ok) {
        const locsJson = await locsRes.json();
        if (locsJson.locations) setLocations(locsJson.locations);
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to load staff accounts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendResetLink = async (targetUser) => {
    setResettingId(targetUser.id);
    setNotification(null);
    try {
      const res = await adminFetch(`/api/admin/users/${targetUser.id}/send-reset-link`, {
        method: 'POST',
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setNotification({
          type: 'success',
          text: json.message || `Password reset link issued for ${targetUser.email}.`,
        });
      } else {
        setNotification({
          type: 'error',
          text: json.message || json.error || 'Failed to issue password reset link.',
        });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Error sending reset link.' });
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === admin?.id) {
      setNotification({ type: 'error', text: 'You cannot deactivate your own account.' });
      return;
    }

    const actionText = targetUser.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${targetUser.name || targetUser.email}?`)) {
      return;
    }

    setTogglingId(targetUser.id);
    setNotification(null);
    try {
      const res = await adminFetch(`/api/admin/users/${targetUser.id}/toggle`, {
        method: 'PATCH',
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: json.user.isActive } : u))
        );
        setNotification({
          type: 'success',
          text: `Account for ${targetUser.email} is now ${json.user.isActive ? 'Active' : 'Disabled'}.`,
        });
      } else {
        setNotification({ type: 'error', text: json.message || 'Failed to update account status.' });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Error updating status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword) {
      setCreateError('Name, email, and password are required.');
      return;
    }

    if (newStaffPassword.length < 6) {
      setCreateError('Password must contain at least 6 characters.');
      return;
    }

    setCreating(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          password: newStaffPassword,
          role: newStaffRole,
          assignedLocationIds: newStaffLocations.length > 0 ? newStaffLocations : null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNotification({
          type: 'success',
          text: `Staff account created for ${json.user.email} (${json.user.role}).`,
        });
        setShowCreateModal(false);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPassword('');
        setNewStaffRole('STALL_CASHIER');
        setNewStaffLocations([]);
        loadData();
      } else {
        setCreateError(json.message || json.error || 'Failed to create staff account.');
      }
    } catch (err) {
      setCreateError(err.message || 'Error creating staff account.');
    } finally {
      setCreating(false);
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
      case 'STALL_MANAGER':
        return { label: 'Stall Manager', bg: 'bg-[#762F39]/10 text-[#762F39] border border-[#762F39]/20' };
      case 'STALL_CASHIER':
        return { label: 'Stall Cashier', bg: 'bg-[#8C6320]/10 text-[#8C6320] border border-[#8C6320]/20' };
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-stone-800 text-white' };
      case 'CATALOGUE_MANAGER':
        return { label: 'Catalogue Lead', bg: 'bg-[#3F5A35]/10 text-[#3F5A35] border border-[#3F5A35]/20' };
      case 'ORDER_MANAGER':
        return { label: 'Fulfilment Lead', bg: 'bg-amber-100 text-amber-900 border border-amber-300' };
      default:
        return { label: role?.replace('_', ' ') || 'Staff', bg: 'bg-stone-100 text-stone-700' };
    }
  };

  const formatLastLogin = (dateStr) => {
    if (!dateStr) return 'Never logged in';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Never logged in';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'STALL_ONLY') {
      return u.role === 'STALL_MANAGER' || u.role === 'STALL_CASHIER';
    }
    if (roleFilter === 'STALL_MANAGER') return u.role === 'STALL_MANAGER';
    if (roleFilter === 'STALL_CASHIER') return u.role === 'STALL_CASHIER';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-2xs">
        <div>
          <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#722F37]" />
            <span>Stall Staff & Roles Management</span>
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5">
            Manage credentials, assigned stall locations, account statuses, and issue single-use password reset links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-2.5 py-2 text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#722F37] cursor-pointer"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="STALL_ONLY">Stall Staff Only</option>
            <option value="STALL_MANAGER">Stall Managers</option>
            <option value="STALL_CASHIER">Stall Cashiers</option>
          </select>

          {/* Add Staff Button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff User</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            title="Refresh staff list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs animate-fadeIn ${
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
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="hover:opacity-75 text-stone-400 hover:text-stone-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D9] text-[#7A7167] uppercase font-mono tracking-wider text-[11px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Stalls</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D9]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#722F37]" />
                    <span>Loading staff records...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-stone-500">
                    No staff accounts found matching filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const isResetting = resettingId === u.id;
                  const isToggling = togglingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#FCFAF7] transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 leading-snug">
                          {u.name || 'Staff User'}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Assigned Stalls */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="flex items-center gap-1.5" title={getLocationNames(u.assignedLocationIds)}>
                          <MapPin className="w-3.5 h-3.5 text-[#722F37] shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {getLocationNames(u.assignedLocationIds)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          />
                          <span>{u.isActive ? 'ACTIVE' : 'DEACTIVATED'}</span>
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{formatLastLogin(u.lastLoginAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Send Reset Link Action */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleSendResetLink(u)}
                              disabled={isResetting || !u.isActive}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#722F37] bg-[#722F37]/10 hover:bg-[#722F37]/20 border border-[#722F37]/20 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title={
                                !u.isActive
                                  ? 'Reactivate account before sending reset link'
                                  : 'Issue single-use password reset link'
                              }
                            >
                              <KeyRound className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                              <span>{isResetting ? 'Issuing...' : 'Send Reset Link'}</span>
                            </button>
                          )}

                          {/* Toggle Active / Deactivate */}
                          {isSuperAdmin && u.id !== admin?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={isToggling}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
                                u.isActive
                                  ? 'text-rose-700 hover:bg-rose-50 border-rose-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                              }`}
                              title={u.isActive ? 'Disable account access' : 'Restore account access'}
                            >
                              {u.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              <span>{u.isActive ? 'Disable' : 'Activate'}</span>
                            </button>
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

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E0D5] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#722F37]" />

            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
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

            <form onSubmit={handleCreateStaffSubmit} className="p-5 space-y-3.5 text-xs">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Staff Email / Username *
                </label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="staff@amoga.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Initial Password (min. 6 characters) *
                </label>
                <PasswordInput
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Set initial password"
                  autoComplete="new-password"
                  className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Staff Role *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                >
                  <option value="STALL_CASHIER">Stall Cashier (POS Terminal Operator)</option>
                  <option value="STALL_MANAGER">Stall Manager (POS + Stock Transfers)</option>
                  <option value="CATALOGUE_MANAGER">Catalogue Manager</option>
                  <option value="ORDER_MANAGER">Order Manager</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Assigned Stall Locations (Optional)
                </label>
                <p className="text-[10px] text-stone-500 mb-2">
                  Select physical stalls this staff member is authorized to bill at. Leave unselected for all stalls.
                </p>
                <div className="max-h-28 overflow-y-auto border border-stone-200 rounded-lg p-2 space-y-1.5 bg-stone-50">
                  {locations.filter((l) => l.type === 'STALL').map((loc) => {
                    const isChecked = newStaffLocations.includes(loc.id);
                    return (
                      <label key={loc.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStaffLocations([...newStaffLocations, loc.id]);
                            } else {
                              setNewStaffLocations(newStaffLocations.filter((id) => id !== loc.id));
                            }
                          }}
                          className="rounded text-[#722F37] focus:ring-[#722F37]"
                        />
                        <span className="text-xs text-stone-800">{loc.name}</span>
                      </label>
                    );
                  })}
                  {locations.filter((l) => l.type === 'STALL').length === 0 && (
                    <span className="text-[11px] text-stone-400 italic">No stall locations defined yet.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
    </div>
  );
}
