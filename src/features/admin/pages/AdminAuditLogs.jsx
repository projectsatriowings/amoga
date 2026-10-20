import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Filter,
  Search,
  Calendar,
  X,
  History,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminAuditLogs() {
  const { adminFetch } = useAdminStore();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    failedActions: 0,
    highImpactActions: 0,
    activeStaffActors: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Query State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SUCCESS, FAILURE
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Live auto-search: start filtering automatically as the user types
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Selected Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Lock body scroll when detail modal is open
  useBodyScrollLock(Boolean(selectedLog));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog]);

  const fetchLogs = async (query = debouncedSearchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        entityType: entityFilter,
        action: actionFilter,
        status: statusFilter,
        sort: sortOrder,
      });

      if (query && query.trim()) params.append('search', query.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load audit logs');

      setLogs(json.logs || []);
      setStats(json.stats || { totalEvents: 0, failedActions: 0, highImpactActions: 0, activeStaffActors: 0 });
      setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(debouncedSearchQuery);
  }, [page, entityFilter, actionFilter, statusFilter, sortOrder, startDate, endDate, debouncedSearchQuery]);

  const handleCopyJson = (data) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getActionCategory = (action) => {
    if (action.includes('PRODUCT') || action.includes('STOCK')) return 'Catalogue & Stock';
    if (action.includes('ORDER') || action.includes('PAYMENT')) return 'Commerce & Sales';
    if (action.includes('COLLECTION') || action.includes('BANNER')) return 'Storefront CMS';
    if (action.includes('COUPON') || action.includes('PROMOTION')) return 'Marketing & Incentives';
    if (action.includes('SETTINGS') || action.includes('USER') || action.includes('ADMIN')) return 'System & Governance';
    if (action.includes('INQUIRY') || action.includes('CONTACT')) return 'Customer Concierge';
    return 'General Action';
  };

  const getActionBadge = (action, status) => {
    if (status === 'FAILURE') {
      return { label: action, badgeClass: 'bg-rose-50 text-rose-800 border-rose-300' };
    }
    if (action.includes('DELETE') || action.includes('DEACTIVATE') || action.includes('CANCEL') || action.includes('ARCHIVE')) {
      return { label: action, badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
    if (action.includes('CREATE') || action.includes('RESTORE')) {
      return { label: action, badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (action.includes('UPDATE') || action.includes('ADJUST') || action.includes('STATUS')) {
      return { label: action, badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
    return { label: action, badgeClass: 'bg-stone-50 text-stone-700 border-stone-200' };
  };

  // Helper to extract field changes diff from recorded audit details
  const extractFieldChanges = (details) => {
    if (!details || typeof details !== 'object') return null;

    // Direct changes object recorded (e.g. settings or product updates)
    if (details.changes && typeof details.changes === 'object') {
      return Object.entries(details.changes).map(([field, diff]) => ({
        field,
        previous: diff.previous !== undefined ? diff.previous : '—',
        current: diff.current !== undefined ? diff.current : '—',
      }));
    }

    // Previous vs new objects recorded
    if (details.previousValues && details.newValues && typeof details.previousValues === 'object' && typeof details.newValues === 'object') {
      const keys = Array.from(new Set([...Object.keys(details.previousValues), ...Object.keys(details.newValues)]));
      const diffs = [];
      for (const key of keys) {
        if (JSON.stringify(details.previousValues[key]) !== JSON.stringify(details.newValues[key])) {
          diffs.push({
            field: key,
            previous: details.previousValues[key] !== undefined ? details.previousValues[key] : '—',
            current: details.newValues[key] !== undefined ? details.newValues[key] : '—',
          });
        }
      }
      return diffs.length > 0 ? diffs : null;
    }

    // Specific stock adjust action format
    if (details.previousStock !== undefined && details.adjustedStock !== undefined) {
      return [
        {
          field: 'Stock Quantity',
          previous: details.previousStock,
          current: details.adjustedStock,
        },
      ];
    }

    // Specific order status change format
    if (details.previousStatus !== undefined && details.newStatus !== undefined) {
      return [
        {
          field: 'Order Status',
          previous: details.previousStatus,
          current: details.newStatus,
        },
      ];
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Append-Only Forensic Audit Trail</h1>
          <p className="text-xs text-[#7A7167]">
            Immutable chronological ledger tracking administrative activity, stock adjustments, order state changes, and system settings
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] transition-colors w-fit flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Audit Records"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Real Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">Total Recorded Events</span>
          <div className="text-2xl font-sans font-bold text-[#1A1817] mt-1 tabular-nums">
            {stats.totalEvents}
          </div>
          <span className="text-[10px] text-[#7A7167] mt-0.5 block">Forensic ledger entries</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-amber-200 bg-amber-50/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800">High-Impact Operations</span>
          <div className="text-2xl font-sans font-bold text-amber-900 mt-1 tabular-nums">
            {stats.highImpactActions}
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Price, stock & status shifts</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-rose-200 bg-rose-50/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800">Failed / Denied Attempts</span>
          <div className="text-2xl font-sans font-bold text-rose-900 mt-1 tabular-nums">
            {stats.failedActions}
          </div>
          <span className="text-[10px] text-rose-700 mt-0.5 block">Security & validation halts</span>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">Active Staff Actors</span>
          <div className="text-2xl font-sans font-bold text-[#1A1817] mt-1 tabular-nums">
            {stats.activeStaffActors}
          </div>
          <span className="text-[10px] text-[#7A7167] mt-0.5 block">Authorized atelier identities</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7167]" />
          <input
            type="text"
            placeholder="Search email, action, entity, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchLogs(searchQuery);
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

        {/* Entity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A7167] text-[11px]">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
          >
            <option value="ALL">All Entities</option>
            <option value="Product">Products</option>
            <option value="Collection">Collections</option>
            <option value="Order">Orders</option>
            <option value="StoreSetting">Store Settings</option>
            <option value="AdminUser">Staff Users</option>
            <option value="CustomerInquiry">Customer Inquiries</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A7167] text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILURE">Failed / Denied</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A7167] text-[11px]">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#FBF9F5] rounded-xl border border-[#E5E0D5] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Scanning forensic audit records...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50 border border-rose-200">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <History className="w-8 h-8 text-[#A89F93] mx-auto mb-2 opacity-50" />
            <span>No audit events match your active search or filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Timestamp (UTC / Local)</th>
                  <th className="px-5 py-3">Staff Actor</th>
                  <th className="px-5 py-3">Action & Category</th>
                  <th className="px-5 py-3">Entity Reference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action, log.status);
                  const category = getActionCategory(log.action);
                  const isFailed = log.status === 'FAILURE';

                  return (
                    <tr key={log.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-mono text-[#1A1817] font-semibold">
                          {new Date(log.createdAt).toLocaleDateString()}{' '}
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] font-mono text-[#7A7167]">
                          {new Date(log.createdAt).toISOString()}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-mono font-medium text-[#1A1817] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#7A7167]" />
                          <span>{log.adminEmail}</span>
                        </div>
                        {log.adminId && (
                          <div className="text-[10px] font-mono text-[#8C8377] truncate max-w-[180px]">
                            ID: {log.adminId.slice(0, 8)}...
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                        <div className="text-[10px] font-sans text-[#7A7167] mt-0.5">{category}</div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-semibold text-[#1A1817]">{log.entityType}</div>
                        <div className="text-[11px] font-mono text-[#5C544C] truncate max-w-[160px]">
                          {log.entityId || <span className="text-[#8C8377] italic">N/A</span>}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isFailed
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isFailed ? 'FAILED' : 'SUCCESS'}
                        </span>
                        {log.failureReason && (
                          <div className="text-[10px] text-rose-700 truncate max-w-[140px] mt-0.5">
                            {log.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowRawJson(false);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#722F37]/10 text-[#722F37] hover:bg-[#722F37] hover:text-white transition-colors"
                        >
                          Investigate
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
          pageSize={15}
          onPageChange={(p) => setPage(p)}
          itemName="audit records"
        />
      </div>

      {/* Investigation Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
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
                    {selectedLog.action}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      selectedLog.status === 'FAILURE'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {selectedLog.status === 'FAILURE' ? 'Action Failed' : 'Action Succeeded'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                    {getActionCategory(selectedLog.action)}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-[#1A1817] mt-1">
                  Entity: {selectedLog.entityType} ({selectedLog.entityId || 'No identifier'})
                </h2>
                <div className="text-[11px] font-mono text-[#7A7167]">
                  Record ID: {selectedLog.id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-[#7A7167] hover:text-[#1A1817] hover:bg-stone-200/60 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-[#E5E0D5] text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] block">
                  Staff Actor
                </span>
                <div className="font-mono font-semibold text-[#1A1817] mt-0.5">{selectedLog.adminEmail}</div>
                {selectedLog.adminId && (
                  <span className="text-[10px] font-mono text-[#8C8377] block mt-0.5">
                    User UUID: {selectedLog.adminId}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] block">
                  Timestamp (Timezone)
                </span>
                <div className="font-mono text-[#1A1817] mt-0.5">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </div>
                <span className="text-[10px] font-mono text-[#8C8377] block mt-0.5">
                  UTC ISO: {new Date(selectedLog.createdAt).toISOString()}
                </span>
              </div>
            </div>

            {/* Failure Reason Alert if recorded */}
            {selectedLog.failureReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Failure / Denial Reason Recorded:</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed">{selectedLog.failureReason}</p>
              </div>
            )}

            {/* Field-by-Field Change Diff Summary */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7167] font-semibold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#722F37]" />
                <span>Field-by-Field Change Summary</span>
              </span>

              {(() => {
                const diffs = extractFieldChanges(selectedLog.details);
                if (diffs && diffs.length > 0) {
                  return (
                    <div className="bg-white rounded-xl border border-[#E5E0D5] divide-y divide-[#EAE4D9] overflow-hidden">
                      <div className="grid grid-cols-3 p-2.5 bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">
                        <span>Field</span>
                        <span>Previous Value</span>
                        <span>New Value</span>
                      </div>
                      {diffs.map((d, idx) => (
                        <div key={idx} className="grid grid-cols-3 p-2.5 items-center text-xs">
                          <span className="font-semibold font-mono text-[#1A1817] truncate">{d.field}</span>
                          <span className="text-rose-700 font-mono text-[11px] truncate pr-2">
                            {typeof d.previous === 'object' ? JSON.stringify(d.previous) : String(d.previous)}
                          </span>
                          <span className="text-emerald-700 font-mono text-[11px] font-semibold truncate pr-2">
                            {typeof d.current === 'object' ? JSON.stringify(d.current) : String(d.current)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="p-4 bg-white rounded-xl border border-[#E5E0D5] text-xs text-[#7A7167] text-center italic">
                    Change details were not recorded for this event.
                  </div>
                );
              })()}
            </div>

            {/* Collapsible Raw Technical JSON */}
            <div className="pt-2 border-t border-[#E5E0D5]">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs font-semibold text-[#4A423B] hover:text-[#722F37] flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-[#8C6320]" />
                  <span>{showRawJson ? 'Hide Technical Metadata' : 'View Sanitized Technical Data (JSON)'}</span>
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRawJson && (
                  <button
                    type="button"
                    onClick={() => handleCopyJson(selectedLog.details)}
                    className="px-2.5 py-1 text-[11px] font-mono text-[#4A423B] hover:text-[#1A1817] border border-[#D5CEC2] rounded bg-white flex items-center gap-1 transition-colors"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                )}
              </div>

              {showRawJson && (
                <div className="mt-2.5 space-y-1">
                  <pre className="p-3.5 bg-[#1C1815] text-emerald-400 font-mono text-[11px] rounded-xl border border-[#3E362F] overflow-x-auto max-h-56 leading-relaxed">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                  <span className="text-[10px] text-[#7A7167] font-mono block italic">
                    Secrets, passwords, access tokens, and payment credentials are automatically redacted server-side.
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-[10px] font-mono text-[#7A7167]">
              <span>Audit Storage: Neon PostgreSQL append-only model</span>
              <span>Client IP: {selectedLog.details?.ip || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
