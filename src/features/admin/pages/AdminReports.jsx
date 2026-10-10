import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminReports() {
  const { adminFetch, token } = useAdminStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await adminFetch(`/api/admin/reports/sales?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load report');
      setReport(json.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadCsv = (type) => {
    const url = `/api/admin/reports/export?type=${type}`;
    // Fetch with auth token and trigger download
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-admin-token': token,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `amoga-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Financial Reports & Exports</h1>
          <p className="text-xs text-[#7A7167]">
            Reconciled sales, average order value, captured payments, and CSV downloads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('orders')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-semibold text-[#1A1817] hover:bg-[#EFEAE1] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Orders CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('inventory')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-semibold text-[#1A1817] hover:bg-[#EFEAE1] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>Inventory CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8C8377]" />
          <span className="font-medium text-[#4A423B]">Date Interval:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-xs"
          />
          <span className="text-[#8C8377]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded font-mono text-xs"
          />
        </div>
        <button
          onClick={fetchReport}
          className="px-3 py-1.5 bg-[#1E1916] text-white rounded font-medium hover:bg-[#2C2520]"
        >
          Generate Report
        </button>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setTimeout(fetchReport, 50);
            }}
            className="px-2 py-1 text-xs text-[#7A7167] hover:underline"
          >
            Reset Dates
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">
          <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Synthesizing financial reports...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Net Captured Payments</span>
              <p className="text-2xl font-serif font-bold text-[#1A1817] mt-2">
                ₹{report.netCapturedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#287A25] font-medium mt-1">
                {report.paymentsCapturedCount} captured transactions
              </p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Gross Sales</span>
              <p className="text-2xl font-serif font-bold text-[#1A1817] mt-2">
                ₹{report.grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#7A7167] mt-1">{report.paidOrdersCount} fulfilled orders</p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Average Order Value (AOV)</span>
              <p className="text-2xl font-serif font-bold text-[#8C6320] mt-2">
                ₹{report.averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#7A7167] mt-1">Per paid checkout</p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Total Orders Registered</span>
              <p className="text-2xl font-serif font-bold text-[#1A1817] mt-2">
                {report.totalOrdersPlaced}
              </p>
              <p className="text-[11px] text-rose-700 mt-1">{report.failedPaymentsCount} payment drops</p>
            </div>
          </div>

          <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] text-xs text-[#5C544C] leading-relaxed space-y-2">
            <h3 className="font-serif text-sm font-bold text-[#1A1817]">Financial Methodology</h3>
            <p>
              • <strong>Net Captured Revenue</strong> represents funds successfully verified via payment gateways (Razorpay / test sandbox) with status <code>SUCCEEDED</code>.
            </p>
            <p>
              • <strong>Gross Sales</strong> sums all orders confirmed by customers excluding cancellations and unattempted carts.
            </p>
            <p>
              • <strong>CSV Export</strong> streams sanitized, escaped fields adhering to RFC 4180 without exposing server credentials, guest tokens, or sensitive API secrets.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
