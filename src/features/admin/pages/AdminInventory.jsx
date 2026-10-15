import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  History,
  X,
  Bell,
  Sliders,
  Mail,
  Users,
  Package,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminInventory() {
  const { adminFetch } = useAdminStore();
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [summary, setSummary] = useState({
    totalTrackedSkus: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingRestockSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [collectionId, setCollectionId] = useState('all');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'low' | 'out'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);

  // Stock Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  // Threshold Edit Modal
  const [thresholdTarget, setThresholdTarget] = useState(null);
  const [newThreshold, setNewThreshold] = useState('');
  const [thresholdSubmitting, setThresholdSubmitting] = useState(false);
  const [thresholdError, setThresholdError] = useState(null);

  // Movement Log Drawer
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Subscriptions Drawer
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);

  // Alerts Drawer
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Lock body and backdrop scrolling
  useBodyScrollLock(
    Boolean(adjustTarget || showLogs || thresholdTarget || showSubscriptions || showAlerts)
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (adjustTarget && !submitting) setAdjustTarget(null);
        if (thresholdTarget && !thresholdSubmitting) setThresholdTarget(null);
        if (showLogs) setShowLogs(false);
        if (showSubscriptions) setShowSubscriptions(false);
        if (showAlerts) setShowAlerts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    adjustTarget,
    thresholdTarget,
    showLogs,
    showSubscriptions,
    showAlerts,
    submitting,
    thresholdSubmitting,
  ]);

  // Live auto-search debounce: start filtering automatically as words are typed
  useEffect(() => {
    if (search !== debouncedSearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInventory = async (targetPage = page, query = debouncedSearch) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '10',
        collectionId,
        q: query || '',
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await adminFetch(`/api/admin/inventory?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load inventory');
      setInventory(json.inventory);
      setPagination(json.pagination);
      if (json.summary) {
        setSummary(json.summary);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchInventory(page, debouncedSearch);
  }, [page, collectionId, statusFilter, debouncedSearch]);

  const handleOpenAdjust = (item, variant = null) => {
    const onHand = variant
      ? (variant.onHandQuantity ?? variant.onHand ?? variant.stockQuantity ?? 0)
      : (item.onHandQuantity ?? item.onHand ?? item.stockQuantity ?? 0);
    const reserved = variant
      ? (variant.reservedQuantity ?? variant.reserved ?? 0)
      : (item.reservedQuantity ?? item.reserved ?? 0);
    const available = variant
      ? (variant.availableQuantity ?? variant.available ?? Math.max(0, onHand - reserved))
      : (item.availableQuantity ?? item.available ?? Math.max(0, onHand - reserved));

    setAdjustTarget({
      productId: item.id,
      productName: item.name,
      variantId: variant ? variant.id : null,
      variantName: variant ? variant.name : null,
      currentStock: onHand,
      reserved,
      available,
    });
    setNewStock(String(onHand));
    setReason('');
    setAdjustError(null);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget || newStock === '' || !reason.trim()) return;
    setSubmitting(true);
    setAdjustError(null);

    try {
      const res = await adminFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: adjustTarget.productId,
          variantId: adjustTarget.variantId,
          newStock: parseInt(newStock, 10),
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to adjust stock');

      setAdjustTarget(null);
      fetchInventory();
    } catch (err) {
      setAdjustError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenThreshold = (item, variant = null) => {
    const currentThreshold = variant
      ? variant.lowStockThreshold ?? item.lowStockThreshold ?? 5
      : item.lowStockThreshold ?? 5;

    setThresholdTarget({
      productId: item.id,
      productName: item.name,
      variantId: variant ? variant.id : null,
      variantName: variant ? variant.name : null,
      currentThreshold,
    });
    setNewThreshold(String(currentThreshold));
    setThresholdError(null);
  };

  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    if (!thresholdTarget || newThreshold === '') return;
    setThresholdSubmitting(true);
    setThresholdError(null);

    try {
      const res = await adminFetch('/api/admin/inventory/threshold', {
        method: 'PUT',
        body: JSON.stringify({
          productId: thresholdTarget.productId,
          variantId: thresholdTarget.variantId,
          lowStockThreshold: parseInt(newThreshold, 10),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update threshold');

      setThresholdTarget(null);
      fetchInventory();
    } catch (err) {
      setThresholdError(err.message);
    } finally {
      setThresholdSubmitting(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await adminFetch('/api/admin/inventory/logs?limit=40');
      const json = await res.json();
      if (json.logs) setLogs(json.logs);
      setShowLogs(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const res = await adminFetch('/api/admin/inventory/subscriptions?limit=50');
      const json = await res.json();
      if (json.subscriptions) setSubscriptions(json.subscriptions);
      setShowSubscriptions(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await adminFetch('/api/admin/inventory/alerts?limit=50');
      const json = await res.json();
      if (json.alerts) setAlerts(json.alerts);
      setShowAlerts(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setAlertsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Inventory & Stock Control</h1>
          <p className="text-xs text-[#7A7167]">
            Real-time multi-collection stock levels, alerts, and transactional stock adjustments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchAlerts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-700" />
            <span>Stock Alerts</span>
          </button>
          <button
            type="button"
            onClick={fetchSubscriptions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-blue-700" />
            <span>Restock Subscriptions ({summary.pendingRestockSubscriptions || 0})</span>
          </button>
          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>Movement Audit</span>
          </button>
          <button
            onClick={() => fetchInventory()}
            className="p-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E5E0D5] space-y-1">
          <div className="flex items-center justify-between text-[#7A7167]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Tracked Products</span>
            <Package className="w-4 h-4 text-[#8C8377]" />
          </div>
          <p className="text-2xl font-bold font-sans tabular-nums text-[#1A1817]">
            {summary.totalTrackedSkus || pagination.total || 0}
          </p>
          <p className="text-[10px] text-[#7A7167]">Active catalog items</p>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-amber-200/80 space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-mono uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-sans tabular-nums text-amber-900">
            {summary.lowStockCount || 0}
          </p>
          <p className="text-[10px] text-amber-700">Near or below threshold</p>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-rose-200/80 space-y-1 bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-mono uppercase tracking-wider">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-sans tabular-nums text-rose-900">
            {summary.outOfStockCount || 0}
          </p>
          <p className="text-[10px] text-rose-700">Zero available units</p>
        </div>

        <div className="bg-[#FBF9F5] p-4 rounded-xl border border-blue-200/80 space-y-1 bg-blue-50/20">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[11px] font-mono uppercase tracking-wider">Restock Waitlist</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-sans tabular-nums text-blue-900">
            {summary.pendingRestockSubscriptions || 0}
          </p>
          <p className="text-[10px] text-blue-700">Subscribers awaiting alerts</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchInventory(1, search);
          }}
          className="flex-1 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search by product name, slug, or variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#8C8377] animate-spin" />
            ) : search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
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
            value={collectionId}
            onChange={(e) => {
              setCollectionId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="all">All Collections</option>
            <option value="food">Wholesome Pantry</option>
            <option value="tea">Wellness Tea</option>
            <option value="sarees">Heritage Sarees</option>
            <option value="jewellery">Silver Jewellery</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading && inventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading live stock records...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No inventory records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Collection</th>
                  <th className="px-4 py-3 text-center">On-Hand</th>
                  <th className="px-4 py-3 text-center">Reserved</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3 text-center">Threshold</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Variant Breakdown</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {inventory.map((item) => {
                  const onHand = item.onHandQuantity ?? item.onHand ?? item.stockQuantity ?? 0;
                  const reserved = item.reservedQuantity ?? item.reserved ?? 0;
                  const available = item.availableQuantity ?? item.available ?? Math.max(0, onHand - reserved);
                  const threshold = item.lowStockThreshold ?? 5;
                  const isOutOfStock = available <= 0;
                  const isLowStock = available > 0 && available <= threshold;

                  return (
                    <tr key={item.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1A1817]">
                        <p className="line-clamp-1">{item.name}</p>
                        <p className="text-[10px] font-mono text-[#8C8377]">{item.slug}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#5C544C]">
                        {item.collectionName}
                      </td>
                      <td className="px-4 py-3 text-center font-sans font-semibold tabular-nums text-[#1A1817]">
                        {onHand}
                      </td>
                      <td className="px-4 py-3 text-center font-sans tabular-nums text-[#8C6320]">
                        {reserved > 0 ? (
                          <span className="font-semibold text-amber-700">{reserved}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-sans font-bold tabular-nums">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-rose-700'
                              : isLowStock
                              ? 'text-amber-700'
                              : 'text-emerald-800'
                          }
                        >
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-[#7A7167]">
                        <button
                          type="button"
                          onClick={() => handleOpenThreshold(item)}
                          className="hover:underline hover:text-[#722F37] cursor-pointer inline-flex items-center gap-1"
                          title="Click to edit low-stock alert threshold"
                        >
                          <span>{threshold}</span>
                          <Sliders className="w-3 h-3 opacity-60" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono whitespace-nowrap">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono whitespace-nowrap">
                            LOW STOCK ({available})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono whitespace-nowrap">
                            IN STOCK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.variants && item.variants.length > 0 ? (
                          <div className="space-y-1 max-w-xs">
                            {item.variants.map((v) => {
                              const vOnHand = v.onHandQuantity ?? v.onHand ?? v.stockQuantity ?? 0;
                              const vReserved = v.reservedQuantity ?? v.reserved ?? 0;
                              const vAvail = v.availableQuantity ?? v.available ?? Math.max(0, vOnHand - vReserved);
                              const vThreshold = v.lowStockThreshold ?? threshold;

                              return (
                                <div
                                  key={v.id}
                                  className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-[#E5E0D5] gap-2"
                                >
                                  <span className="text-[#4A423B] truncate">{v.name}:</span>
                                  <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                                    <span title="On-Hand">{vOnHand}h</span>
                                    {vReserved > 0 && (
                                      <span className="text-amber-700" title="Reserved">
                                        ({vReserved}r)
                                      </span>
                                    )}
                                    <strong
                                      className={
                                        vAvail <= 0
                                          ? 'text-rose-700'
                                          : vAvail <= vThreshold
                                          ? 'text-amber-700'
                                          : 'text-emerald-700'
                                      }
                                      title="Available"
                                    >
                                      ={vAvail}a
                                    </strong>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleOpenThreshold(item, v)}
                                      className="text-[10px] text-[#7A7167] hover:text-[#722F37]"
                                      title="Edit variant threshold"
                                    >
                                      <Sliders className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenAdjust(item, v)}
                                      className="text-[10px] text-[#722F37] hover:underline font-medium"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8C8377] font-mono">Single SKU</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-2.5 py-1 bg-[#EFEAE1] hover:bg-[#E5E0D5] border border-[#DFD8CC] rounded text-xs font-medium text-[#4A423B] transition-colors cursor-pointer"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
          itemName="products"
        />
      </div>

      {/* Adjust Stock Modal */}
      {adjustTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setAdjustTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl overscroll-contain select-text"
          >
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">Adjust Inventory Stock</h3>
              <p className="text-xs text-[#7A7167]">
                {adjustTarget.productName}
                {adjustTarget.variantName ? ` (${adjustTarget.variantName})` : ''}
              </p>
            </div>

            {adjustError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Current Stock Metrics Pill */}
              {(() => {
                const parsedNewStock = parseInt(newStock, 10);
                const isNewStockSpecified = !isNaN(parsedNewStock) && parsedNewStock >= 0;
                const dynamicAvailable = isNewStockSpecified
                  ? Math.max(0, parsedNewStock - (adjustTarget.reserved || 0))
                  : adjustTarget.available;

                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F2EB] rounded border border-[#E0D9CD] text-xs text-center">
                    <div>
                      <span className="text-[#7A7167] block text-[10px]">On-Hand</span>
                      <span className="font-mono font-bold text-sm text-[#1A1817]">
                        {adjustTarget.currentStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7A7167] block text-[10px]">Reserved</span>
                      <span className="font-mono font-bold text-sm text-amber-700">
                        {adjustTarget.reserved}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7A7167] block text-[10px]">Available</span>
                      <span className="font-mono font-bold text-sm text-emerald-800">
                        {dynamicAvailable}
                        {isNewStockSpecified && parsedNewStock !== adjustTarget.currentStock && (
                          <span className="text-[10px] text-[#7A7167] font-normal ml-1">
                            (was {adjustTarget.available})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  New Physical On-Hand Count (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-sm font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
                />
                <p className="text-[10px] text-[#7A7167] mt-1">
                  Available quantity will automatically update to (New On-Hand minus active Reservations).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Reason for Adjustment (Mandatory Audit Trail) *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] mb-2"
                >
                  <option value="">Select reason...</option>
                  <option value="Restocked from artisan workshop">Restocked from artisan workshop</option>
                  <option value="Physical audit inventory reconciliation">Physical audit inventory reconciliation</option>
                  <option value="Damaged / broken in storage">Damaged / broken in storage</option>
                  <option value="Customer return / inspection passed">Customer return / inspection passed</option>
                  <option value="Bespoke private order allocation">Bespoke private order allocation</option>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom reason note..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
                >
                  {submitting ? 'Updating Database...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {thresholdTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !thresholdSubmitting) setThresholdTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl overscroll-contain select-text"
          >
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">Configure Alert Threshold</h3>
              <p className="text-xs text-[#7A7167]">
                {thresholdTarget.productName}
                {thresholdTarget.variantName ? ` (${thresholdTarget.variantName})` : ''}
              </p>
            </div>

            {thresholdError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {thresholdError}
              </div>
            )}

            <form onSubmit={handleThresholdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Low Stock Threshold (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-sm font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
                />
                <p className="text-[10px] text-[#7A7167] mt-1">
                  When available stock drops to or below this count, a deduplicated low-stock alert is generated.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setThresholdTarget(null)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={thresholdSubmitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
                >
                  {thresholdSubmitting ? 'Saving...' : 'Save Threshold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Audit Logs Modal */}
      {showLogs && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogs(false);
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
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Inventory Movement Audit Trail</h3>
                <p className="text-xs text-[#7A7167]">Append-only log of physical and manual adjustments</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                className="text-xs px-2 py-1 text-[#7A7167] hover:text-[#1A1817] cursor-pointer"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 overscroll-contain">
              {logsLoading ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">Loading movement logs...</p>
              ) : logs.length === 0 ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">No adjustment logs recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A1817]">
                        {log.product?.name} {log.variant ? `(${log.variant.name})` : ''}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          log.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {log.delta > 0 ? `+${log.delta}` : log.delta} units
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C544C]">{log.reason}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#8C8377] font-mono pt-1 border-t border-[#F0EBE1]">
                      <span>Actor: {log.adminEmail || 'System Process'}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restock Subscriptions Drawer Modal */}
      {showSubscriptions && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubscriptions(false);
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
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Customer Restock Subscriptions</h3>
                <p className="text-xs text-[#7A7167]">Live queue of customer notifications awaiting restock events</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubscriptions(false)}
                className="text-xs px-2 py-1 text-[#7A7167] hover:text-[#1A1817] cursor-pointer"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 overscroll-contain">
              {subscriptionsLoading ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">Loading subscriptions...</p>
              ) : subscriptions.length === 0 ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">No customer restock subscriptions currently queued.</p>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A1817]">
                        {sub.product?.name} {sub.variant ? `(${sub.variant.name})` : ''}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                          sub.status === 'NOTIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sub.status === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#5C544C]">
                      <span>Destination: <strong className="font-mono">{sub.destination}</strong> ({sub.channel})</span>
                      <span>Subscribed: {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Alerts Drawer Modal */}
      {showAlerts && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAlerts(false);
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
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Inventory Threshold Alerts</h3>
                <p className="text-xs text-[#7A7167]">Deduplicated episode alerts for low-stock and out-of-stock events</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAlerts(false)}
                className="text-xs px-2 py-1 text-[#7A7167] hover:text-[#1A1817] cursor-pointer"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 overscroll-contain">
              {alertsLoading ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">Loading alerts...</p>
              ) : alerts.length === 0 ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">No stock alerts recorded.</p>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A1817]">
                        {al.product?.name} {al.variant ? `(${al.variant.name})` : ''}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                          al.type === 'OUT_OF_STOCK'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {al.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#5C544C]">
                      <span>Level: {al.stockLevel} units (threshold: {al.threshold})</span>
                      <span>Triggered: {new Date(al.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
