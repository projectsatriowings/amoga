import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  UserCheck,
  Send,
  Layers,
  FileText,
  History,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminCustomerInquiries() {
  const { adminFetch, admin } = useAdminStore();
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({ totalAllTime: 0, newCount: 0, inProgressCount: 0, resolvedCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [collectionFilter, setCollectionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Live auto-search debounce: start filtering automatically as the user types
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Staff Users for Assignment
  const [staffUsers, setStaffUsers] = useState([]);

  // Selected Inquiry Drawer / Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryHistory, setInquiryHistory] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [transitioningStatus, setTransitioningStatus] = useState(false);

  // Lock body scroll when drawer/modal is open
  useBodyScrollLock(Boolean(selectedInquiry));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedInquiry) {
        setSelectedInquiry(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInquiry]);

  const fetchInquiries = async (query = debouncedSearchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: statusFilter,
        collectionId: collectionFilter,
        sort: 'desc',
      });

      if (query && query.trim()) params.append('search', query.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await adminFetch(`/api/admin/inquiries?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load inquiries');

      // Always sort by most recent inquiry date first
      const recentInquiries = [...(json.inquiries || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setInquiries(recentInquiries);
      setStats(json.stats || { totalAllTime: 0, newCount: 0, inProgressCount: 0, resolvedCount: 0 });
      setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      const json = await res.json();
      if (res.ok && json.users) {
        setStaffUsers(json.users);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchInquiries(debouncedSearchQuery);
  }, [page, statusFilter, collectionFilter, startDate, endDate, debouncedSearchQuery]);

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const openInquiryDetail = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setInternalNotesInput(inquiry.internalNotes || '');
    setLoadingDetail(true);
    try {
      const res = await adminFetch(`/api/admin/inquiries/${inquiry.id}`);
      const json = await res.json();
      if (res.ok && json.inquiry) {
        setSelectedInquiry(json.inquiry);
        setInquiryHistory(json.history || []);
        setInternalNotesInput(json.inquiry.internalNotes || '');
      }
    } catch {
      // Non-blocking fallback to current item
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    setTransitioningStatus(true);
    try {
      const res = await adminFetch(`/api/admin/inquiries/${selectedInquiry.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update status');

      setSelectedInquiry(json.inquiry);
      fetchInquiries();

      // Refresh history
      const histRes = await adminFetch(`/api/admin/inquiries/${selectedInquiry.id}`);
      const histJson = await histRes.json();
      if (histRes.ok && histJson.history) {
        setInquiryHistory(histJson.history);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setTransitioningStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const res = await adminFetch(`/api/admin/inquiries/${selectedInquiry.id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes: internalNotesInput }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save notes');

      setSelectedInquiry(json.inquiry);
      alert('Internal concierge notes saved successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssignStaff = async (staffId) => {
    if (!selectedInquiry) return;
    const staff = staffUsers.find((u) => u.id === staffId);
    try {
      const res = await adminFetch(`/api/admin/inquiries/${selectedInquiry.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignedAdminId: staff ? staff.id : null,
          assignedAdminEmail: staff ? staff.email : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to assign inquiry');

      setSelectedInquiry(json.inquiry);
      fetchInquiries();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return { label: 'New Inquiry', class: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', class: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'RESOLVED':
        return { label: 'Resolved', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: status, class: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Customer Inquiries & Concierge</h1>
          <p className="text-xs text-[#7A7167]">
            Direct customer communications from public storefront contact touchpoints, bespoke sizing queries, and atelier requests
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="p-2 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] transition-colors w-fit flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Inquiries"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Overview Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">All Time Recorded</span>
          <div className="text-2xl font-sans font-bold text-[#1A1817] mt-1 tabular-nums">
            {stats.totalAllTime}
          </div>
          <span className="text-[10px] text-[#7A7167] mt-0.5 block">Storefront enquiries</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-rose-200 bg-rose-50/30">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800">New / Unattended</span>
          <div className="text-2xl font-sans font-bold text-rose-900 mt-1 tabular-nums">
            {stats.newCount}
          </div>
          <span className="text-[10px] text-rose-700 mt-0.5 block">Pending first response</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-amber-200 bg-amber-50/30">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800">In Progress</span>
          <div className="text-2xl font-sans font-bold text-amber-900 mt-1 tabular-nums">
            {stats.inProgressCount}
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Active concierge follow-up</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800">Resolved</span>
          <div className="text-2xl font-sans font-bold text-emerald-900 mt-1 tabular-nums">
            {stats.resolvedCount}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Successfully closed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7167]" />
          <input
            type="text"
            placeholder="Search reference, customer name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchInquiries(searchQuery);
            }}
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A7167] hover:text-[#1A1817] cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-lg border border-[#E5E0D5] text-[11px] font-medium overflow-x-auto">
          {['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white text-[#722F37] font-semibold shadow-2xs'
                  : 'text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              {tab === 'IN_PROGRESS' ? 'In Progress' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Collection Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A7167] text-[11px]">Collection:</span>
          <select
            value={collectionFilter}
            onChange={(e) => {
              setCollectionFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="food">Wholesome Pantry</option>
            <option value="tea">Wellness Tea</option>
            <option value="sarees">Heritage Sarees</option>
            <option value="jewellery">Silver Jewellery</option>
            <option value="general">General Inquiry</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-[#FBF9F5] rounded-xl border border-[#E5E0D5] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Retrieving customer inquiries...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50 border border-rose-200">{error}</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <MessageSquare className="w-8 h-8 text-[#A89F93] mx-auto mb-2 opacity-50" />
            <span>No customer inquiries found matching the active criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Reference & Date</th>
                  <th className="px-5 py-3">Customer Contact</th>
                  <th className="px-5 py-3">Category & Subject</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Lead</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {inquiries.map((inq) => {
                  const statusBadge = getStatusBadge(inq.status);
                  return (
                    <tr key={inq.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-mono font-bold text-[#1A1817]">{inq.reference}</div>
                        <div className="text-[10px] font-mono text-[#7A7167]">
                          {new Date(inq.createdAt).toLocaleDateString()}{' '}
                          {new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-semibold text-[#1A1817]">{inq.fullName}</div>
                        <div className="text-[11px] font-mono text-[#7A7167] truncate max-w-[200px]">
                          {inq.email}
                        </div>
                        {inq.phone && (
                          <div className="text-[10px] font-mono text-[#8C8377]">{inq.phone}</div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-medium text-[#1A1817] truncate max-w-xs">{inq.subject}</div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200 mt-0.5">
                          {inq.collectionId || 'General'}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="px-5 py-3 font-mono text-[11px] text-[#5C544C]">
                        {inq.assignedAdminEmail || <span className="text-[#8C8377] italic">Unassigned</span>}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openInquiryDetail(inq)}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#722F37]/10 text-[#722F37] hover:bg-[#722F37] hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={12}
          onPageChange={(p) => setPage(p)}
          itemName="customer inquiries"
        />
      </div>

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !transitioningStatus && !savingNotes) {
              setSelectedInquiry(null);
            }
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
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E5E0D5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#722F37]">
                    {selectedInquiry.reference}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(selectedInquiry.status).class}`}>
                    {getStatusBadge(selectedInquiry.status).label}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                    {selectedInquiry.collectionId || 'General'}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-[#1A1817] mt-1">
                  {selectedInquiry.subject}
                </h2>
                <div className="text-[11px] font-mono text-[#7A7167]">
                  Submitted on {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-[#7A7167] hover:text-[#1A1817] hover:bg-stone-200/60 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-[#E5E0D5] text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] block">Customer Name</span>
                <div className="font-semibold text-[#1A1817] mt-0.5">{selectedInquiry.fullName}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] block">Email</span>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: [${selectedInquiry.reference}] ${encodeURIComponent(selectedInquiry.subject)}`}
                  className="font-mono text-[#722F37] hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{selectedInquiry.email}</span>
                </a>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] block">Phone Number</span>
                {selectedInquiry.phone ? (
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="font-mono text-[#722F37] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedInquiry.phone}</span>
                  </a>
                ) : (
                  <span className="text-[#8C8377] font-mono mt-0.5 block">—</span>
                )}
              </div>
            </div>

            {/* Verbatim Message Body */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] font-semibold">
                Original Customer Message
              </span>
              <div className="p-4 bg-white rounded-xl border border-[#E5E0D5] whitespace-pre-wrap leading-relaxed text-[#1A1817] font-sans">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Workflow Transition Actions & Assignment */}
            <div className="p-4 bg-[#F5F2EB] rounded-xl border border-[#E5E0D5] space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#4A423B] font-semibold block mb-1">
                    Workflow Status Transition
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedInquiry.status !== 'NEW' && (
                      <button
                        type="button"
                        disabled={transitioningStatus}
                        onClick={() => handleStatusChange('NEW')}
                        className="px-2.5 py-1 rounded bg-white border border-[#D5CEC2] text-[#4A423B] hover:bg-stone-50 font-medium"
                      >
                        Reopen (New)
                      </button>
                    )}
                    {selectedInquiry.status !== 'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={transitioningStatus}
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 font-semibold shadow-2xs"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {selectedInquiry.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        disabled={transitioningStatus}
                        onClick={() => handleStatusChange('RESOLVED')}
                        className="px-3 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 font-semibold shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Inquiry</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Staff Assignment */}
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#4A423B] font-semibold block mb-1">
                    Assign Staff Lead
                  </span>
                  <select
                    value={selectedInquiry.assignedAdminId || ''}
                    onChange={(e) => handleAssignStaff(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
                  >
                    <option value="">Unassigned</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Internal Concierge Notes */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#722F37]" />
                <span>Internal Concierge Notes (Staff Eyes Only)</span>
              </span>
              <textarea
                rows={3}
                placeholder="Add confidential client preferences, phone conversation logs, or fulfillment instructions..."
                value={internalNotesInput}
                onChange={(e) => setInternalNotesInput(e.target.value)}
                className="w-full p-3 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-[#1E1916] text-white rounded text-xs font-medium hover:bg-[#2C2520] transition-colors"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Audit Trail for this specific inquiry */}
            {inquiryHistory.length > 0 && (
              <div className="pt-3 border-t border-[#E5E0D5] space-y-2 text-xs">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] font-semibold flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#8C6320]" />
                  <span>Audit Trail & Activity Log</span>
                </span>
                <div className="divide-y divide-[#EAE4D9] bg-white rounded-xl border border-[#E5E0D5] max-h-36 overflow-y-auto">
                  {inquiryHistory.map((h) => (
                    <div key={h.id} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-semibold text-[#1A1817] mr-2">{h.action}</span>
                        <span className="text-[#7A7167]">{h.adminEmail}</span>
                      </div>
                      <span className="font-mono text-[#8C8377] text-[10px]">
                        {new Date(h.createdAt).toLocaleTimeString()} • {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
