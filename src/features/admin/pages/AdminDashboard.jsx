import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Package,
  Truck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminDashboard() {
  const { adminFetch } = useAdminStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/dashboard/stats');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load dashboard metrics');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#EAE4D9] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#EAE4D9] rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-[#EAE4D9] rounded-lg" />
        <div className="h-80 bg-[#EAE4D9] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center space-y-3">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const { metrics, recentOrders, salesTrends, collectionPerformance } = data;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DISPATCHED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-800 border-stone-200';
    }
  };

  // Find max sales for bar scaling
  const maxTrendRevenue = Math.max(1, ...salesTrends.map((t) => t.revenue));

  return (
    <div className="space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Executive Dashboard</h1>
          <p className="text-xs text-[#7A7167]">Real-time operational status from PostgreSQL and Razorpay</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8C6320]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid Revenue */}
        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7A7167]">Captured Revenue</span>
            <div className="p-2 bg-[#287A25]/10 rounded text-[#287A25]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-serif font-bold text-[#1A1817]">
              ₹{metrics.paidRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#287A25] font-medium">Authoritative verified payments</p>
        </div>

        {/* Gross Sales */}
        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7A7167]">Gross Sales</span>
            <div className="p-2 bg-[#722F37]/10 rounded text-[#722F37]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-serif font-bold text-[#1A1817]">
              ₹{metrics.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#7A7167]">Excludes cancelled orders</p>
        </div>

        {/* Orders in Fulfilment Queue */}
        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7A7167]">Fulfilment Queue</span>
            <div className="p-2 bg-[#8C6320]/10 rounded text-[#8C6320]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-serif font-bold text-[#1A1817]">
              {metrics.ordersRequiringFulfilment}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#8C6320]">Confirmed or processing orders</p>
        </div>

        {/* Stock Alert */}
        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7A7167]">Stock Attention</span>
            <div className="p-2 bg-amber-50 rounded text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-amber-900">{metrics.lowStockCount}</span>
            <span className="text-xs text-[#7A7167]">low</span>
            <span className="text-xs text-[#7A7167]">•</span>
            <span className="text-base font-serif font-bold text-rose-800">{metrics.outOfStockCount}</span>
            <span className="text-xs text-[#7A7167]">out</span>
          </div>
          <Link to="/admin/inventory" className="mt-1 text-[11px] text-[#722F37] hover:underline flex items-center gap-1">
            <span>Manage inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 14-Day Sales Trend Chart */}
      <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1817]">Sales Volume Trend</h2>
            <p className="text-xs text-[#7A7167]">Daily sales over the last 14 days</p>
          </div>
        </div>

        <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-[#EAE4D9]">
          {salesTrends.map((t) => {
            const heightPercent = Math.max(4, Math.round((t.revenue / maxTrendRevenue) * 100));
            const dayLabel = t.date.split('-').slice(1).join('/');
            return (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[24px] bg-[#722F37]/80 hover:bg-[#722F37] rounded-t transition-all duration-200 cursor-pointer"
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-9 hidden group-hover:flex flex-col items-center bg-[#1E1916] text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none z-10 whitespace-nowrap">
                    <span>₹{t.revenue.toLocaleString()}</span>
                    <span className="text-[#A89F93]">{t.orders} orders</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#8C8377]">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5]">
          <h2 className="font-serif text-base font-bold text-[#1A1817] mb-4">Orders by Lifecycle State</h2>
          <div className="space-y-3">
            {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F0EBE1] last:border-0">
                <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${getStatusBadge(status)}`}>
                  {status}
                </span>
                <span className="font-semibold text-[#1A1817]">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Performance */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] lg:col-span-2">
          <h2 className="font-serif text-base font-bold text-[#1A1817] mb-4">Collection Sales Contribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collectionPerformance.map((col) => {
              const names = {
                food: 'Gourmet Food',
                tea: 'Artisanal Tea',
                sarees: 'Heritage Sarees',
                jewellery: 'Silver Jewellery',
              };
              return (
                <div key={col.collectionId} className="p-4 bg-[#F5F2EB] rounded border border-[#E0D9CD]">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#8C6320]">
                    {names[col.collectionId] || col.collectionId}
                  </p>
                  <p className="text-xl font-serif font-bold text-[#1A1817] mt-1">
                    ₹{col.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#7A7167]">
                    <span>Units Sold: {col.totalQuantitySold}</span>
                    <span>Line Items: {col.itemsCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Recent Order Stream</h2>
            <p className="text-xs text-[#7A7167]">Latest transactions registered in database</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-[#722F37] hover:text-[#521C22] font-semibold flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#332D28]">
            <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
              <tr>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D9]">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-[#1A1817]">
                    {ord.orderReference}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#1A1817]">{ord.customerName}</p>
                    <p className="text-[11px] text-[#7A7167] font-mono">{ord.customerEmail}</p>
                  </td>
                  <td className="px-5 py-3 font-serif font-bold text-[#1A1817]">
                    ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                        ord.paymentStatus === 'SUCCEEDED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : ord.paymentStatus === 'FAILED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#7A7167] font-mono">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="px-2.5 py-1 text-xs text-[#722F37] hover:bg-[#722F37]/10 rounded font-medium transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
