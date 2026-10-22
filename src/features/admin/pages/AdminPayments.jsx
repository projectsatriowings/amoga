import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { GstReportModal } from '../components/GstReportModal';
import { TaxInvoiceDownloadModal } from '../components/TaxInvoiceDownloadModal';

export function AdminPayments() {
  const { adminFetch, token } = useAdminStore();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Download menu & modals
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState(false);
  const [downloadingQuick, setDownloadingQuick] = useState(null);
  const downloadMenuRef = useRef(null);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [provider, setProvider] = useState('ALL');
  const [orderRef, setOrderRef] = useState('');
  const [debouncedOrderRef, setDebouncedOrderRef] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);

  // Webhook Events Audit Modal
  const [showEvents, setShowEvents] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Lock body scroll when any modal is open
  useBodyScrollLock(Boolean(showEvents || showGstModal || showTaxInvoiceModal));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickDownload = async (type) => {
    setDownloadingQuick(type);
    setShowDownloadMenu(false);
    try {
      const endpoint =
        type === 'payments-to-date'
          ? '/api/admin/reports/payments-to-date'
          : '/api/admin/reports/outstanding-payments';
      const defaultFilename =
        type === 'payments-to-date'
          ? `Amoga_Payments_To_Date_${new Date().toISOString().split('T')[0]}.csv`
          : `Amoga_Outstanding_Payments_${new Date().toISOString().split('T')[0]}.csv`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-token': token,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to download report');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setDownloadingQuick(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showEvents) {
        setShowEvents(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEvents]);

  // Live auto-search debounce: start filtering automatically as words are typed
  useEffect(() => {
    if (orderRef !== debouncedOrderRef) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedOrderRef(orderRef);
      setPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [orderRef]);

  const fetchPayments = async (targetPage = page, query = debouncedOrderRef) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '10',
        status,
        provider,
        orderReference: query || '',
        sortBy: 'createdAt',
        order: 'desc',
      });

      const res = await adminFetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load payments');
      // Always sort by most recent record first
      const recentPayments = [...(json.payments || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPayments(recentPayments);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchPayments(page, debouncedOrderRef);
  }, [page, status, provider, debouncedOrderRef]);

  const fetchWebhookEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await adminFetch('/api/admin/payments/events?limit=30');
      const json = await res.json();
      if (json.events) setEvents(json.events);
      setShowEvents(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Payment Transactions</h1>
          <p className="text-xs text-[#7A7167]">
            Real-time verification log for Razorpay and sandbox financial transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Reports & Invoices Menu */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              type="button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E1916] text-white rounded text-xs font-medium hover:bg-[#2C2520] transition-colors cursor-pointer shadow-xs"
              aria-haspopup="true"
              aria-expanded={showDownloadMenu}
            >
              <Download className="w-3.5 h-3.5 text-[#E6C687]" />
              <span>Download</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#D5CEC2] transition-transform duration-200 ${
                  showDownloadMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showDownloadMenu && (
              <div
                className="absolute right-0 mt-1.5 w-60 bg-[#FBF9F5] border border-[#D5CEC2] rounded-lg shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#EAE4D9]">
                  Tax & Financial Exports
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDownloadMenu(false);
                    setShowGstModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-[#1A1817] hover:bg-[#F0EBE1] flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#722F37]" />
                  <div>
                    <div className="font-medium text-[#1A1817]">GST Report</div>
                    <div className="text-[10px] text-[#7A7167]">Monthly return & tax summary</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDownloadMenu(false);
                    setShowTaxInvoiceModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-[#1A1817] hover:bg-[#F0EBE1] flex items-center gap-2.5 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 text-[#8C6320]" />
                  <div>
                    <div className="font-medium text-[#1A1817]">Tax Invoice</div>
                    <div className="text-[10px] text-[#7A7167]">Date-filtered PDF & ZIP batch</div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#EAE4D9]" />

                <button
                  type="button"
                  onClick={() => handleQuickDownload('payments-to-date')}
                  disabled={downloadingQuick !== null}
                  className="w-full px-3 py-2 text-left text-xs text-[#1A1817] hover:bg-[#F0EBE1] flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  role="menuitem"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="font-medium text-[#1A1817]">Payments to Date</div>
                    <div className="text-[10px] text-[#7A7167]">All settled payments (CSV)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDownload('outstanding-payments')}
                  disabled={downloadingQuick !== null}
                  className="w-full px-3 py-2 text-left text-xs text-[#1A1817] hover:bg-[#F0EBE1] flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  role="menuitem"
                >
                  <Clock className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-medium text-[#1A1817]">Outstanding Payments</div>
                    <div className="text-[10px] text-[#7A7167]">Unpaid / pending balances (CSV)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchWebhookEvents}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1]"
          >
            <History className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>Webhook Event Log</span>
          </button>
          <button
            onClick={fetchPayments}
            className="p-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1]"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchPayments(1, orderRef);
          }}
          className="flex-1 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search by order reference in real-time..."
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#8C8377] animate-spin" />
            ) : orderRef ? (
              <button
                type="button"
                onClick={() => {
                  setOrderRef('');
                  setDebouncedOrderRef('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-2 text-[#8C8377] hover:text-[#1A1817]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520] transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="ALL">All Payment States</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CREATED">Created</option>
          </select>

          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="ALL">All Gateways</option>
            <option value="razorpay">Razorpay</option>
            <option value="test">Test Gateway</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading && payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading payment records...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Payment Reference</th>
                  <th className="px-5 py-3">Order Reference</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-[#1A1817]">
                      {p.paymentReference}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#5C544C]">
                      {p.order?.orderReference || p.orderId}
                    </td>
                    <td className="px-5 py-3 font-jakarta font-bold text-[#1A1817] tabular-nums tracking-tight whitespace-nowrap">
                      <span className="text-xs text-[#8C8377] font-normal mr-0.5">₹</span>
                      {p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] uppercase text-[#7A7167]">
                      {p.provider}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          p.status === 'SUCCEEDED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#7A7167] font-mono">
                      {new Date(p.createdAt).toLocaleString()}
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
          itemName="transactions"
        />
      </div>

      {/* Webhook Events Modal */}
      {showEvents && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEvents(false);
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
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col overscroll-contain select-text"
          >
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Webhook Events Ingestion Audit</h3>
                <p className="text-xs text-[#7A7167]">Deduplicated webhook payload ledger from Razorpay</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEvents(false)}
                className="text-xs px-2 py-1 text-[#7A7167] hover:text-[#1A1817] cursor-pointer"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 overscroll-contain">
              {events.length === 0 ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">No webhook events recorded.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[#1A1817]">{ev.eventType}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono">
                        {ev.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#5C544C]">
                      ID: {ev.providerEventId} • Order: {ev.orderReference || 'N/A'}
                    </p>
                    <div className="text-[10px] text-[#8C8377] font-mono pt-1 border-t border-[#F0EBE1]">
                      Received: {new Date(ev.receivedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* GST Monthly Report Modal */}
      <GstReportModal isOpen={showGstModal} onClose={() => setShowGstModal(false)} />

      {/* Tax Invoice Date-Range Download Modal */}
      <TaxInvoiceDownloadModal
        isOpen={showTaxInvoiceModal}
        onClose={() => setShowTaxInvoiceModal(false)}
      />
    </div>
  );
}
