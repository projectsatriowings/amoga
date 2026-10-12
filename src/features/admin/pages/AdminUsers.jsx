import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminUsers() {
  const { adminFetch, admin } = useAdminStore();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(Boolean(modalOpen));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen && !submitting) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, submitting]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CATALOGUE_MANAGER',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load staff list');
      setUsers(json.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (userId) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/toggle`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update user');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create user');

      setModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'CATALOGUE_MANAGER' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'bg-[#722F37] text-white';
      case 'CATALOGUE_MANAGER':
        return 'bg-[#287A25]/15 text-[#1B5219] border border-[#287A25]/30';
      case 'ORDER_MANAGER':
        return 'bg-[#8C6320]/15 text-[#5C4010] border border-[#8C6320]/30';
      case 'CONTENT_MANAGER':
        return 'bg-[#5B3E6E]/15 text-[#3D284B] border border-[#5B3E6E]/30';
      default:
        return 'bg-stone-200 text-stone-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Staff & Role-Based Access Control</h1>
          <p className="text-xs text-[#7A7167]">
            Authorized internal administrators, operational leads, and credential management
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading staff directory...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Staff Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {users.slice((page - 1) * 10, page * 10).map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#1A1817]">
                      {u.name}
                      {u.id === admin?.id && (
                        <span className="ml-2 text-[10px] text-[#722F37] font-mono">(Current User)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#5C544C]">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#7A7167] font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.id !== admin?.id && (
                        <button
                          onClick={() => handleToggle(u.id)}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(users.length / 10) || 1}
          totalItems={users.length}
          pageSize={10}
          onPageChange={setPage}
          itemName="staff members"
        />
      </div>

      {/* Add Staff Member Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl text-xs overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">Enroll Staff Administrator</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Staff Email *</label>
                <input
                  type="email"
                  required
                  placeholder="radhika@amoga.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] uppercase mb-1">Assigned Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded"
                >
                  <option value="CATALOGUE_MANAGER">Catalogue Manager (Products, Collections, Stock)</option>
                  <option value="ORDER_MANAGER">Order Manager (Orders, Fulfilment, Payments, Clients)</option>
                  <option value="CONTENT_MANAGER">Content Manager (Banners, CMS, Promotions)</option>
                  <option value="SUPER_ADMIN">Super Admin (Unrestricted System Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
                >
                  {submitting ? 'Creating...' : 'Enroll Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
