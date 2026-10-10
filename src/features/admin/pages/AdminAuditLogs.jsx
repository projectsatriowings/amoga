import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminAuditLogs() {
  const { adminFetch } = useAdminStore();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [entityType, setEntityType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        entityType,
      });

      const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load audit logs');
      setLogs(json.logs);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityType]);

  const getActionBadge = (act) => {
    if (act.includes('CREATE')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (act.includes('DELETE') || act.includes('DEACTIVATE') || act.includes('SUSPEND') || act.includes('ARCHIVE')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (act.includes('ADJUST') || act.includes('UPDATE') || act.includes('STATUS')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-stone-50 text-stone-800 border-stone-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Append-Only Forensic Audit Trail</h1>
          <p className="text-xs text-[#7A7167]">
            Immutable record of all administrative actions, stock movements, order transitions, and system changes
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] w-fit"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#E5E0D5] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-[#8C8377]" />
          <span className="font-medium text-[#4A423B]">Filter Entity:</span>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 bg-white border border-[#D5CEC2] rounded text-xs"
          >
            <option value="ALL">All Entities</option>
            <option value="Product">Products</option>
            <option value="Order">Orders</option>
            <option value="Collection">Collections</option>
            <option value="Banner">Banners</option>
            <option value="Coupon">Coupons</option>
            <option value="StoreSetting">Store Settings</option>
            <option value="AdminUser">Staff Users</option>
          </select>
        </div>

        <span className="text-[11px] font-mono text-[#7A7167]">
          Total entries recorded: {pagination.total}
        </span>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading audit history...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Staff Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Type</th>
                  <th className="px-5 py-3">Entity Reference</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-[#7A7167]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-[#1A1817]">
                      {log.adminEmail}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#5C544C] font-mono">
                      {log.entityType}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#5C544C]">
                      {log.entityId || 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setExpandedLog(expandedLog?.id === log.id ? null : log)}
                          className="px-2 py-1 text-[11px] font-mono text-[#722F37] hover:underline"
                        >
                          {expandedLog?.id === log.id ? 'Close' : 'View Payload'}
                        </button>
                      ) : (
                        <span className="text-[#8C8377]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#7A7167]">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {expandedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1916] text-[#E8E2D8] border border-[#38312B] rounded-lg max-w-lg w-full p-5 space-y-3 shadow-xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-[#38312B] pb-2">
              <span className="text-[#C5A46D] font-bold">Action Details: {expandedLog.action}</span>
              <button onClick={() => setExpandedLog(null)} className="text-[#A89F93] hover:text-white">
                ✕
              </button>
            </div>
            <pre className="p-3 bg-[#120F0D] rounded border border-[#2C2520] overflow-x-auto text-[11px] text-emerald-400 max-h-64">
              {JSON.stringify(expandedLog.details, null, 2)}
            </pre>
            <p className="text-[10px] text-[#A89F93]">
              Recorded at: {new Date(expandedLog.createdAt).toISOString()} by {expandedLog.adminEmail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
