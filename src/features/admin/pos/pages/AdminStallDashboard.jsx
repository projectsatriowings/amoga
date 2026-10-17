import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';

export function AdminStallDashboard() {
  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month' | 'year'
  const [stats, setStats] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, invRes, locsRes] = await Promise.all([
        posApi.getReports({ period }),
        posApi.getStallInventoryReport(selectedLocationId ? { stockLocationId: selectedLocationId } : {}),
        posApi.listLocations(),
      ]);

      if (reportsRes?.summary) {
        setStats(reportsRes);
      }
      if (invRes?.report) {
        setInventoryReport(invRes.report);
      }
      if (locsRes?.locations) {
        setLocations(locsRes.locations);
      }
    } catch (err) {
      console.error('Failed to load Stall Dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, selectedLocationId]);

  const summary = stats?.summary || {};
  const paymentBreakdown = stats?.paymentMethodBreakdown || [];
  const lowStockItems = inventoryReport?.lowStockItems || [];
  const outOfStockItems = inventoryReport?.outOfStockItems || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#762F39]" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Stall Management & POS Dashboard
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time aggregates, stall sales performance, and multi-location inventory telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Location Filter */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none"
          >
            <option value="">All Stock Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.type})
              </option>
            ))}
          </select>

          {/* Timeframe Filter */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Launch POS App */}
          <Link
            to="/stall"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <span>Open Register</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchDashboardData}
            className="p-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Gross Stall Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            ₹{summary.totalGrossAmount?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Discounts: -₹{summary.totalDiscountAmount?.toLocaleString('en-IN') || '0'}</span>
            <span className="text-emerald-700 font-medium">GST-Inclusive</span>
          </div>
        </div>

        {/* Finalized Bills */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Finalized Bills</span>
            <Receipt className="w-4 h-4 text-[#762F39]" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            {summary.totalFinalizedSales || 0}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Avg Bill: ₹{Math.round(summary.averageBillValue || 0)}</span>
            <span className="text-stone-400 font-mono">100% Tax Compliant</span>
          </div>
        </div>

        {/* Net Realized Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Net Sales (Post-Refunds)</span>
            <ArrowUpRight className="w-4 h-4 text-[#8C6320]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#762F39]">
            ₹{summary.totalNetAmount?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Refunded: ₹{summary.totalRefundedAmount?.toLocaleString('en-IN') || '0'}</span>
            <span className="text-stone-400">({summary.totalRefundedSales || 0} bills)</span>
          </div>
        </div>

        {/* GST Collected */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">GST Audit Total</span>
            <ShoppingBag className="w-4 h-4 text-[#3F5A35]" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            ₹{summary.totalGstCollected?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Taxable: ₹{summary.totalTaxableAmount?.toLocaleString('en-IN') || '0'}</span>
            <span className="text-[#3F5A35] font-medium">HSN Verified</span>
          </div>
        </div>
      </div>

      {/* Second Row: Payment Breakdown & Low Stock Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-stone-900">Sales by Payment Mode</h3>
              <span className="text-[11px] font-mono text-stone-400 uppercase">Tender Summary</span>
            </div>

            <div className="space-y-3">
              {paymentBreakdown.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">No payment transactions in this period.</p>
              ) : (
                paymentBreakdown.map((pm) => {
                  const percent =
                    summary.totalNetAmount > 0
                      ? Math.round((pm.totalAmount / summary.totalNetAmount) * 100)
                      : 0;

                  return (
                    <div key={pm.method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-stone-700 flex items-center gap-1.5">
                          {pm.method === 'CASH' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {pm.method === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                          {pm.method === 'CARD' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                          {pm.method} ({pm.count} bills)
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          ₹{pm.totalAmount?.toLocaleString('en-IN')} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pm.method === 'CASH'
                              ? 'bg-emerald-600'
                              : pm.method === 'UPI'
                              ? 'bg-blue-600'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Active Tender Channels</span>
            <Link to="/admin/pos/reports" className="text-[#762F39] hover:underline flex items-center gap-1">
              <span>View full report</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Low Stock & Out of Stock Alerts */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Stall Stock Health & Reorder Alerts
              </h3>
            </div>
            <Link
              to="/admin/stall/transfers"
              className="text-xs text-[#762F39] hover:underline font-medium flex items-center gap-1"
            >
              <span>Create Stock Transfer</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <ShieldAlert className="w-8 h-8 mx-auto text-emerald-600/70 mb-2" />
              <p className="text-xs font-medium text-stone-600">All stall locations are adequately stocked.</p>
              <span className="text-[11px] text-stone-400">No low stock warnings recorded.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Product / SKU</th>
                    <th className="pb-2 text-right">Available</th>
                    <th className="pb-2 text-right">Threshold</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {[...outOfStockItems, ...lowStockItems].slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-medium text-stone-800">
                        {item.stockLocation?.name || 'Stall'}
                      </td>
                      <td className="py-2.5">
                        <span className="font-medium text-stone-800 block truncate max-w-[200px]">
                          {item.product?.name || item.variant?.name}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          {item.variant?.sku || item.product?.sku || item.sku}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold">
                        {item.availableQuantity}
                      </td>
                      <td className="py-2.5 text-right font-mono text-stone-500">
                        {item.lowStockThreshold}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            item.availableQuantity <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.availableQuantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to="/admin/stall/transfers"
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium"
                        >
                          Transfer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/stall"
          target="_blank"
          className="p-4 bg-white rounded-xl border border-stone-200 hover:border-[#762F39] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Store className="w-5 h-5 text-[#762F39]" />
            <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-[#762F39]" />
          </div>
          <h4 className="font-serif font-bold text-stone-900 group-hover:text-[#762F39]">
            Dedicated Stall POS
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Open the touch-optimized `/stall` terminal for live counter billing.
          </p>
        </Link>

        <Link
          to="/admin/stall/inventory"
          className="p-4 bg-white rounded-xl border border-stone-200 hover:border-[#762F39] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Layers className="w-5 h-5 text-[#3F5A35]" />
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#3F5A35]" />
          </div>
          <h4 className="font-serif font-bold text-stone-900 group-hover:text-[#3F5A35]">
            Stall Inventory Balances
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Inspect live stock balances by stall, log adjustments, and view ledger movements.
          </p>
        </Link>

        <Link
          to="/admin/stall/transfers"
          className="p-4 bg-white rounded-xl border border-stone-200 hover:border-[#762F39] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <ArrowRight className="w-5 h-5 text-[#8C6320]" />
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8C6320]" />
          </div>
          <h4 className="font-serif font-bold text-stone-900 group-hover:text-[#8C6320]">
            Stock Transfer Workflow
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Dispatch inventory from Central Warehouse to temporary stalls with audit locks.
          </p>
        </Link>

        <Link
          to="/admin/pos/history"
          className="p-4 bg-white rounded-xl border border-stone-200 hover:border-[#762F39] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-purple-700" />
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-purple-700" />
          </div>
          <h4 className="font-serif font-bold text-stone-900 group-hover:text-purple-700">
            Bills & Sales History
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Search invoices, re-send WhatsApp receipts, process refunds and view tax details.
          </p>
        </Link>
      </div>
    </div>
  );
}
