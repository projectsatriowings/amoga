import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, ChevronLeft, ChevronRight, X, Mail, Phone } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminAuditLogs() {
  const { adminFetch } = useAdminStore();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [entityType, setEntityType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
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
    if (act.includes('INQUIRY')) return 'bg-amber-50 text-amber-900 border-amber-300';
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
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Append-Only Forensic Audit Trail</h1>
          <p className="text-xs text-[#7A7167]">
            Immutable record of all administrative actions, stock movements, order transitions, customer inquiries, and system changes
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
            <option value="ContactInquiry">Customer Inquiries</option>
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
                          onClick={() => {
                            setExpandedLog(expandedLog?.id === log.id ? null : log);
                            setShowRawJson(false);
                          }}
                          className="px-2.5 py-1 text-xs font-mono font-medium text-[#722F37] hover:underline hover:bg-[#722F37]/8 rounded transition-colors"
                        >
                          {expandedLog?.id === log.id
                            ? 'Close'
                            : log.action === 'CUSTOMER_INQUIRY' || log.entityType === 'ContactInquiry'
                            ? 'View Inquiry'
                            : 'View Details'}
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
        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
          itemName="audit events"
        />
      </div>

      {/* Payload / Formatted Details Modal */}
      {expandedLog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedLog(null);
          }}
        >
          <div className="bg-[#1C1815] text-[#EAE4DC] border border-[#3E362F] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#383029] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest font-mono text-[#C5A46D] font-semibold">
                    {expandedLog.action === 'CUSTOMER_INQUIRY' ? 'Customer Inquiry' : expandedLog.action}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2D2520] border border-[#483B32] text-[#C5A46D]">
                    {expandedLog.entityId || expandedLog.details?.inquiryReference || 'Audit Record'}
                  </span>
                </div>
                <h2 className="text-lg font-serif font-semibold text-[#F7F3EB] mt-1">
                  {expandedLog.action === 'CUSTOMER_INQUIRY'
                    ? (expandedLog.details?.subject || 'Inquiry Details')
                    : `Entity: ${expandedLog.entityType}`}
                </h2>
              </div>
              <button
                onClick={() => setExpandedLog(null)}
                className="p-1.5 rounded-lg text-[#9E9487] hover:text-white hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inquiry Content Format */}
            {expandedLog.action === 'CUSTOMER_INQUIRY' || expandedLog.entityType === 'ContactInquiry' ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Customer Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#25201C] border border-[#383029]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93] block mb-0.5">
                      Customer Name
                    </span>
                    <div className="text-sm font-semibold text-[#F7F3EB]">
                      {expandedLog.details?.fullName || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93] block mb-0.5">
                      Target Collection
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#362D24] text-[#D9BB85] border border-[#524436] capitalize">
                      {expandedLog.details?.collectionId || 'General'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93] block mb-0.5">
                      Email Address
                    </span>
                    {expandedLog.details?.email ? (
                      <a
                        href={`mailto:${expandedLog.details.email}`}
                        className="text-xs text-[#C5A46D] hover:underline flex items-center gap-1 font-mono break-all"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{expandedLog.details.email}</span>
                      </a>
                    ) : (
                      <span className="text-[#8C8377] font-mono">Not provided</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93] block mb-0.5">
                      Phone Number
                    </span>
                    {expandedLog.details?.phone ? (
                      <a
                        href={`tel:${expandedLog.details.phone}`}
                        className="text-xs text-[#C5A46D] hover:underline flex items-center gap-1 font-mono"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{expandedLog.details.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[#8C8377] font-mono">Not provided</span>
                    )}
                  </div>
                </div>

                {/* Subject & Message Box */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93] block">
                    Customer Message
                  </span>
                  <div className="p-4 rounded-xl bg-[#13100E] border border-[#383029] space-y-2">
                    {expandedLog.details?.subject && (
                      <div className="text-xs font-semibold text-[#D9BB85] pb-2 border-b border-[#2C241D] flex items-center gap-1.5">
                        <span className="text-[#8C8377] font-normal uppercase text-[10px]">Subject:</span>
                        <span>{expandedLog.details.subject}</span>
                      </div>
                    )}
                    <p className="text-sm text-[#F7F3EB] whitespace-pre-wrap leading-relaxed font-sans">
                      {expandedLog.details?.message || 'No message content.'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#383029]">
                  <div className="flex items-center gap-2">
                    {expandedLog.details?.email && (
                      <a
                        href={`mailto:${expandedLog.details.email}?subject=Re: ${encodeURIComponent(expandedLog.details?.subject || 'Amoga Inquiry')}`}
                        className="px-3 py-1.5 rounded-lg bg-[#C5A46D] text-[#1E1916] hover:bg-[#D9BB85] font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply via Email</span>
                      </a>
                    )}
                    {expandedLog.details?.phone && (
                      <a
                        href={`tel:${expandedLog.details.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-[#2D2520] hover:bg-[#3D332B] text-[#EAE4DC] border border-[#483B32] text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-[11px] font-mono text-[#9E9487] hover:text-[#C5A46D] underline underline-offset-4 cursor-pointer"
                  >
                    {showRawJson ? 'Hide Technical Data' : 'View Raw JSON'}
                  </button>
                </div>

                {/* Collapsible Raw JSON */}
                {showRawJson && (
                  <div className="pt-2">
                    <pre className="p-3 bg-[#120F0D] rounded-lg border border-[#2C2520] overflow-x-auto text-[11px] text-emerald-400 max-h-48 font-mono">
                      {JSON.stringify(expandedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Other Audit Logs Content */
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#A89F93]">
                    Recorded Details
                  </span>
                  {typeof expandedLog.details === 'object' && expandedLog.details !== null ? (
                    <div className="p-3.5 rounded-xl bg-[#25201C] border border-[#383029] space-y-2 text-xs font-sans">
                      {Object.entries(expandedLog.details).map(([key, val]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 py-1 border-b border-[#332A22] last:border-0">
                          <span className="font-mono text-[11px] text-[#A89F93]">{key}:</span>
                          <span className="text-right text-[#F7F3EB] font-mono text-[11px] break-all max-w-sm">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[#120F0D] text-xs font-mono text-[#F7F3EB]">
                      {String(expandedLog.details)}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-[11px] font-mono text-[#9E9487] hover:text-[#C5A46D] underline underline-offset-4 cursor-pointer"
                  >
                    {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
                  </button>
                </div>

                {showRawJson && (
                  <pre className="p-3 bg-[#120F0D] rounded-lg border border-[#2C2520] overflow-x-auto text-[11px] text-emerald-400 max-h-48 font-mono">
                    {JSON.stringify(expandedLog.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Footer Metadata */}
            <div className="pt-3 border-t border-[#383029] flex items-center justify-between text-[10px] font-mono text-[#8C8377]">
              <span>Submitted: {new Date(expandedLog.createdAt).toLocaleString()}</span>
              <span>IP: {expandedLog.details?.ip || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
