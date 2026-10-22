import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function GstReportModal({ isOpen, onClose }) {
  const { adminFetch, token } = useAdminStore();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // 'csv' | 'pdf' | null
  const [error, setError] = useState(null);

  // Available selectable years (2024 through current year + 1)
  const availableYears = [];
  for (let y = currentYear + 1; y >= 2024; y--) {
    availableYears.push(y);
  }

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPreviewData(null);
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

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(
        `/api/admin/reports/gst?month=${selectedMonth}&year=${selectedYear}&format=preview`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch GST preview');
      setPreviewData(json.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const monthObj = MONTHS.find((m) => m.value === Number(selectedMonth));
      const monthName = monthObj ? monthObj.label : 'Report';
      const filename = `Amoga_GST_Report_${monthName}_${selectedYear}.${format}`;

      const res = await fetch(
        `/api/admin/reports/gst?month=${selectedMonth}&year=${selectedYear}&format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-admin-token': token,
          },
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to download report');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      alert(`Download error: ${err.message}`);
    } finally {
      setDownloading(null);
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
        className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col overscroll-contain select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#722F37]/10 text-[#722F37] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">Monthly GST Accounting Report</h3>
              <p className="text-xs text-[#7A7167]">
                Select a month & year to preview turnover, tax calculations, and download verified statements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7A7167] hover:text-[#1A1817] rounded hover:bg-[#EAE4D9]/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Selection Controls */}
        <div className="bg-white p-4 rounded-lg border border-[#E5E0D5] flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">Reporting Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setPreviewData(null);
                }}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setPreviewData(null);
                }}
                className="px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#1A1817] focus:outline-none focus:border-[#722F37]"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5C242C] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Data...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Preview Report</span>
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

        {/* Content Body: Preview State or Empty Filter State */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 overscroll-contain">
          {!previewData && !loading && (
            <div className="py-12 px-6 text-center bg-white rounded-lg border border-dashed border-[#D5CEC2] space-y-3">
              <Info className="w-8 h-8 text-[#8C6320] mx-auto opacity-75" />
              <h4 className="font-serif text-sm font-semibold text-[#1A1817]">Select Period & Click Preview</h4>
              <p className="text-xs text-[#7A7167] max-w-md mx-auto">
                In accordance with GST reconciliation standards, the report period must be selected and reviewed prior to downloading. Click <strong>Preview Report</strong> to inspect authoritative transactional data.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-xs text-[#7A7167] space-y-2">
              <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Fetching transactional records for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}...</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-4">
              {/* Period Banner */}
              <div className="flex items-center justify-between p-3 bg-[#F5F2EB] rounded-lg border border-[#E5E0D5]">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium text-[#1A1817]">Reporting Period:</span>
                  <span className="font-jakarta text-[#722F37] font-semibold tracking-tight">{previewData.period?.displayPeriod}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D5CEC2] text-[11px] font-jakarta font-medium text-[#5C544C] tabular-nums">
                  {previewData.recordCount} Invoices • {previewData.lineItemsCount} Line Items
                </span>
              </div>

              {/* KPI Cards with Professional Numerical Typography */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                    Taxable Value
                  </span>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#1A1817] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#8C8377]">₹</span>
                    <span>
                      {previewData.summary?.totalTaxableValue?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Net of discount</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                    Total GST
                  </span>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#722F37] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#722F37]/70">₹</span>
                    <span>
                      {previewData.summary?.totalTax?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">CGST + SGST + IGST</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                    Total Invoiced
                  </span>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#1A1817] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#8C8377]">₹</span>
                    <span>
                      {previewData.summary?.totalInvoiceAmount?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Invoice Date Basis</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                    Payments Received
                  </span>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-emerald-800 tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-emerald-700/70">₹</span>
                    <span>
                      {previewData.summary?.totalPaymentsReceived?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Payment Date Basis</span>
                </div>
              </div>

              {/* Tax Breakdowns Row */}
              <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] text-xs shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center divide-x divide-[#EAE4D9]">
                  <div className="px-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-medium text-[#7A7167] block mb-0.5">
                      CGST (Intra-State)
                    </span>
                    <span className="font-jakarta font-bold text-sm text-[#1A1817] tabular-nums tracking-tight">
                      ₹{previewData.summary?.totalCgst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-medium text-[#7A7167] block mb-0.5">
                      SGST (Intra-State)
                    </span>
                    <span className="font-jakarta font-bold text-sm text-[#1A1817] tabular-nums tracking-tight">
                      ₹{previewData.summary?.totalSgst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-medium text-[#7A7167] block mb-0.5">
                      IGST (Inter-State)
                    </span>
                    <span className="font-jakarta font-bold text-sm text-[#1A1817] tabular-nums tracking-tight">
                      ₹{previewData.summary?.totalIgst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-medium text-[#7A7167] block mb-0.5">
                      Refunds in Month
                    </span>
                    <span className="font-jakarta font-bold text-sm text-rose-700 tabular-nums tracking-tight">
                      ₹{previewData.summary?.totalRefunds?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Missing Data Warnings */}
              {previewData.missingDataWarnings?.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Audit Disclosures & Data Notices:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
                    {previewData.missingDataWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HSN Summary */}
              {previewData.hsnBreakdown?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-sans uppercase tracking-wider font-semibold text-[#7A7167]">HSN / SAC Tax Breakdown</h4>
                  <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden text-xs shadow-2xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#F5F2EB] text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167] border-b border-[#E5E0D5]">
                        <tr>
                          <th className="px-3 py-2 font-mono">HSN Code</th>
                          <th className="px-3 py-2">GST Rate</th>
                          <th className="px-3 py-2 text-right">Taxable (₹)</th>
                          <th className="px-3 py-2 text-right">CGST (₹)</th>
                          <th className="px-3 py-2 text-right">SGST (₹)</th>
                          <th className="px-3 py-2 text-right">IGST (₹)</th>
                          <th className="px-3 py-2 text-right">Total Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE4D9]">
                        {previewData.hsnBreakdown.map((h, i) => (
                          <tr key={i} className="hover:bg-[#FBF9F5]">
                            <td className="px-3 py-2 font-mono font-medium text-[#1A1817]">{h.hsnCode}</td>
                            <td className="px-3 py-2 font-jakarta tabular-nums text-[#5C544C]">{h.gstRate}%</td>
                            <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#1A1817]">
                              {h.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                              {h.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                              {h.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                              {h.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-jakarta tabular-nums font-bold text-[#722F37]">
                              {h.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Legal Disclaimer */}
              <p className="text-[10px] text-[#8C8377] italic leading-tight">
                * {previewData.disclaimer}
              </p>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={!previewData || downloading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#722F37] text-[#722F37] text-xs font-medium rounded-lg hover:bg-[#722F37]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download Executive PDF Summary"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{downloading === 'pdf' ? 'Generating PDF...' : 'Download PDF Summary'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={!previewData || downloading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E1916] text-white text-xs font-medium rounded-lg hover:bg-[#2C2520] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="Download Complete Line-Item CSV for Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#E6C687]" />
              <span>{downloading === 'csv' ? 'Exporting CSV...' : 'Download GST Report (CSV)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
