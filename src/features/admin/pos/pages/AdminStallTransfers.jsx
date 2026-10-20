import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  ArrowRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  Package,
  Layers,
  History,
  Trash2,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';
import { useAdminStore } from '../../store/useAdminStore';

export function AdminStallTransfers() {
  const { admin } = useAdminStore();
  const [searchParams] = useSearchParams();
  const urlToLocationId = searchParams.get('toLocationId');
  const urlFromLocationId = searchParams.get('fromLocationId');

  const [locations, setLocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

  // Transfer creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Source stock available items
  const [sourceInventory, setSourceInventory] = useState([]);
  const [isLoadingSourceStock, setIsLoadingSourceStock] = useState(false);

  // Line items for the transfer
  const [transferItems, setTransferItems] = useState([
    { productId: '', variantId: '', quantity: 1, availableStock: 0, productName: '', sku: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load locations and transfer history
  const loadInitialData = async () => {
    setIsLoadingTransfers(true);
    try {
      const [locsRes, transRes] = await Promise.all([
        posApi.listLocations(),
        posApi.listTransfers(),
      ]);

      if (locsRes?.locations) {
        setLocations(locsRes.locations);
        const wh =
          (urlFromLocationId && locsRes.locations.find((l) => l.id === urlFromLocationId)) ||
          locsRes.locations.find((l) => l.type === 'WAREHOUSE') ||
          locsRes.locations[0];
        const stall =
          (urlToLocationId && locsRes.locations.find((l) => l.id === urlToLocationId)) ||
          locsRes.locations.find((l) => l.type === 'STALL') ||
          locsRes.locations[1];
        if (wh) setFromLocationId(wh.id);
        if (stall) setToLocationId(stall.id);
        if (urlToLocationId) setIsModalOpen(true);
      }
      if (transRes?.transfers) {
        setTransfers(transRes.transfers);
      }
    } catch (err) {
      console.error('Failed to load initial transfer data:', err);
      setFeedback({ type: 'error', message: 'Failed to load transfer history.' });
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When source location changes, fetch its current available stock
  useEffect(() => {
    if (!fromLocationId) return;
    async function fetchSourceStock() {
      setIsLoadingSourceStock(true);
      try {
        const res = await posApi.getLocationInventory(fromLocationId);
        if (res?.inventory || res?.items) {
          setSourceInventory(res.inventory || res.items);
        }
      } catch (err) {
        console.error('Failed to fetch source inventory:', err);
      } finally {
        setIsLoadingSourceStock(false);
      }
    }
    fetchSourceStock();
  }, [fromLocationId]);

  // Handle adding a line item
  const handleAddItemRow = () => {
    setTransferItems((prev) => [
      ...prev,
      { productId: '', variantId: '', quantity: 1, availableStock: 0, productName: '', sku: '' },
    ]);
  };

  // Handle removing a line item
  const handleRemoveItemRow = (idx) => {
    setTransferItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle item selection in row
  const handleSelectProduct = (idx, invRecordId) => {
    const inv = sourceInventory.find((i) => i.id === invRecordId);
    if (!inv) return;

    setTransferItems((prev) => {
      const updated = [...prev];
      updated[idx] = {
        productId: inv.productId,
        variantId: inv.variantId || '',
        quantity: 1,
        availableStock: inv.availableQuantity,
        productName: inv.product?.name || 'Product',
        sku: inv.variant?.sku || inv.product?.sku || inv.sku || '',
      };
      return updated;
    });
  };

  // Handle row quantity change
  const handleQuantityChange = (idx, qty) => {
    const parsed = Math.max(1, parseInt(qty, 10) || 1);
    setTransferItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: parsed };
      return updated;
    });
  };

  // Submit Stock Transfer
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();

    if (!fromLocationId || !toLocationId) {
      setFeedback({ type: 'error', message: 'Please select both source and destination locations.' });
      return;
    }

    if (fromLocationId === toLocationId) {
      setFeedback({ type: 'error', message: 'Source and destination locations cannot be identical.' });
      return;
    }

    const validItems = transferItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one item to transfer.' });
      return;
    }

    // Check available source stock
    for (const item of validItems) {
      if (item.quantity > item.availableStock) {
        setFeedback({
          type: 'error',
          message: `Insufficient stock for "${item.productName}". Requested ${item.quantity}, available: ${item.availableStock}.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await posApi.createStockTransfer({
        fromLocationId,
        toLocationId,
        items: validItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
        })),
        notes: transferNotes.trim() || undefined,
      });

      setFeedback({
        type: 'success',
        message: `Transfer ${res?.transfer?.transferNumber || ''} created and stock deducted atomically!`,
      });

      setIsModalOpen(false);
      setTransferNotes('');
      setTransferItems([
        { productId: '', variantId: '', quantity: 1, availableStock: 0, productName: '', sku: '' },
      ]);
      loadInitialData();
    } catch (err) {
      console.error('Failed to create stock transfer:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Stock transfer failed.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-xs ${
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#762F39]" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Stock Transfers Workflow
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Dispatch inventory from Central Warehouse to temporary stalls with database transaction locks and live balance validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Stock Transfer</span>
          </button>

          <button
            onClick={loadInitialData}
            className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-600"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingTransfers ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transfers History Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#762F39]" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Stock Transfer History & Reconciliations
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            {transfers.length} transfers recorded
          </span>
        </div>

        {isLoadingTransfers ? (
          <div className="py-16 text-center text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
            <span className="text-xs font-mono">Loading transfer records...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Layers className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">No stock transfers recorded yet.</p>
            <span className="text-xs text-stone-400">
              Click &quot;Create New Stock Transfer&quot; to transfer items from Central Warehouse to a Stall.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transfer Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">From Location</th>
                  <th className="py-3 px-3">To Destination</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Notes / Reason</th>
                  <th className="py-3 px-3">Authorizer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {transfers.map((t) => {
                  const totalUnits = t.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  return (
                    <tr key={t.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {t.transferNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 font-medium text-stone-800">
                        {t.sourceLocation?.name || t.fromLocation?.name || 'Central Warehouse'}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#762F39]">
                        {t.destinationLocation?.name || t.toLocation?.name || 'Stall'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 font-sans tabular-nums text-[11px] font-bold text-stone-800">
                          {totalUnits} units ({t.items?.length || 0} SKUs)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 truncate max-w-[200px]">
                        {t.notes || t.reason || 'Stall stock replenishment'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                        {t.initiatedByEmail || t.creator?.name || 'Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TRANSFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#762F39]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  New Stock Transfer Operation
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              {/* Source & Destination Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-stone-600 mb-1">
                    Source Location (Dispatch From)
                  </label>
                  <select
                    value={fromLocationId}
                    onChange={(e) => setFromLocationId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-stone-600 mb-1">
                    Destination Location (Receive At)
                  </label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-mono tracking-wider text-stone-600 font-semibold">
                    Items to Transfer
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-[#762F39] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Item
                  </button>
                </div>

                {isLoadingSourceStock ? (
                  <div className="py-4 text-center text-xs text-stone-500">
                    Loading source stock items...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {transferItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs"
                      >
                        {/* Product Picker */}
                        <select
                          value={
                            sourceInventory.find(
                              (i) =>
                                i.productId === item.productId &&
                                (i.variantId || '') === (item.variantId || '')
                            )?.id || ''
                          }
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          required
                          className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs focus:outline-none"
                        >
                          <option value="">-- Choose Product from Source --</option>
                          {sourceInventory.map((inv) => (
                            <option
                              key={inv.id}
                              value={inv.id}
                              disabled={inv.availableQuantity <= 0}
                            >
                              {inv.displayName || inv.productName || inv.product?.name} — Available: {inv.availableQuantity}
                            </option>
                          ))}
                        </select>

                        {/* Quantity Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock || 9999}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className="w-16 px-2 py-1 bg-white border border-stone-300 rounded font-mono font-bold text-center text-xs"
                          />
                        </div>

                        {/* Available Stock Tag */}
                        <span className="text-[10px] font-mono text-stone-500 w-24 text-right">
                          Max: {item.availableStock}
                        </span>

                        {/* Remove Row Button */}
                        {transferItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] uppercase font-mono tracking-wider text-stone-600 mb-1">
                  Transfer Reason / Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Opening stock replenishment for Chennai Trade Fair 2026, authorized by Store Manager"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transferring with Atomic Lock...</span>
                    </>
                  ) : (
                    <span>Execute Stock Transfer</span>
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
