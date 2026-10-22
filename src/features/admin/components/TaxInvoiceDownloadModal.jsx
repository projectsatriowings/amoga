import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function TaxInvoiceDownloadModal({ isOpen, onClose }) {
  const { adminFetch, token } = useAdminStore();

  // Helper for formatting YYYY-MM-DD
  const formatIsoDate = (d) => d.toISOString().split('T')[0];

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [fromDate, setFromDate] = useState(formatIsoDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatIsoDate(now));
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [orderStatus, setOrderStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const [appliedFilters, setAppliedFilters] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false); // boolean or string
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setInvoices([]);
      setSelectedIds(new Set());
      setAppliedFilters(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyFilters = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('From Date cannot be later than To Date. Please correct the date range.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus);
      if (orderStatus !== 'ALL') params.append('status', orderStatus);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminFetch(`/api/admin/invoices?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch tax invoices');

      setInvoices(json.invoices || []);
      // Automatically select all invoices by default
      const allIds = new Set((json.invoices || []).map((inv) => inv.id));
      setSelectedIds(allIds);
      setAppliedFilters({ fromDate, toDate });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((inv) => inv.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Download single invoice directly
  const handleDownloadSingle = async (orderId, invoiceNumber) => {
    try {
      const res = await fetch(`/api/admin/invoices/${orderId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-token': token,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to download invoice PDF');
      }

      const blob = await res.blob();
      const safeInv = (invoiceNumber || 'invoice').replace(/[/\\?%*:|"<>]/g, '_');
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Tax_Invoice_${safeInv}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      alert(`Download error: ${err.message}`);
    }
  };

  // Download batch (selected or all)
  const handleBatchDownload = async (mode = 'selected') => {
    const targetIds = mode === 'all'
      ? invoices.map((inv) => inv.id)
      : Array.from(selectedIds);

    if (targetIds.length === 0) {
      alert('Please select at least one tax invoice to download.');
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch('/api/admin/invoices/batch-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-token': token,
        },
        body: JSON.stringify({
          orderIds: targetIds,
          fromDate: appliedFilters?.fromDate,
          toDate: appliedFilters?.toDate,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to create invoice batch archive');
      }

      const contentType = res.headers.get('content-type') || '';
      const isZip = contentType.includes('zip');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      if (isZip) {
        a.download = `Amoga_Tax_Invoices_${appliedFilters?.fromDate}_to_${appliedFilters?.toDate}.zip`;
      } else {
        a.download = `Tax_Invoice_${targetIds[0]}.pdf`;
      }

      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      alert(`Batch download error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col overscroll-contain select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8C6320]/10 text-[#8C6320] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">Tax Invoice Downloads</h3>
              <p className="text-xs text-[#7A7167]">
                Filter statutory tax invoices by date range, review issuance status, and download individual or batch archives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7A7167] hover:text-[#1A1817] rounded hover:bg-[#EAE4D9]/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Filters & Controls */}
        <div className="bg-white p-4 rounded-lg border border-[#E5E0D5] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">From Date (Inclusive)</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">To Date (Inclusive)</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              >
                <option value="ALL">All Payment States</option>
                <option value="SUCCEEDED">Succeeded / Paid</option>
                <option value="PENDING">Pending Payment</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              >
                <option value="ALL">All Order States</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#F0EBE1]">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C8377]" />
              <input
                type="text"
                placeholder="Search invoice no, customer, ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5C242C] transition-colors disabled:opacity-50 cursor-pointer shadow-xs w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Invoices...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Apply Filters</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 overscroll-contain">
          {!appliedFilters && !loading && (
            <div className="py-12 px-6 text-center bg-white rounded-lg border border-dashed border-[#D5CEC2] space-y-3">
              <Calendar className="w-8 h-8 text-[#8C6320] mx-auto opacity-75" />
              <h4 className="font-serif text-sm font-semibold text-[#1A1817]">Select Date Range & Apply Filters</h4>
              <p className="text-xs text-[#7A7167] max-w-md mx-auto">
                Specify your desired From Date and To Date above, then click <strong>Apply Filters</strong> to inspect and download matching tax invoices. Automatic unfiltered downloads are restricted for audit safety.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-xs text-[#7A7167] space-y-2">
              <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Querying tax invoices between {fromDate} and {toDate}...</span>
            </div>
          )}

          {appliedFilters && !loading && (
            <div className="space-y-3">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#F5F2EB] rounded-lg border border-[#E5E0D5] gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium text-[#1A1817]">Active Filter Period:</span>
                  <span className="font-jakarta text-[#722F37] font-semibold tracking-tight">
                    {appliedFilters.fromDate} to {appliedFilters.toDate}
                  </span>
                  <span className="text-[#7A7167]">({invoices.length} matching invoices)</span>
                </div>

                {invoices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#D5CEC2] rounded text-[11px] font-medium text-[#4A423B] hover:bg-[#EAE4D9]"
                    >
                      {selectedIds.size === invoices.length ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-[#722F37]" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-[#7A7167]" />
                          <span>Select All ({invoices.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Invoices List / Table */}
              {invoices.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-lg border border-[#E5E0D5] space-y-2">
                  <FileText className="w-8 h-8 text-[#8C8377] mx-auto opacity-50" />
                  <p className="text-xs font-medium text-[#1A1817]">No invoices found for the selected period.</p>
                  <p className="text-[11px] text-[#7A7167]">Try adjusting the From/To dates or status filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                        <tr>
                          <th className="px-3 py-2 w-8 text-center">
                            <span className="sr-only">Select</span>
                          </th>
                          <th className="px-3 py-2">Invoice Number</th>
                          <th className="px-3 py-2">Invoice Date</th>
                          <th className="px-3 py-2">Customer & State</th>
                          <th className="px-3 py-2 text-right">Invoice Total</th>
                          <th className="px-3 py-2">Payment Status</th>
                          <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE4D9]">
                        {invoices.map((inv) => {
                          const isSelected = selectedIds.has(inv.id);
                          return (
                            <tr
                              key={inv.id}
                              onClick={() => toggleSelectOne(inv.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#722F37]/5' : 'hover:bg-[#FBF9F5]'
                              }`}
                            >
                              <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(inv.id)}
                                  className="w-3.5 h-3.5 rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-mono font-bold text-[#1A1817] flex items-center gap-1.5">
                                  <span>{inv.invoiceNumber}</span>
                                  {!inv.isComplete && (
                                    <span
                                      title={`Missing: ${inv.missingFields.join(', ')}`}
                                      className="inline-flex items-center text-amber-700"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#7A7167] font-mono">Ref: {inv.orderReference}</span>
                              </td>
                              <td className="px-3 py-2 text-[#5C544C] font-jakarta tabular-nums text-xs whitespace-nowrap">
                                {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-[#1A1817]">{inv.customerName}</div>
                                <div className="text-[10px] text-[#7A7167]">
                                  {inv.placeOfSupply || 'Tamil Nadu'} • GSTIN: {inv.customerGstin}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta font-bold text-[#1A1817] tabular-nums whitespace-nowrap text-xs">
                                <span className="text-[11px] text-[#8C8377] font-normal mr-0.5">₹</span>
                                {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                    inv.paymentStatus === 'SUCCEEDED'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : inv.paymentStatus === 'FAILED'
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {inv.paymentStatus}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingle(inv.id, inv.invoiceNumber)}
                                  className="p-1.5 text-[#722F37] hover:bg-[#722F37]/10 rounded transition-colors"
                                  title="Download Tax Invoice PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#EAE4D9] pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#4A423B] hover:bg-[#F5F2EB] transition-colors"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchDownload('all')}
              disabled={!appliedFilters || invoices.length === 0 || downloading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#722F37] text-[#722F37] text-xs font-medium rounded-lg hover:bg-[#722F37]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Download all invoices matching current date filters as a ZIP archive"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing ZIP...' : `Download All (${invoices.length}) Invoices`}</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchDownload('selected')}
              disabled={!appliedFilters || selectedIds.size === 0 || downloading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E1916] text-white text-xs font-medium rounded-lg hover:bg-[#2C2520] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              title="Download only checked invoices (single PDF or ZIP archive)"
            >
              <Download className="w-3.5 h-3.5 text-[#E6C687]" />
              <span>
                {downloading
                  ? 'Generating Download...'
                  : selectedIds.size === 1
                  ? 'Download Selected Invoice (PDF)'
                  : `Download Selected Invoices (${selectedIds.size})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
