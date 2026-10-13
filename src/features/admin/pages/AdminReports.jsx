import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  TrendingUp,
  Tag,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminReports() {
  const { adminFetch, token } = useAdminStore();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingType, setDownloadingType] = useState(null);

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
      setReportData(json.report);
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
    setDownloadingType(type);
    const params = new URLSearchParams();
    params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/admin/reports/export?${params.toString()}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-admin-token': token,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed: insufficient permissions or server error');
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
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      })
      .catch((err) => alert(err.message))
      .finally(() => setDownloadingType(null));
  };

  const summary = reportData?.summary || {};
  const ordersByStatus = reportData?.ordersByStatus || {};
  const salesByCollection = reportData?.salesByCollection || [];
  const promotionUsage = reportData?.promotionUsage || [];

  const statusIcons = {
    PENDING_PAYMENT: { label: 'Pending Payment', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    PENDING_CONFIRMATION: { label: 'Pending Confirmation', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    PROCESSING: { label: 'Processing', icon: Package, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    DISPATCHED: { label: 'Dispatched', icon: Truck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Financial Reports & Exports</h1>
          <p className="text-xs text-[#7A7167]">
            Reconciled PostgreSQL metrics, collection sales attribution, and RFC 4180 CSV exports
          </p>
        </div>

        {/* CSV Export Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { type: 'orders', label: 'Orders CSV', icon: ShoppingBag, color: 'text-[#722F37]' },
            { type: 'inventory', label: 'Inventory CSV', icon: Package, color: 'text-[#8C6320]' },
            { type: 'collections', label: 'Collections CSV', icon: Layers, color: 'text-[#287A25]' },
            { type: 'promotions', label: 'Coupons CSV', icon: Tag, color: 'text-indigo-700' },
          ].map((btn) => {
            const Icon = btn.icon;
            const isBusy = downloadingType === btn.type;
            return (
              <button
                key={btn.type}
                disabled={isBusy}
                onClick={() => handleDownloadCsv(btn.type)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-semibold text-[#1A1817] hover:bg-[#EFEAE1] transition-colors disabled:opacity-50"
              >
                <Icon className={`w-3.5 h-3.5 ${btn.color}`} />
                <span>{isBusy ? 'Exporting...' : btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Interval Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8C8377]" />
          <span className="font-medium text-[#4A423B]">Reporting Period:</span>
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
          className="px-3 py-1.5 bg-[#1E1916] text-white rounded font-medium hover:bg-[#2C2520] transition-colors"
        >
          Update Report
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
            Reset to All Time
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">
          <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Synthesizing authoritative financial reports...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Net Captured Payments</span>
              <p className="text-2xl font-sans font-semibold text-[#1A1817] tabular-nums mt-2">
                ₹{(summary.netCapturedRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#287A25] font-medium mt-1 font-sans tabular-nums">
                {summary.paymentsCapturedCount || 0} verified gateway captures
              </p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Gross Sales</span>
              <p className="text-2xl font-sans font-semibold text-[#1A1817] tabular-nums mt-2">
                ₹{(summary.grossRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#7A7167] mt-1 font-sans tabular-nums">
                {summary.paidOrdersCount || 0} active fulfilled checkouts
              </p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Average Order Value (AOV)</span>
              <p className="text-2xl font-sans font-semibold text-[#8C6320] tabular-nums mt-2">
                ₹{(summary.averageOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#7A7167] mt-1">Per paid order</p>
            </div>

            <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5]">
              <span className="text-xs font-mono uppercase text-[#7A7167]">Total Orders Registered</span>
              <p className="text-2xl font-sans font-semibold text-[#1A1817] tabular-nums mt-2">
                {summary.totalOrdersPlaced || 0}
              </p>
              <p className="text-[11px] text-rose-700 mt-1 font-sans tabular-nums">
                {summary.failedPaymentsCount || 0} payment drops or declined attempts
              </p>
            </div>
          </div>

          {/* Orders by Lifecycle Status Grid */}
          <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] space-y-3">
            <h2 className="font-serif text-sm font-bold text-[#1A1817]">Orders by Lifecycle Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {Object.entries(ordersByStatus).map(([statusKey, count]) => {
                const conf = statusIcons[statusKey] || { label: statusKey, icon: Clock, color: 'text-stone-700 bg-stone-100 border-stone-200' };
                const Icon = conf.icon;
                return (
                  <div
                    key={statusKey}
                    className={`p-3 rounded-lg border ${conf.color} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold truncate">
                        {conf.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="text-xl font-bold font-sans tabular-nums mt-2">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales by Collection Breakdown Table */}
          <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
            <div className="p-4 bg-[#F5F2EB] border-b border-[#E5E0D5] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-sm font-bold text-[#1A1817] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#722F37]" />
                  <span>Sales & Units Attribution by Collection</span>
                </h2>
                <p className="text-[11px] text-[#7A7167]">
                  Authoritative line-item aggregation attributing orders to respective category collections
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#332D28]">
                <thead className="bg-[#F5F2EB]/60 text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                  <tr>
                    <th className="px-5 py-3">Collection</th>
                    <th className="px-5 py-3 text-right">Catalogue Products</th>
                    <th className="px-5 py-3 text-right">Orders Attributed</th>
                    <th className="px-5 py-3 text-right">Units Sold</th>
                    <th className="px-5 py-3 text-right">Gross Sales (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D9]">
                  {salesByCollection.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-[#7A7167]">
                        No collection sales recorded in this interval.
                      </td>
                    </tr>
                  ) : (
                    salesByCollection.map((col) => (
                      <tr key={col.collectionId} className="hover:bg-[#F5F2EB]/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-[#1A1817]">
                          <div className="font-serif">{col.name}</div>
                          <div className="text-[10px] font-mono text-[#7A7167]">{col.collectionId}</div>
                        </td>
                        <td className="px-5 py-3 text-right font-sans tabular-nums text-[#5C544C]">
                          {col.productCount}
                        </td>
                        <td className="px-5 py-3 text-right font-sans tabular-nums text-[#5C544C]">
                          {col.orderCount}
                        </td>
                        <td className="px-5 py-3 text-right font-sans tabular-nums font-semibold text-[#1A1817]">
                          {col.totalUnits}
                        </td>
                        <td className="px-5 py-3 text-right font-sans tabular-nums font-semibold text-[#722F37]">
                          ₹{col.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Promotion Usage Breakdown Table */}
          <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
            <div className="p-4 bg-[#F5F2EB] border-b border-[#E5E0D5]">
              <h2 className="font-serif text-sm font-bold text-[#1A1817] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#8C6320]" />
                <span>Promotional Coupons & Redemptions</span>
              </h2>
              <p className="text-[11px] text-[#7A7167]">
                Real-time usage caps, redemptions, and active promotion status
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#332D28]">
                <thead className="bg-[#F5F2EB]/60 text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                  <tr>
                    <th className="px-5 py-3">Code & Name</th>
                    <th className="px-5 py-3">Benefit</th>
                    <th className="px-5 py-3">Redemptions</th>
                    <th className="px-5 py-3">Usage Cap</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D9]">
                  {promotionUsage.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-[#7A7167]">
                        No promotional coupons registered.
                      </td>
                    </tr>
                  ) : (
                    promotionUsage.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-[#1A1817]">{p.code}</span>
                          {p.name && <span className="text-[10px] text-[#7A7167] block">{p.name}</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[#722F37]">
                          {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT`}
                        </td>
                        <td className="px-5 py-3 font-sans tabular-nums font-medium text-[#1A1817]">
                          {p.usedCount}
                        </td>
                        <td className="px-5 py-3 font-sans tabular-nums text-[#5C544C]">
                          {p.usageLimit ? `${p.usageLimit} max` : 'Unlimited'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                              p.isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {p.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit & Methodology */}
          <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] text-xs text-[#5C544C] leading-relaxed space-y-2">
            <h3 className="font-serif text-sm font-bold text-[#1A1817]">Data Integrity & Export Security</h3>
            <p>
              • <strong>Reconciled PostgreSQL Metrics:</strong> All figures are computed directly on the backend using authoritative integer-paise arithmetic to eliminate floating-point precision drift.
            </p>
            <p>
              • <strong>Attribution Logic:</strong> Line items are matched to active and historical collection IDs, preserving historical attribution even when product collections are modified.
            </p>
            <p>
              • <strong>Spreadsheet Formula Injection Defense:</strong> All exported CSV cells starting with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code> are automatically escaped with apostrophe prefixes to protect administrative spreadsheets against command execution.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
