import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowRightLeft,
  Truck,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Users,
  Store,
  Check,
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
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'stalls' | 'transfers' | 'movements'

  // Location filter & query param sync
  const [searchParams, setSearchParams] = useSearchParams();
  const urlLocationId = searchParams.get('locationId');
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('all');

  // Balances state
  const [balances, setBalances] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  // Movement Ledger state
  const [movementLogs, setMovementLogs] = useState([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Transfers Ledger state
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // Manual Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [adjustQuantityChange, setAdjustQuantityChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Transfer from Central Warehouse Modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFromLocationId, setTransferFromLocationId] = useState('');
  const [transferToLocationId, setTransferToLocationId] = useState('');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferVariantId, setTransferVariantId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(10);
  const [transferReason, setTransferReason] = useState('Stall stock allocation');
  const [warehouseCatalog, setWarehouseCatalog] = useState([]);
  const [isLoadingWarehouseStock, setIsLoadingWarehouseStock] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Add / Edit Stall Location Modal state
  const [stallModalOpen, setStallModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState(null);
  const [stallForm, setStallForm] = useState({
    name: '',
    city: '',
    venue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    assignedStaff: '',
    code: '',
  });
  const [isSubmittingStall, setIsSubmittingStall] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load locations
  const loadLocations = async () => {
    try {
      const res = await posApi.listLocations();
      if (res?.locations && res.locations.length > 0) {
        setLocations(res.locations);

        const wh = res.locations.find((l) => l.type === 'WAREHOUSE') || res.locations[0];
        if (wh && !transferFromLocationId) setTransferFromLocationId(wh.id);

        const defaultStall = res.locations.find((l) => l.type === 'STALL') || res.locations[0];
        if (defaultStall && !transferToLocationId) setTransferToLocationId(defaultStall.id);

        if (urlLocationId && (urlLocationId === 'all' || res.locations.some((l) => l.id === urlLocationId))) {
          setSelectedLocationId(urlLocationId);
          if (urlLocationId !== 'all') setTransferToLocationId(urlLocationId);
        }
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [urlLocationId]);

  // Fetch balances for selected location (supports 'all' for combined stall view)
  const fetchBalances = async () => {
    setIsLoadingBalances(true);
    try {
      const res = await posApi.getLocationInventory(selectedLocationId || 'all', {
        collectionId: selectedCollection !== 'all' ? selectedCollection : undefined,
        query: searchQuery || undefined,
        stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
      });
      if (res?.inventory || res?.items) {
        setBalances(res.inventory || res.items);
      } else {
        setBalances([]);
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
      const locId = selectedLocationId !== 'all' ? selectedLocationId : undefined;
      const res = await posApi.listMovementLogs({
        locationId: locId,
        limit: 50,
      });
      if (res?.logs) {
        setMovementLogs(res.logs);
      } else {
        setMovementLogs([]);
      }
    } catch (err) {
      console.error('Failed to load movement logs:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  // Fetch transfer logs
  const fetchTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const locId = selectedLocationId !== 'all' ? selectedLocationId : undefined;
      const res = await posApi.listTransfers({
        destinationLocationId: locId,
        limit: 50,
      });
      if (res?.transfers) {
        setTransfers(res.transfers);
      } else {
        setTransfers([]);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances();
    } else if (activeTab === 'movements') {
      fetchMovements();
    } else if (activeTab === 'transfers') {
      fetchTransfers();
    }
  }, [selectedLocationId, selectedCollection, stockStatusFilter, activeTab]);

  // Fetch source location inventory when transfer modal opens or source changes
  useEffect(() => {
    if (transferModalOpen && transferFromLocationId) {
      async function loadWarehouseStock() {
        setIsLoadingWarehouseStock(true);
        try {
          const res = await posApi.getLocationInventory(transferFromLocationId, { limit: 150 });
          if (res?.inventory || res?.items) {
            setWarehouseCatalog(res.inventory || res.items);
          }
        } catch (err) {
          console.error('Failed to load source stock:', err);
        } finally {
          setIsLoadingWarehouseStock(false);
        }
      }
      loadWarehouseStock();
    }
  }, [transferModalOpen, transferFromLocationId]);

  // Currently selected item in transfer modal for stock availability check
  const selectedTransferItem = warehouseCatalog.find(
    (item) => (item.productId || item.id) === transferProductId
  );
  const sourceAvailableStock = selectedTransferItem
    ? (selectedTransferItem.availableQuantity ?? selectedTransferItem.onHandQuantity ?? 0)
    : 0;

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
        locationId: selectedItemForAdjust.locationId,
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
      if (activeTab === 'movements') fetchMovements();
    } catch (err) {
      console.error('Adjustment failed:', err);
      setFeedback({
        type: 'error',
        message: err.data?.message || err.message || 'Failed to adjust stock.',
      });
    } finally {
      setIsSubmittingAdjust(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  // Handle stock transfer submission
  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferFromLocationId || !transferToLocationId) {
      setFeedback({ type: 'error', message: 'Source and destination locations are required.' });
      return;
    }
    if (transferFromLocationId === transferToLocationId) {
      setFeedback({ type: 'error', message: 'Source and destination locations cannot be the same.' });
      return;
    }
    if (!transferProductId) {
      setFeedback({ type: 'error', message: 'Please select a product to transfer.' });
      return;
    }
    const qty = parseInt(transferQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Transfer quantity must be greater than 0.' });
      return;
    }
    if (qty > sourceAvailableStock) {
      setFeedback({
        type: 'error',
        message: `Cannot transfer ${qty} units: Only ${sourceAvailableStock} available at source.`,
      });
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await posApi.executeStockTransfer({
        sourceLocationId: transferFromLocationId,
        destinationLocationId: transferToLocationId,
        items: [
          {
            productId: transferProductId,
            variantId: transferVariantId || null,
            quantity: qty,
          },
        ],
        reason: transferReason || 'Stall stock allocation',
      });

      const destLoc = locations.find((l) => l.id === transferToLocationId);
      setFeedback({
        type: 'success',
        message: `Successfully transferred ${qty} unit(s) into ${destLoc?.name || 'Stall'}.`,
      });
      setTransferModalOpen(false);
      setTransferProductId('');
      setTransferVariantId('');
      fetchBalances();
      if (activeTab === 'transfers') fetchTransfers();
      if (activeTab === 'movements') fetchMovements();
    } catch (err) {
      console.error('Transfer failed:', err);
      setFeedback({
        type: 'error',
        message: err.data?.message || err.message || 'Failed to execute stock transfer.',
      });
    } finally {
      setIsSubmittingTransfer(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  // Handle Create or Edit Stall Location
  const handleOpenStallModal = (loc = null) => {
    if (loc) {
      setEditingStall(loc);
      setStallForm({
        name: loc.name || '',
        city: loc.city || '',
        venue: loc.venue || loc.address || '',
        startDate: loc.startDate ? new Date(loc.startDate).toISOString().slice(0, 10) : '',
        endDate: loc.endDate ? new Date(loc.endDate).toISOString().slice(0, 10) : '',
        isActive: loc.isActive !== undefined ? loc.isActive : true,
        assignedStaff: Array.isArray(loc.assignedStaffIds) ? loc.assignedStaffIds.join(', ') : '',
        code: loc.code || '',
      });
    } else {
      setEditingStall(null);
      setStallForm({
        name: '',
        city: 'Chennai',
        venue: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        isActive: true,
        assignedStaff: '',
        code: '',
      });
    }
    setStallModalOpen(true);
  };

  const handleSaveStallLocation = async (e) => {
    e.preventDefault();
    if (!stallForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Stall name is required.' });
      return;
    }

    setIsSubmittingStall(true);
    try {
      const staffList = stallForm.assignedStaff
        ? stallForm.assignedStaff.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [];

      const payload = {
        name: stallForm.name.trim(),
        city: stallForm.city.trim() || null,
        venue: stallForm.venue.trim() || null,
        startDate: stallForm.startDate ? new Date(stallForm.startDate).toISOString() : null,
        endDate: stallForm.endDate ? new Date(stallForm.endDate).toISOString() : null,
        isActive: Boolean(stallForm.isActive),
        assignedStaffIds: staffList,
        code: stallForm.code ? stallForm.code.trim().toUpperCase() : undefined,
      };

      if (editingStall) {
        await posApi.updateLocation(editingStall.id, payload);
        setFeedback({ type: 'success', message: `Stall location "${payload.name}" updated successfully.` });
      } else {
        await posApi.createLocation({ ...payload, type: 'STALL' });
        setFeedback({ type: 'success', message: `New stall location "${payload.name}" created successfully.` });
      }

      setStallModalOpen(false);
      await loadLocations();
      fetchBalances();
    } catch (err) {
      console.error('Failed to save stall location:', err);
      setFeedback({
        type: 'error',
        message: err.data?.message || err.message || 'Failed to save stall location.',
      });
    } finally {
      setIsSubmittingStall(false);
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  // Toggle Stall Active / Inactive
  const handleToggleStall = async (loc) => {
    try {
      await posApi.toggleLocation(loc.id);
      setFeedback({
        type: 'success',
        message: `Stall "${loc.name}" ${loc.isActive ? 'deactivated' : 'activated'}. Historical records preserved.`,
      });
      await loadLocations();
      fetchBalances();
    } catch (err) {
      console.error('Toggle failed:', err);
      setFeedback({
        type: 'error',
        message: err.data?.message || err.message || 'Failed to toggle stall status.',
      });
    } finally {
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }
  };

  // Filter balances locally if search query is typed
  const displayedBalances = balances.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (b.productName || b.product?.name || b.displayName || '').toLowerCase().includes(q);
    const skuMatch = (b.sku || b.variant?.sku || b.product?.sku || '').toLowerCase().includes(q);
    const locMatch = (b.locationName || '').toLowerCase().includes(q);
    return nameMatch || skuMatch || locMatch;
  });

  const activeLocationObj = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
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
          <button onClick={() => setFeedback({ type: '', message: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Location Selection, Add Stall & Transfer Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#762F39]" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Stall Inventory
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Maintain independent stock balances for physical exhibition stalls.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location Dropdown: All Stalls or Specific Stall */}
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5">
            <MapPin className="w-4 h-4 text-[#762F39]" />
            <select
              value={selectedLocationId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLocationId(val);
                if (val !== 'all') {
                  setTransferToLocationId(val);
                  setSearchParams({ locationId: val }, { replace: true });
                } else {
                  setSearchParams({}, { replace: true });
                }
              }}
              className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="all">🎪 All Stalls (Combined View)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.city ? `(${loc.city})` : ''} — {loc.type}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Stock Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedLocationId && selectedLocationId !== 'all') {
                setTransferToLocationId(selectedLocationId);
              }
              setTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Stock</span>
          </button>

          {/* Add Stall Location Button */}
          <button
            type="button"
            onClick={() => handleOpenStallModal(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#762F39]" />
            <span>Add Stall Location</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              if (activeTab === 'balances') fetchBalances();
              else if (activeTab === 'movements') fetchMovements();
              else if (activeTab === 'transfers') fetchTransfers();
              else loadLocations();
            }}
            className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingBalances || isLoadingMovements || isLoadingTransfers ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Selected Location Summary Info Card */}
      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold ${
              selectedLocationId === 'all'
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : activeLocationObj?.type === 'STALL'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}
          >
            {selectedLocationId === 'all'
              ? '🎪 ALL ACTIVE STALLS'
              : activeLocationObj?.type === 'STALL'
              ? '🎪 STALL LOCATION'
              : '🏢 CENTRAL WAREHOUSE'}
          </span>
          <div>
            <span className="font-bold text-stone-800 block text-sm">
              {selectedLocationId === 'all'
                ? 'Consolidated View Across All Exhibition Locations'
                : activeLocationObj?.name}
            </span>
            <span className="text-stone-500 font-mono text-[11px]">
              {selectedLocationId === 'all'
                ? 'Each physical stall maintains independent stock balances completely isolated from website inventory'
                : `CODE: ${activeLocationObj?.code || 'N/A'} • CITY: ${activeLocationObj?.city || 'N/A'} • ISOLATED STALL STOCK`}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-stone-500 text-[11px] block">
            {selectedLocationId === 'all' ? 'Total Tracked Balances:' : 'Tracked SKUs in this Stall:'}
          </span>
          <span className="font-bold text-stone-800 text-sm tabular-nums">
            {displayedBalances.length} item records
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'balances'
              ? 'border-[#762F39] text-[#762F39] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stall Stock Balances</span>
        </button>
        <button
          onClick={() => setActiveTab('stalls')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stalls'
              ? 'border-[#762F39] text-[#762F39] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Stall Locations ({locations.filter((l) => l.type === 'STALL').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'transfers'
              ? 'border-[#762F39] text-[#762F39] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Stock Transfers</span>
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
          <span>Movement History</span>
        </button>
      </div>

      {/* TAB 1: Stock Balances */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product, SKU, or stall name..."
                className="bg-transparent text-xs w-full focus:outline-none text-stone-800"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Collection Filter */}
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
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
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock (&gt; 0)</option>
                <option value="LOW_STOCK">Low Stock (≤ Threshold)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Balances Table */}
          {isLoadingBalances ? (
            <div className="p-12 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
              <p className="text-xs font-medium">Loading location inventory balances from database...</p>
            </div>
          ) : displayedBalances.length === 0 ? (
            <div className="p-12 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
              <ShieldAlert className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-medium text-stone-600">No inventory balances recorded for this selection.</p>
              <span className="text-[11px] text-stone-400">
                Click "Transfer Stock" above to allocate products from the Central Warehouse to this stall.
              </span>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                      <th className="py-3 px-4">Product / Variant</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Location / Stall</th>
                      <th className="py-3 px-3 text-right">On-Hand</th>
                      <th className="py-3 px-3 text-right">Reserved</th>
                      <th className="py-3 px-3 text-right font-bold">Available Stock</th>
                      <th className="py-3 px-3 text-center">Stock Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {displayedBalances.map((item) => {
                      const onHand = item.onHandQuantity ?? 0;
                      const reserved = item.reservedQuantity ?? 0;
                      const avail = item.availableQuantity ?? Math.max(0, onHand - reserved);
                      const threshold = item.reorderThreshold || 5;
                      const isOutOfStock = avail <= 0;
                      const isLowStock = !isOutOfStock && avail <= threshold;

                      return (
                        <tr key={item.id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.displayName || item.productName}
                                  className="w-9 h-9 object-cover rounded-lg border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center shrink-0 border border-stone-200">
                                  <Package className="w-4 h-4 text-stone-400" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-stone-900 block truncate max-w-[220px]">
                                  {item.displayName || item.productName || item.product?.name}
                                </span>
                                {item.variantName && (
                                  <span className="text-[10px] text-stone-500 font-mono">
                                    Variant: {item.variantName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                            {item.sku || item.variant?.sku || item.product?.sku || 'N/A'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-stone-800 block">
                              {item.locationName}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {item.locationCity || item.locationCode || 'STALL'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-stone-700">
                            {onHand}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-stone-500">
                            {reserved}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                              {avail}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">units</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItemForAdjust(item);
                                setAdjustQuantityChange('');
                                setAdjustReason('');
                                setAdjustModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Audited Stock Adjustment"
                            >
                              <Sliders className="w-3 h-3 text-stone-500" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Stall Locations Management */}
      {activeTab === 'stalls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">Configured Stall Locations</h3>
              <p className="text-xs text-stone-500">
                Create and manage physical exhibition stalls. Renaming and status toggles preserve all sales and stock movement ledgers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenStallModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#762F39] text-white rounded-lg text-xs font-medium hover:bg-[#5E252D] cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stall Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => {
              const isStall = loc.type === 'STALL';
              return (
                <div
                  key={loc.id}
                  className={`bg-white p-5 rounded-xl border transition-all ${
                    loc.isActive ? 'border-stone-200 shadow-xs' : 'border-stone-200/60 opacity-60 bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            loc.isActive ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                        />
                        <h4 className="font-bold text-stone-900 text-sm">{loc.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 mt-0.5 block">
                        CODE: {loc.code} • {loc.type}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        loc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {loc.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 py-2 border-y border-stone-100 my-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">City: {loc.city || 'Tamil Nadu'} {loc.venue ? `— ${loc.venue}` : ''}</span>
                    </div>

                    {loc.startDate && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {new Date(loc.startDate).toLocaleDateString('en-IN')}
                          {loc.endDate ? ` to ${new Date(loc.endDate).toLocaleDateString('en-IN')}` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">
                        Assigned: {Array.isArray(loc.assignedStaffIds) && loc.assignedStaffIds.length > 0
                          ? loc.assignedStaffIds.join(', ')
                          : 'All Authorized Staff'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStall(loc)}
                      className={`text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        loc.isActive ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'
                      }`}
                    >
                      {loc.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-stone-400" />}
                      <span>{loc.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStallModal(loc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-stone-500" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Stock Transfers */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">Inter-Location Stock Transfers</h3>
              <p className="text-xs text-stone-500">Safe, audited movements between warehouse and physical exhibition stalls.</p>
            </div>
            <button
              type="button"
              onClick={() => setTransferModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#762F39] text-white text-xs rounded-lg hover:bg-[#5E252D] cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Stock Transfer</span>
            </button>
          </div>

          {isLoadingTransfers ? (
            <div className="p-12 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
              <p className="text-xs font-medium">Loading stock transfers...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              <Truck className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p>No stock transfer records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Transfer #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">From Location</th>
                    <th className="py-3 px-3">To Location</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Items Count</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-stone-900">
                        {t.transferNumber || t.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-800">
                        {t.sourceLocation?.name || 'Central Warehouse'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-800">
                        {t.destinationLocation?.name || 'Stall'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          {t.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-700">
                        {t.items?.length || t._count?.items || 1} item(s)
                      </td>
                      <td className="py-2.5 px-4 text-stone-600 truncate max-w-[200px]">
                        {t.reason || t.notes || 'Warehouse dispatch'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Movement History */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200">
            <h3 className="font-serif font-bold text-sm text-stone-900">Stock Movement Audit Ledger</h3>
            <p className="text-xs text-stone-500">Permanent, immutable record of POS sales, transfers, and physical count adjustments.</p>
          </div>

          {isLoadingMovements ? (
            <div className="p-12 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#762F39] mb-2" />
              <p className="text-xs font-medium">Loading stock movement ledger...</p>
            </div>
          ) : movementLogs.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              <History className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p>No stock movement logs recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Product / SKU</th>
                    <th className="py-3 px-3 text-right">Change</th>
                    <th className="py-3 px-3 text-right">Stock After</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                    <th className="py-3 px-3">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {movementLogs.map((log) => {
                    const delta = log.delta ?? log.quantityDelta ?? 0;
                    const isPositive = delta > 0;
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
                        <td className="py-2.5 px-3 font-medium text-stone-800">
                          {log.location?.name || 'Stall'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-stone-800 block truncate max-w-[200px]">
                            {log.product?.name || log.productName || 'Product'}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {log.variant?.sku || log.product?.sku || log.sku || 'SKU'}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${delta}` : delta}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-800 font-bold">
                          {log.newQuantity ?? log.quantityAfter ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 text-stone-600">
                          <span className="block truncate max-w-[240px]">
                            {log.reason || log.reference || log.referenceId || 'Stock Activity'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                          {log.actorEmail || log.actor?.name || 'Staff'}
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
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#762F39]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Audited Stock Adjustment
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-medium text-stone-800">
                {selectedItemForAdjust.productName || selectedItemForAdjust.product?.name || selectedItemForAdjust.displayName}
              </div>
              <div className="text-stone-500 font-mono text-[11px]">
                Location: {selectedItemForAdjust.locationName} • SKU: {selectedItemForAdjust.sku}
              </div>
              <div className="text-stone-700 font-mono font-bold">
                Current Stall Stock: {selectedItemForAdjust.availableQuantity ?? selectedItemForAdjust.onHandQuantity} units
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
                  placeholder="e.g. Physical inventory count discrepancy, damaged unit, or initial stall allotment"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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

      {/* Stock Transfer Modal (Source -> Destination Stall) */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#762F39]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Transfer Stock to Stall
                </h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              {/* Location Route */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Source Location</span>
                  <select
                    value={transferFromLocationId}
                    onChange={(e) => setTransferFromLocationId(e.target.value)}
                    className="w-full mt-1 bg-white border border-stone-300 rounded p-1.5 text-xs font-semibold text-stone-800"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Destination Stall</span>
                  <select
                    value={transferToLocationId}
                    onChange={(e) => setTransferToLocationId(e.target.value)}
                    className="w-full mt-1 bg-white border border-stone-300 rounded p-1.5 text-xs font-semibold text-stone-800"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Product to Transfer
                </label>
                {isLoadingWarehouseStock ? (
                  <div className="text-xs text-stone-400 py-2 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading available products from source...</span>
                  </div>
                ) : (
                  <select
                    value={transferProductId}
                    onChange={(e) => {
                      setTransferProductId(e.target.value);
                      setTransferVariantId('');
                    }}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39] bg-white cursor-pointer"
                  >
                    <option value="">-- Choose Product --</option>
                    {warehouseCatalog.map((item) => (
                      <option key={item.productId || item.id} value={item.productId || item.id}>
                        {item.productName || item.product?.name || item.displayName} ({item.sku}) — Available: {item.availableQuantity ?? item.onHandQuantity ?? 0}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Source Available Stock Badge */}
              {transferProductId && (
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Source Available Stock:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {sourceAvailableStock} units
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Transfer Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  max={sourceAvailableStock > 0 ? sourceAvailableStock : undefined}
                  required
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39] font-mono font-bold"
                />
                {Number(transferQuantity) > sourceAvailableStock && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">
                    Cannot exceed source stock of {sourceAvailableStock} units.
                  </span>
                )}
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Transfer Reason / Notes
                </label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Exhibition opening stock allocation"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer || !transferProductId || Number(transferQuantity) > sourceAvailableStock}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingTransfer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transferring Stock...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      <span>Execute Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Stall Location Modal */}
      {stallModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#762F39]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {editingStall ? 'Edit Stall Location' : 'Create Stall Location'}
                </h3>
              </div>
              <button
                onClick={() => setStallModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStallLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Stall Name *
                </label>
                <input
                  type="text"
                  required
                  value={stallForm.name}
                  onChange={(e) => setStallForm({ ...stallForm, name: e.target.value })}
                  placeholder="e.g. Chennai Exhibition Stall"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                    Location / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={stallForm.city}
                    onChange={(e) => setStallForm({ ...stallForm, city: e.target.value })}
                    placeholder="e.g. Chennai, Coimbatore"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                    Stall Code
                  </label>
                  <input
                    type="text"
                    value={stallForm.code}
                    onChange={(e) => setStallForm({ ...stallForm, code: e.target.value })}
                    placeholder="e.g. STALL-CHN01"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39] font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Venue / Exhibition Name (Optional)
                </label>
                <input
                  type="text"
                  value={stallForm.venue}
                  onChange={(e) => setStallForm({ ...stallForm, venue: e.target.value })}
                  placeholder="e.g. Chennai Trade Centre - Hall 3"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={stallForm.startDate}
                    onChange={(e) => setStallForm({ ...stallForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={stallForm.endDate}
                    onChange={(e) => setStallForm({ ...stallForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase font-mono tracking-wider mb-1">
                  Assigned Staff Emails (Comma-separated)
                </label>
                <input
                  type="text"
                  value={stallForm.assignedStaff}
                  onChange={(e) => setStallForm({ ...stallForm, assignedStaff: e.target.value })}
                  placeholder="e.g. staff1@amoga.com, staff2@amoga.com"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Leave blank to allow any authorized stall staff.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stallActiveToggle"
                  checked={stallForm.isActive}
                  onChange={(e) => setStallForm({ ...stallForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#762F39] focus:ring-[#762F39] cursor-pointer"
                />
                <label htmlFor="stallActiveToggle" className="text-xs font-medium text-stone-800 cursor-pointer">
                  Active Stall (Eligible for billing and transfers)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStallModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStall}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingStall ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Stall...</span>
                    </>
                  ) : (
                    <span>{editingStall ? 'Save Changes' : 'Create Stall'}</span>
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
