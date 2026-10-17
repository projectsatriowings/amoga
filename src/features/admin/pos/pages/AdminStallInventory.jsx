import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertTriangle,
  History,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  X,
  MapPin,
  Package,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';
import { useAdminStore } from '../../store/useAdminStore';

const COLLECTIONS = [
  { id: 'all', label: 'All Collections' },
  { id: 'food', label: 'Wholesome Pantry' },
  { id: 'tea', label: 'Wellness Tea' },
  { id: 'sarees', label: 'Heritage Sarees' },
  { id: 'jewellery', label: 'Silver Jewellery' },
];

export function AdminStallInventory() {
  const { admin } = useAdminStore();
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'movements'

  // Location filter
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // Balances state
  const [balances, setBalances] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  // Movement Ledger state
  const [movementLogs, setMovementLogs] = useState([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Manual Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [adjustQuantityChange, setAdjustQuantityChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Threshold Configuration Modal state
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState('5');
  const [isSubmittingThreshold, setIsSubmittingThreshold] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load locations
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await posApi.listLocations();
        if (res?.locations) {
          setLocations(res.locations);
          if (res.locations.length > 0 && !selectedLocationId) {
            // Default to first stall or first location
            const stall = res.locations.find((l) => l.type === 'STALL') || res.locations[0];
            setSelectedLocationId(stall.id);
          }
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    }
    loadLocations();
  }, []);

  // Fetch balances for selected location
  const fetchBalances = async () => {
    if (!selectedLocationId) return;
    setIsLoadingBalances(true);
    try {
      const res = await posApi.getLocationInventory(selectedLocationId, {
        collectionId: selectedCollection !== 'all' ? selectedCollection : undefined,
        query: searchQuery || undefined,
        stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
      });
      if (res?.inventory) {
        setBalances(res.inventory);
      }
    } catch (err) {
      console.error('Failed to load inventory balances:', err);
      setFeedback({ type: 'error', message: 'Failed to load stock balances.' });
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch movement logs
  const fetchMovements = async () => {
    setIsLoadingMovements(true);
    try {
      const res = await posApi.listMovementLogs({
        stockLocationId: selectedLocationId || undefined,
        limit: 50,
      });
      if (res?.logs) {
        setMovementLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load movement logs:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances();
    } else {
      fetchMovements();
    }
  }, [selectedLocationId, selectedCollection, stockStatusFilter, activeTab]);

  // Handle manual adjustment submission
  const handlePerformAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust || !adjustQuantityChange || !adjustReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both quantity change and an audit reason.' });
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await posApi.adjustStock({
        stockLocationId: selectedLocationId,
        productId: selectedItemForAdjust.productId,
        variantId: selectedItemForAdjust.variantId || undefined,
        quantityChange: Number(adjustQuantityChange),
        reason: adjustReason.trim(),
      });

      setFeedback({ type: 'success', message: 'Stock adjustment recorded with audit log.' });
      setAdjustModalOpen(false);
      setSelectedItemForAdjust(null);
      setAdjustQuantityChange('');
      setAdjustReason('');
      fetchBalances();
    } catch (err) {
      console.error('Adjustment failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to adjust stock.',
      });
    } finally {
      setIsSubmittingAdjust(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  // Filter balances locally if search query is typed
  const displayedBalances = balances.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (b.product?.name || '').toLowerCase().includes(q);
    const skuMatch = (b.variant?.sku || b.product?.sku || b.sku || '').toLowerCase().includes(q);
    return nameMatch || skuMatch;
  });

  const activeLocationObj = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between shadow-sm ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', message: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Location Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#762F39]" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Stall & Location Inventory Balances
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Isolate stock across Central Warehouse and independent Stalls without affecting online storefront stock.
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5">
            <MapPin className="w-4 h-4 text-[#762F39]" />
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => (activeTab === 'balances' ? fetchBalances() : fetchMovements())}
            className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-600"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingBalances || isLoadingMovements ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Location Details Card */}
      {activeLocationObj && (
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold ${
                activeLocationObj.type === 'STALL'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {activeLocationObj.type === 'STALL' ? '🎪 STALL / EVENT' : '🏢 WAREHOUSE'}
            </span>
            <div>
              <span className="font-bold text-stone-800 block">{activeLocationObj.name}</span>
              <span className="text-stone-500 font-mono text-[11px]">
                CODE: {activeLocationObj.code} • STATUS: {activeLocationObj.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-stone-500 font-mono text-[11px] block">
              Total Tracked SKUs at this location:
            </span>
            <span className="font-bold text-stone-800 text-sm font-mono">
              {displayedBalances.length} products
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'balances'
              ? 'border-[#762F39] text-[#762F39] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Stock Balances & On-Hand
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'border-[#762F39] text-[#762F39] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Ledger & Stock Movements</span>
        </button>
      </div>

      {/* TAB 1: Stock Balances Table */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
              />
            </div>

            {/* Collection Filter */}
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none"
            >
              {COLLECTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock Only (&gt; 0)</option>
              <option value="low_stock">Low Stock (≤ Threshold)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Balances Data Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            {isLoadingBalances ? (
              <div className="py-16 text-center text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
                <span className="text-xs font-mono">Loading inventory balances...</span>
              </div>
            ) : displayedBalances.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Package className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-stone-300" />
                <p className="text-sm font-medium text-stone-600">No inventory records found.</p>
                <span className="text-xs text-stone-400">
                  Transfer stock from Central Warehouse to initialize inventory for this stall.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Product / Item</th>
                      <th className="py-3 px-3">Variant / SKU</th>
                      <th className="py-3 px-3">Collection</th>
                      <th className="py-3 px-3 text-right">On-Hand</th>
                      <th className="py-3 px-3 text-right">Reserved</th>
                      <th className="py-3 px-3 text-right">Available</th>
                      <th className="py-3 px-3 text-right">Threshold</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {displayedBalances.map((item) => {
                      const avail = item.availableQuantity;
                      const isLow = avail > 0 && avail <= item.lowStockThreshold;
                      const isOut = avail <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-medium text-stone-900">
                            <span className="block truncate max-w-[220px]">
                              {item.product?.name || 'Amoga Product'}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ID: {item.productId.slice(0, 10)}...
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-stone-700 block">
                              {item.variant?.sku || item.product?.sku || item.sku || '—'}
                            </span>
                            {item.variant?.name && (
                              <span className="text-[10px] text-stone-500 block">
                                {item.variant.name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600 capitalize">
                            {item.product?.collectionId || 'Pantry'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-stone-700">
                            {item.onHandQuantity}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-stone-400">
                            {item.reservedQuantity || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                            {item.availableQuantity}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-stone-500">
                            {item.lowStockThreshold}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItemForAdjust(item);
                                setAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {/* TAB 2: Movement History Ledger */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Audited Stock Movement Ledger
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              Showing last 50 transactions
            </span>
          </div>

          {isLoadingMovements ? (
            <div className="py-16 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
              <span className="text-xs font-mono">Loading ledger logs...</span>
            </div>
          ) : movementLogs.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <p className="text-sm font-medium">No movement entries logged for this location yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Product / SKU</th>
                    <th className="py-3 px-3 text-right">Qty Delta</th>
                    <th className="py-3 px-3 text-right">Balance After</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                    <th className="py-3 px-3">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {movementLogs.map((log) => {
                    const isPositive = log.quantityDelta > 0;
                    return (
                      <tr key={log.id} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-stone-500">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              log.movementType === 'STALL_POS'
                                ? 'bg-purple-100 text-purple-800'
                                : log.movementType === 'TRANSFER_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.movementType === 'TRANSFER_OUT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {log.movementType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-stone-800 block truncate max-w-[200px]">
                            {log.product?.name || 'Product'}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {log.variant?.sku || log.product?.sku || 'SKU'}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${log.quantityDelta}` : log.quantityDelta}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-800">
                          {log.quantityAfter}
                        </td>
                        <td className="py-2.5 px-4 text-stone-600">
                          <span className="block truncate max-w-[240px]">
                            {log.reason || log.referenceId || 'Manual Movement'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                          {log.actor?.name || 'Staff'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#762F39]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Audited Stock Adjustment
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-medium text-stone-800">
                {selectedItemForAdjust.product?.name}
              </div>
              <div className="text-stone-500 font-mono">
                SKU: {selectedItemForAdjust.variant?.sku || selectedItemForAdjust.product?.sku}
              </div>
              <div className="text-stone-700 font-mono font-bold">
                Current Stall Available: {selectedItemForAdjust.availableQuantity} units
              </div>
            </div>

            <form onSubmit={handlePerformAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Quantity Delta (+ to add, - to subtract)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQuantityChange}
                  onChange={(e) => setAdjustQuantityChange(e.target.value)}
                  placeholder="e.g. +5 or -2"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory count discrepancy, damaged packaging, or opening balance initialization"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmittingAdjust ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Audit Entry...</span>
                    </>
                  ) : (
                    <span>Commit Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
