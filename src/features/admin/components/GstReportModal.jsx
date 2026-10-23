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
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
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
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'hsn' | 'returns' | 'purchase' | 'taxreview'
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // 'excel' | 'pdf' | 'csv' | null
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
      setActiveTab('sales');
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
      const ext = format === 'excel' ? 'xlsx' : format;
      const filename = `Amoga_GST_Report_${monthName}_${selectedYear}.${ext}`;

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
        className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] flex flex-col overscroll-contain select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#722F37]/10 text-[#722F37] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">Monthly GST Accounting & Tax Reports</h3>
              <p className="text-xs text-[#7A7167]">
                Official GSTR-1, rate breakdown, HSN-wise sales, credit notes, and accountant tax liability review
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
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">Financial Year</label>
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
                  <span>Loading Authoritative Data...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Generate / Preview Report</span>
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
              <h4 className="font-serif text-sm font-semibold text-[#1A1817]">Select Period & Click Generate</h4>
              <p className="text-xs text-[#7A7167] max-w-md mx-auto">
                Select your required month and year above, then click <strong>Generate / Preview Report</strong>. The system will calculate accurate Sales Before GST, GST by rate, HSN groups, sales returns, and estimated net GST liability using Amoga's actual records.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-xs text-[#7A7167] space-y-2">
              <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Fetching transactional sales, invoices, and tax records for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}...</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-4">
              {/* Period Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#F5F2EB] rounded-lg border border-[#E5E0D5] gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium text-[#1A1817]">Reporting Period:</span>
                  <span className="font-jakarta text-[#722F37] font-semibold tracking-tight">{previewData.period?.displayPeriod}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#5C544C] font-mono">
                  <span>{previewData.recordCount} Invoices</span>
                  <span>•</span>
                  <span>{previewData.lineItemsCount} Line Items</span>
                  <span>•</span>
                  <span>{previewData.returnsCount} Returns / Credit Notes</span>
                </div>
              </div>

              {/* KPI Cards: Plain-English Indian Terminology */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                      Sales Before GST
                    </span>
                    <span title="Taxable value of product sales before GST calculation" className="text-[#8C8377] cursor-help">
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#1A1817] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#8C8377]">₹</span>
                    <span>
                      {previewData.summary?.totalTaxableValue?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Taxable sales turnover</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                      GST Charged on Sales
                    </span>
                    <span title="Total output tax collected on sales (CGST + SGST + IGST)" className="text-[#8C8377] cursor-help">
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#722F37] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#722F37]/70">₹</span>
                    <span>
                      {previewData.summary?.totalTax?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Output tax liability</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                      Total Sales Inc. GST
                    </span>
                    <span title="Gross invoice value of all sales including taxes and delivery" className="text-[#8C8377] cursor-help">
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-[#1A1817] tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-[#8C8377]">₹</span>
                    <span>
                      {previewData.summary?.totalInvoiceAmount?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Gross invoice value</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E5E0D5] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-emerald-800">
                      Estimated GST to Pay
                    </span>
                    <span title="Estimated net tax to pay after sales returns and input credits" className="text-[#8C8377] cursor-help">
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="font-jakarta text-2xl font-bold tracking-tight text-emerald-800 tabular-nums flex items-baseline gap-1">
                    <span className="text-base font-semibold text-emerald-700/70">₹</span>
                    <span>
                      {previewData.taxSummaryReview?.estimatedNetGstToPay?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <span className="text-[10px] text-[#7A7167]">Net estimated liability</span>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex items-center border-b border-[#E5E0D5] gap-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('sales')}
                  className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'sales'
                      ? 'border-[#722F37] text-[#722F37] font-semibold'
                      : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
                  }`}
                >
                  A. Sales Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hsn')}
                  className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'hsn'
                      ? 'border-[#722F37] text-[#722F37] font-semibold'
                      : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
                  }`}
                >
                  B. HSN-wise Sales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('returns')}
                  className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTab === 'returns'
                      ? 'border-[#722F37] text-[#722F37] font-semibold'
                      : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
                  }`}
                >
                  <span>C. Returns & Adjustments</span>
                  {previewData.returnsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                      {previewData.returnsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('taxreview')}
                  className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'taxreview'
                      ? 'border-[#722F37] text-[#722F37] font-semibold'
                      : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
                  }`}
                >
                  D. Tax Review & Alerts
                </button>
              </div>

              {/* Tab 1: Section A - Sales Summary & Rates */}
              {activeTab === 'sales' && (
                <div className="space-y-3">
                  {/* Intra vs Inter-State Supply Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-[#E5E0D5] space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#1A1817]">
                        <span>Intra-State Supplies (Tamil Nadu)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F2EB] text-[#5C544C]">
                          CGST + SGST (50/50)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EBE1] text-xs">
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">Taxable Sales</span>
                          <span className="font-jakarta font-bold text-[#1A1817]">
                            ₹{previewData.supplyTypeBreakdown?.intraState?.taxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">CGST + SGST</span>
                          <span className="font-jakarta font-bold text-[#722F37]">
                            ₹{previewData.supplyTypeBreakdown?.intraState?.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">Invoiced Value</span>
                          <span className="font-jakarta font-bold text-[#1A1817]">
                            ₹{previewData.supplyTypeBreakdown?.intraState?.totalInvoiceValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#E5E0D5] space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#1A1817]">
                        <span>Inter-State Supplies (Outside TN)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F2EB] text-[#5C544C]">
                          IGST (100%)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EBE1] text-xs">
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">Taxable Sales</span>
                          <span className="font-jakarta font-bold text-[#1A1817]">
                            ₹{previewData.supplyTypeBreakdown?.interState?.taxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">IGST Total</span>
                          <span className="font-jakarta font-bold text-[#722F37]">
                            ₹{previewData.supplyTypeBreakdown?.interState?.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A7167] block">Invoiced Value</span>
                          <span className="font-jakarta font-bold text-[#1A1817]">
                            ₹{previewData.supplyTypeBreakdown?.interState?.totalInvoiceValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Grouped by GST Rate */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                      Sales Grouped by GST Rate
                    </h4>
                    <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[#F5F2EB] text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167] border-b border-[#E5E0D5]">
                          <tr>
                            <th className="px-3 py-2">GST Rate</th>
                            <th className="px-3 py-2 text-center">Items Sold</th>
                            <th className="px-3 py-2 text-right">Sales Before GST (₹)</th>
                            <th className="px-3 py-2 text-right">CGST (₹)</th>
                            <th className="px-3 py-2 text-right">SGST (₹)</th>
                            <th className="px-3 py-2 text-right">IGST (₹)</th>
                            <th className="px-3 py-2 text-right">GST Charged (₹)</th>
                            <th className="px-3 py-2 text-right">Total Invoiced (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE4D9]">
                          {previewData.rateBreakdown?.map((r, i) => (
                            <tr key={i} className="hover:bg-[#FBF9F5]">
                              <td className="px-3 py-2 font-jakarta font-bold text-[#1A1817]">{r.rate}%</td>
                              <td className="px-3 py-2 text-center text-[#5C544C]">{r.count}</td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#1A1817]">
                                {r.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                                {r.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                                {r.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums text-[#5C544C]">
                                {r.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums font-bold text-[#722F37]">
                                {r.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums font-medium text-[#1A1817]">
                                {r.invoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Section B - HSN-wise Sales */}
              {activeTab === 'hsn' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-sans uppercase tracking-wider font-semibold text-[#7A7167]">
                      HSN / SAC Statutory Classification Summary
                    </h4>
                    <span className="text-[11px] text-[#7A7167]">Reconciled with Outward Sales Invoices</span>
                  </div>
                  <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden text-xs shadow-2xs max-h-80 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#F5F2EB] text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167] border-b border-[#E5E0D5] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-mono">HSN Code</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-center">Qty / Unit</th>
                          <th className="px-3 py-2 text-center">Rate</th>
                          <th className="px-3 py-2 text-right">Taxable (₹)</th>
                          <th className="px-3 py-2 text-right">CGST (₹)</th>
                          <th className="px-3 py-2 text-right">SGST (₹)</th>
                          <th className="px-3 py-2 text-right">IGST (₹)</th>
                          <th className="px-3 py-2 text-right">Total Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE4D9]">
                        {previewData.hsnBreakdown?.map((h, i) => (
                          <tr key={i} className="hover:bg-[#FBF9F5]">
                            <td className="px-3 py-2 font-mono font-medium text-[#1A1817]">{h.hsnCode}</td>
                            <td className="px-3 py-2 text-[#5C544C] max-w-xs truncate">{h.description}</td>
                            <td className="px-3 py-2 text-center text-[#5C544C]">{h.itemCount} {h.sellingUnit}</td>
                            <td className="px-3 py-2 text-center font-jakarta tabular-nums text-[#5C544C]">{h.gstRate}%</td>
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

              {/* Tab 3: Section C - Returns & Credit Notes */}
              {activeTab === 'returns' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-amber-700" />
                      <span>GST Credit Note & Sales Return Rules</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Under Section 34 of the CGST Act, GST credit notes reducing output tax liability are issued exclusively when an official tax invoice has already been issued. Pre-invoice cancelled orders do not require a credit note and are excluded from tax reductions.
                    </p>
                  </div>

                  {previewData.returnsAndAdjustments?.records?.length === 0 ? (
                    <div className="py-8 text-center bg-white rounded-lg border border-[#E5E0D5] space-y-1.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                      <p className="text-xs font-semibold text-[#1A1817]">No Post-Invoice Returns or Credit Notes</p>
                      <p className="text-[11px] text-[#7A7167]">
                        All issued invoices remain active with zero statutory returns or credit note adjustments this month.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[#F5F2EB] text-[10px] font-sans uppercase tracking-wider font-semibold text-[#7A7167] border-b border-[#E5E0D5]">
                          <tr>
                            <th className="px-3 py-2">Credit Note #</th>
                            <th className="px-3 py-2">Original Invoice</th>
                            <th className="px-3 py-2">Adjustment Date</th>
                            <th className="px-3 py-2">Customer & State</th>
                            <th className="px-3 py-2 text-right">Taxable Adj (₹)</th>
                            <th className="px-3 py-2 text-right">Tax Reduction (₹)</th>
                            <th className="px-3 py-2 text-right">Total Credit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE4D9]">
                          {previewData.returnsAndAdjustments?.records?.map((ret, i) => (
                            <tr key={i} className="hover:bg-[#FBF9F5]">
                              <td className="px-3 py-2 font-mono font-bold text-[#722F37]">{ret.creditNoteNumber}</td>
                              <td className="px-3 py-2 font-mono text-[#1A1817]">{ret.originalInvoiceNumber}</td>
                              <td className="px-3 py-2 text-[#5C544C]">{ret.adjustmentDate}</td>
                              <td className="px-3 py-2">
                                <div className="text-[#1A1817]">{ret.customerName}</div>
                                <div className="text-[10px] text-[#7A7167]">{ret.placeOfSupply}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums text-rose-700">
                                -₹{ret.taxableAdjustment.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums font-bold text-rose-700">
                                -₹{ret.totalTaxAdjustment.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-jakarta tabular-nums font-bold text-[#1A1817]">
                                ₹{ret.totalCreditNoteValue.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Section D - Tax Review & Audit Disclosures */}
              {activeTab === 'taxreview' && (
                <div className="space-y-3">
                  {/* Review Calculation Box */}
                  <div className="p-4 bg-white rounded-lg border border-[#E5E0D5] space-y-2">
                    <h4 className="font-serif text-sm font-bold text-[#1A1817] border-b border-[#F0EBE1] pb-2">
                      Estimated Tax Liability Computation (Accountant Review)
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-[#5C544C]">Gross Output GST Charged on Sales</span>
                        <span className="font-jakarta font-bold text-[#1A1817]">
                          ₹{previewData.taxSummaryReview?.grossOutputGstCharged?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#5C544C]">Less: Sales Returns & Credit Note Tax Adjustments</span>
                        <span className="font-jakarta font-bold text-rose-700">
                          -₹{previewData.taxSummaryReview?.salesReturnsTaxReduction?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-t-2 border-[#722F37] text-sm">
                        <span className="font-bold text-[#722F37]">ESTIMATED NET GST TO PAY</span>
                        <span className="font-jakarta font-bold text-base text-[#722F37]">
                          ₹{previewData.taxSummaryReview?.netOutputGstLiability?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#7A7167] italic pt-1 border-t border-[#F0EBE1]">
                      * {previewData.taxSummaryReview?.reviewDisclaimer}
                    </p>
                  </div>

                  {/* Audit Disclosures: Records That Need Checking */}
                  {previewData.missingDataWarnings?.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Records That Need Checking (Audit & Compliance Disclosures):</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
                        {previewData.missingDataWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Legal Disclaimer Footer */}
              <p className="text-[10px] text-[#8C8377] italic leading-tight">
                * {previewData.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions with Supported Formats */}
        <div className="border-t border-[#EAE4D9] pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#4A423B] hover:bg-[#F5F2EB] transition-colors"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={!previewData || downloading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-[#722F37] text-[#722F37] text-xs font-medium rounded-lg hover:bg-[#722F37]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Download Executive Printable PDF Summary"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{downloading === 'pdf' ? 'Generating PDF...' : 'Download PDF Summary'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={!previewData || downloading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-[#5C544C] text-[#332D28] text-xs font-medium rounded-lg hover:bg-[#F5F2EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Download Complete Line-Item CSV Register"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5C544C]" />
              <span>{downloading === 'csv' ? 'Exporting CSV...' : 'Download CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('excel')}
              disabled={!previewData || downloading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E1916] text-white text-xs font-medium rounded-lg hover:bg-[#2C2520] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              title="Download 5-Sheet Excel Workbook (.xlsx) for Accountants"
            >
              <Download className="w-3.5 h-3.5 text-[#E6C687]" />
              <span>{downloading === 'excel' ? 'Building Workbook...' : 'Download GST Report (Excel .xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
