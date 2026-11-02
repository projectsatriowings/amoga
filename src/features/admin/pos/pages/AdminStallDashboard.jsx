import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
  User,
  Clock,
  Eye,
  Truck,
  Package,
  MapPin,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';
import { PosReceiptModal } from '../components/PosReceiptModal';

export function AdminStallDashboard() {
  const [period, setPeriod] = useState('today'); // Default to Today
  const [stats, setStats] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected bill for receipt modal
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, invRes, locsRes, salesRes, transfersRes] = await Promise.all([
        posApi.getReports({
          period,
          stallEventId: selectedLocationId || undefined,
          stockLocationId: selectedLocationId || undefined,
        }),
        posApi.getStallInventoryReport(selectedLocationId ? { stockLocationId: selectedLocationId } : {}),
        posApi.listLocations(),
        posApi.listSales({ limit: 6, stallEventId: selectedLocationId || undefined }),
        posApi.listTransfers({ limit: 5 }),
      ]);

      if (reportsRes?.summary || reportsRes?.report?.summary) {
        setStats(reportsRes);
      }
      if (invRes?.report) {
        setInventoryReport(invRes.report);
      }
      if (locsRes?.locations) {
        setLocations(locsRes.locations);
      }
      if (salesRes?.sales) {
        setRecentBills(salesRes.sales);
      }
      if (transfersRes?.transfers) {
        setRecentTransfers(transfersRes.transfers);
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

  const summary = stats?.summary || stats?.report?.summary || {};
  const paymentBreakdown =
    stats?.paymentMethodBreakdown ||
    (stats?.report?.paymentBreakdown
      ? Object.entries(stats.report.paymentBreakdown).map(([method, d]) => ({
          method,
          count: d.count,
          totalAmount: d.amount,
        }))
      : []);

  const lowStockItems = inventoryReport?.lowStockItems || [];
  const outOfStockItems = inventoryReport?.outOfStockItems || [];
  const locationsSummary = inventoryReport?.locationsSummary || [];
  const stallSales = stats?.report?.stallSales || stats?.report?.eventSales || [];

  return (
    <div className="space-y-6">
      {/* Receipt Modal for Recent Bills */}
      <PosReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedSaleForReceipt(null);
        }}
        sale={selectedSaleForReceipt}
      />

      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#762F39]" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Stall Dashboard
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time multi-stall performance, location inventory telemetry, and billing overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Location Filter */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Stock Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.city ? `(${loc.city})` : ''} — {loc.type}
              </option>
            ))}
          </select>

          {/* Timeframe Filter (Default: Today) */}
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
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <span>Open POS Register</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchDashboardData}
            className="p-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Combined Sales Across Stalls) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Total */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-semibold">
              {period === 'today' ? "Today's Gross Sales" : 'Gross Stall Sales'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight tabular-nums">
            ₹{(summary.grossSales || summary.totalGrossAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="tabular-nums">
              Discounts: -₹{(summary.totalDiscounts || summary.totalDiscountAmount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-emerald-700 font-medium font-mono text-[10px]">COMBINED</span>
          </div>
        </div>

        {/* Bills Generated */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-semibold">
              {period === 'today' ? "Today's Bills Generated" : 'Bills Generated'}
            </span>
            <Receipt className="w-4 h-4 text-[#762F39]" />
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight tabular-nums">
            {summary.totalBills || summary.billsCount || summary.totalFinalizedSales || 0}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="tabular-nums">
              Avg Bill: ₹{Math.round(summary.averageBillValue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-stone-400 font-mono text-[10px]">ALL STALLS</span>
          </div>
        </div>

        {/* Net Realized Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-semibold">Net Realized Revenue</span>
            <ArrowUpRight className="w-4 h-4 text-[#8C6320]" />
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-[#762F39] tracking-tight tabular-nums">
            ₹{(summary.netSales || summary.totalNetAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="tabular-nums">
              Refunds: ₹{(summary.totalRefunds || summary.totalRefundedAmount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-stone-400 text-[10px]">Post-Discounts</span>
          </div>
        </div>

        {/* GST on Completed Sales */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs relative group">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold">
                GST on Completed Sales
              </span>
              <span
                className="inline-flex cursor-help text-stone-400 hover:text-stone-600"
                title="Calculated strictly from completed POS sales during the selected reporting period. Excludes voided, cancelled, and refunded sales. This figure is not the final amount payable to the government, as actual GST liability also depends on input tax credit (ITC) and applicable tax adjustments."
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <ShoppingBag className="w-4 h-4 text-[#3F5A35]" />
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight tabular-nums">
            ₹{(summary.gstOnCompletedSales ?? summary.totalTax ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="text-[#3F5A35] font-medium font-mono text-[10px]">
              COMPLETED ONLY (CGST+SGST)
            </span>
            <span className="text-stone-400 text-[10px] tabular-nums">
              Gross: ₹{(summary.grossCompletedSales ?? summary.grossSales ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-stone-400 leading-tight">
            Excludes voided/refunded bills (Refunded GST: ₹{(summary.refundedTax || 0).toLocaleString('en-IN')})
          </p>
        </div>
      </div>

      {/* Row 2: Sales by Individual Stall & Stock Held by Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Individual Stall */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Sales by Individual Stall
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400 uppercase">
              {period.toUpperCase()}
            </span>
          </div>

          {stallSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No finalized sales recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="pb-2">Stall Location</th>
                    <th className="pb-2 text-right">Bills Finalized</th>
                    <th className="pb-2 text-right">Net Revenue</th>
                    <th className="pb-2 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {stallSales.map((st) => {
                    const totalNet = summary.netSales || 1;
                    const pct = Math.round((Number(st.amount || 0) / totalNet) * 100);
                    return (
                      <tr key={st.name} className="hover:bg-stone-50/60">
                        <td className="py-2.5 font-medium text-stone-800">
                          <span>{st.name}</span>
                          {st.city && <span className="text-[10px] text-stone-400 block">{st.city}</span>}
                        </td>
                        <td className="py-2.5 text-right font-mono text-stone-700">
                          {st.count}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-stone-900">
                          ₹{Number(st.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-right font-mono text-stone-500">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Quantities Held at Each Stall */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8C6320]" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Stock Quantities Held at Each Stall
              </h3>
            </div>
            <Link
              to="/admin/stall/inventory"
              className="text-xs text-[#762F39] hover:underline font-medium flex items-center gap-1"
            >
              <span>Manage Balances</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {locationsSummary.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No stall inventory data recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="pb-2">Stall Name</th>
                    <th className="pb-2 text-right">Tracked SKUs</th>
                    <th className="pb-2 text-right">Units on Hand</th>
                    <th className="pb-2 text-right">Est. Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {locationsSummary.map((loc) => (
                    <tr key={loc.locationId} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-medium text-stone-800">
                        <span>{loc.locationName}</span>
                        <span className="text-[10px] font-mono text-stone-400 block">{loc.locationCode}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-stone-600">
                        {loc.totalSkus}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-stone-900">
                        {loc.totalUnitsOnHand} units
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#762F39] font-medium">
                        ₹{(loc.estimatedInventoryValuation || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Payment Summary & Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Summary */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-stone-900">Payment Summary</h3>
              <span className="text-[11px] font-mono text-stone-400 uppercase">Tender Split</span>
            </div>

            <div className="space-y-3.5">
              {paymentBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No payment transactions recorded for this period.
                </div>
              ) : (
                paymentBreakdown.map((pm) => {
                  const net = summary.netSales || summary.totalNetAmount || 0;
                  const percent = net > 0 ? Math.round((pm.totalAmount / net) * 100) : 0;

                  return (
                    <div key={pm.method} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-stone-700 flex items-center gap-1.5">
                          {pm.method === 'CASH' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {pm.method === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                          {pm.method === 'CARD' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                          {pm.method} <span className="text-stone-400 font-mono">({pm.count} bills)</span>
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          ₹{pm.totalAmount?.toLocaleString('en-IN')} <span className="text-stone-400 font-normal">({percent}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pm.method === 'CASH'
                              ? 'bg-emerald-600'
                              : pm.method === 'UPI'
                              ? 'bg-blue-600'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Payment Audit Verified</span>
            <Link to="/stall" className="text-[#762F39] hover:underline font-medium flex items-center gap-1">
              <span>Go to POS</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Low-Stock Products by Location */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Low-Stock Products by Location
              </h3>
            </div>
            <Link
              to="/admin/stall/inventory"
              className="text-xs text-[#762F39] hover:underline font-medium flex items-center gap-1"
            >
              <span>Transfer Stock</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <ShieldAlert className="w-8 h-8 mx-auto text-emerald-600/70 mb-2" />
              <p className="text-xs font-medium text-stone-600">All stall locations are adequately stocked.</p>
              <span className="text-[11px] text-stone-400">No stock threshold warnings recorded.</span>
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
                  {[...outOfStockItems, ...lowStockItems].slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-medium text-stone-800">
                        {item.stockLocation?.name || 'Stall'}
                      </td>
                      <td className="py-2.5">
                        <span className="font-medium text-stone-800 block truncate max-w-[220px]">
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
                          to={`/admin/stall/inventory?locationId=${item.stockLocation?.id || ''}`}
                          className="px-2.5 py-1 rounded bg-[#762F39]/10 hover:bg-[#762F39]/20 text-[#762F39] text-[11px] font-medium transition-colors"
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

      {/* Row 4: Recent Stock Transfers & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transfers */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Recent Stock Transfers
              </h3>
            </div>
            <Link
              to="/admin/stall/inventory"
              className="text-xs text-[#762F39] hover:underline font-medium flex items-center gap-1"
            >
              <span>View All Transfers</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTransfers.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No stock transfers recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="pb-2">Transfer #</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {recentTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-mono font-bold text-stone-900">
                        {t.transferNumber || t.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 text-stone-800">
                        <span className="font-medium">{t.sourceLocation?.name || 'Warehouse'}</span>
                        <span className="text-stone-400 mx-1">→</span>
                        <span className="font-medium text-[#762F39]">{t.destinationLocation?.name || 'Stall'}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          {t.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-stone-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif text-base font-bold text-stone-900">
                Recent Bills
              </h3>
            </div>
            <Link
              to="/stall"
              className="text-xs text-[#762F39] hover:underline font-medium flex items-center gap-1"
            >
              <span>Open POS Terminal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentBills.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              No bills finalized yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="pb-2">Bill #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {recentBills.map((sale) => (
                    <tr key={sale.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-mono font-bold text-stone-900">
                        {sale.billNumber}
                      </td>
                      <td className="py-2.5 text-stone-800">
                        <span className="block truncate max-w-[120px]">
                          {sale.customerName || 'Walk-in'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700">
                          {sale.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-stone-900">
                        ₹{Number(sale.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedSaleForReceipt(sale);
                            setShowReceiptModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
