import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';

export function AdminInventory() {
  const { adminFetch } = useAdminStore();
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [collectionId, setCollectionId] = useState('all');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'low' | 'out'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Stock Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  // Movement Log Drawer
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        collectionId,
        q: search,
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await adminFetch(`/api/admin/inventory?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load inventory');
      setInventory(json.inventory);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, collectionId, statusFilter]);

  const handleOpenAdjust = (item, variant = null) => {
    setAdjustTarget({
      productId: item.id,
      productName: item.name,
      variantId: variant ? variant.id : null,
      variantName: variant ? variant.name : null,
      currentStock: variant ? variant.stockQuantity : item.stockQuantity,
    });
    setNewStock(String(variant ? variant.stockQuantity : item.stockQuantity));
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

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await adminFetch('/api/admin/inventory/logs?limit=30');
      const json = await res.json();
      if (json.logs) setLogs(json.logs);
      setShowLogs(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Inventory & Stock Control</h1>
          <p className="text-xs text-[#7A7167]">
            Real-time multi-collection stock levels, alerts, and transactional stock adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1]"
          >
            <History className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>Movement Audit</span>
          </button>
          <button
            onClick={fetchInventory}
            className="p-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1]"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search product stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
          </div>
          <button
            onClick={() => {
              setPage(1);
              fetchInventory();
            }}
            className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520]"
          >
            Search
          </button>
        </div>

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
            <option value="low">Low Stock (≤ 10)</option>
            <option value="out">Out of Stock (≤ 0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
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
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Collection</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Variant Breakdown</th>
                  <th className="px-5 py-3 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#1A1817]">
                      <p className="line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-mono text-[#8C8377]">{item.slug}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-[#5C544C]">
                      {item.collectionName}
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold tabular-nums">
                      <span
                        className={
                          item.stockQuantity <= 0
                            ? 'text-rose-700'
                            : item.stockQuantity <= 10
                            ? 'text-amber-700'
                            : 'text-emerald-800'
                        }
                      >
                        {item.stockQuantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {item.stockQuantity <= 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono">
                          OUT OF STOCK
                        </span>
                      ) : item.stockQuantity <= 10 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono">
                          LOW STOCK ALERT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono">
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="space-y-1">
                          {item.variants.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-[11px] bg-white px-2 py-0.5 rounded border border-[#E5E0D5]">
                              <span className="text-[#4A423B]">{v.name}:</span>
                              <span className="font-sans font-semibold tabular-nums text-[#1A1817]">{v.stockQuantity} u</span>
                              <button
                                onClick={() => handleOpenAdjust(item, v)}
                                className="text-[10px] text-[#722F37] hover:underline ml-2"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8C8377] font-mono">Single Stock</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-2.5 py-1 bg-[#EFEAE1] hover:bg-[#E5E0D5] border border-[#DFD8CC] rounded text-xs font-medium text-[#4A423B] transition-colors"
                      >
                        Adjust
                      </button>
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
          itemName="products"
        />
      </div>

      {/* Adjust Stock Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
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
              <div className="flex items-center justify-between p-3 bg-[#F5F2EB] rounded border border-[#E0D9CD] text-xs">
                <span className="text-[#7A7167]">Current Recorded Stock:</span>
                <span className="font-mono font-bold text-base text-[#1A1817]">
                  {adjustTarget.currentStock} units
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  New Stock Count (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-sm font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
                />
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

      {/* Movement Audit Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Inventory Movement Audit Trail</h3>
                <p className="text-xs text-[#7A7167]">Append-only log of physical and manual adjustments</p>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="text-xs px-2 py-1 text-[#7A7167] hover:text-[#1A1817]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-[#7A7167] italic text-center py-6">No adjustment logs recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A1817]">
                        {log.product?.name} {log.variant ? `(${log.variant.name})` : ''}
                      </span>
                      <span className={`font-mono font-bold ${log.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {log.delta > 0 ? `+${log.delta}` : log.delta} units
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C544C]">{log.reason}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#8C8377] font-mono pt-1 border-t border-[#F0EBE1]">
                      <span>Adjusted by: {log.adminEmail}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
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
