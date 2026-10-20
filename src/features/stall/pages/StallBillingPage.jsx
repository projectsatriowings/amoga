import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Share2,
  CheckCircle2,
  AlertCircle,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  Sparkles,
  Layers,
  MapPin,
  User,
  ArrowRight,
  RefreshCw,
  Printer,
  X,
  Sliders,
  Lock,
  Mail,
  ShieldAlert,
  ArrowLeftRight,
  Truck,
} from 'lucide-react';
import { StallPosLayout } from '../layouts/StallPosLayout';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { posApi } from '../../admin/pos/services/posApiClient';
import { PosReceiptModal } from '../../admin/pos/components/PosReceiptModal';
import amogaLogo from '../../../assets/images/amoga-logo.png';

const COLLECTIONS = [
  { id: 'all', label: 'All Items', color: 'bg-stone-800 text-white border-stone-800' },
  { id: 'food', label: 'Wholesome Pantry', color: 'bg-[#3F5A35] text-white border-[#3F5A35]' },
  { id: 'tea', label: 'Wellness Tea', color: 'bg-[#5C715E] text-white border-[#5C715E]' },
  { id: 'sarees', label: 'Heritage Sarees', color: 'bg-[#762F39] text-white border-[#762F39]' },
  { id: 'jewellery', label: 'Silver Jewellery', color: 'bg-[#8C6320] text-white border-[#8C6320]' },
];

export function StallBillingPage() {
  const { admin, isAuthenticated, login, logout, isLoading: authLoading, error: authError } = useAdminStore();

  // Auth form state for in-place login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Locations state
  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState('');

  // Search & Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const barcodeInputRef = useRef(null);

  // Quick Stock Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState('');
  const [transferVariantId, setTransferVariantId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(10);
  const [transferReason, setTransferReason] = useState('Stall stock allocation');
  const [isTransferring, setIsTransferring] = useState(false);

  // Cart & Customer State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Discount & Payment State
  const [discountType, setDiscountType] = useState('AMOUNT'); // 'AMOUNT' | 'PERCENT'
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'UPI' | 'CARD' | 'OTHER'
  const [paymentReference, setPaymentReference] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  // Tax calculation state
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Finalize & Receipt State
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizedSale, setFinalizedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Load locations on mount
  const fetchLocations = async () => {
    if (!isAuthenticated) return;
    setLoadingLocations(true);
    setLocationsError('');
    try {
      const res = await posApi.listLocations();
      if (res?.locations && res.locations.length > 0) {
        setLocations(res.locations);
        // Prefer stall locations first
        const stallLoc = res.locations.find((l) => l.type === 'STALL') || res.locations[0];
        setActiveLocation(stallLoc);
      } else {
        setLocationsError('No active stock locations configured in database.');
      }
    } catch (err) {
      console.error('Failed to load stock locations:', err);
      if (err.status === 401) {
        logout();
        window.location.href = '/admin/login?redirect=/stall';
        return;
      }
      setLocationsError(err.message || 'Failed to connect to stock locations service.');
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [isAuthenticated]);

  // Fetch catalog products scoped to active stock location
  const fetchProducts = async (q = searchQuery, col = selectedCollection, locId = activeLocation?.id) => {
    if (!isAuthenticated) return;
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const res = await posApi.searchCatalog({
        query: q,
        collectionId: col,
        stockLocationId: locId || undefined,
        inStockOnly: false,
      });
      if (res?.products) {
        setProducts(res.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to search catalog:', err);
      if (err.status === 401) {
        logout();
        window.location.href = '/admin/login?redirect=/stall';
        return;
      }
      setCatalogError(err.message || 'Unable to retrieve stall catalog from server.');
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (!activeLocation) return;
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, selectedCollection, activeLocation.id);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCollection, activeLocation]);

  // Execute Stock Transfer to active stall
  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!activeLocation) {
      setErrorMessage('Please select an active stall location first.');
      return;
    }
    const warehouse = locations.find((l) => l.code === 'MAIN-WAREHOUSE' || l.type === 'WAREHOUSE') || locations.find((l) => l.id !== activeLocation.id);
    if (!warehouse) {
      setErrorMessage('Central warehouse location not found.');
      return;
    }
    if (!transferProductId) {
      setErrorMessage('Please select a product to transfer.');
      return;
    }
    const qty = parseInt(transferQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Transfer quantity must be at least 1.');
      return;
    }

    setIsTransferring(true);
    setErrorMessage('');
    try {
      await posApi.executeStockTransfer({
        sourceLocationId: warehouse.id,
        destinationLocationId: activeLocation.id,
        items: [{
          productId: transferProductId,
          variantId: transferVariantId || null,
          quantity: qty,
        }],
        reason: transferReason || 'Stall stock allocation',
      });
      setSuccessToast(`Transferred ${qty} units from ${warehouse.name} to ${activeLocation.name}`);
      setShowTransferModal(false);
      setTransferProductId('');
      setTransferVariantId('');
      // Refresh products immediately to update stall balance
      await fetchProducts(searchQuery, selectedCollection, activeLocation.id);
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Stock transfer error:', err);
      setErrorMessage(err.message || 'Failed to complete stock transfer.');
    } finally {
      setIsTransferring(false);
    }
  };

  // Recalculate bill taxes when cart, location, or discounts change
  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    async function recalc() {
      setIsCalculating(true);
      try {
        const payload = {
          items: cart.map((c) => ({
            productId: c.productId,
            variantId: c.variantId || null,
            productName: c.productName,
            variantName: c.variantName || null,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            gstRate: c.gstRate,
            isTaxInclusive: c.isTaxInclusive,
            collectionId: c.collectionId,
          })),
          stockLocationId: activeLocation?.id || null,
          overallDiscountType: discountType,
          overallDiscountValue: Number(discountValue) || 0,
        };

        const res = await posApi.calculateBill(payload);
        if (res?.calculation) {
          setCalculation(res.calculation);
        }
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    }

    recalc();
  }, [cart, activeLocation, discountType, discountValue]);

  // Add to cart with local stall stock check
  const handleAddToCart = (product, variant = null) => {
    const itemKey = variant ? `v_${variant.id}` : `p_${product.id}`;
    const maxStock = variant ? variant.availableQuantity : product.availableQuantity;

    if (maxStock <= 0) {
      setErrorMessage(`"${product.name}" has 0 stock at ${activeLocation?.name || 'this stall'}.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.key === itemKey);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= maxStock) {
          setErrorMessage(`Cannot add more: only ${maxStock} in stall stock.`);
          setTimeout(() => setErrorMessage(''), 3000);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            key: itemKey,
            productId: product.id,
            variantId: variant ? variant.id : null,
            productName: product.name,
            variantName: variant ? variant.name : null,
            sku: variant ? variant.sku : product.sku,
            unitPrice: variant ? variant.price : product.price,
            quantity: 1,
            maxStock,
            image: product.image,
            collectionId: product.collectionId,
            hsnCode: variant ? variant.hsnCode : product.hsnCode,
            gstRate: variant ? variant.gstRate : product.gstRate,
            isTaxInclusive: variant ? variant.isTaxInclusive : product.isTaxInclusive,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (key, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.key === key) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxStock) {
              setErrorMessage(`Cannot exceed stall stock of ${item.maxStock}.`);
              setTimeout(() => setErrorMessage(''), 3000);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveFromCart = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  // Barcode enter handler
  const handleBarcodeSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim();
      const matched = products.find(
        (p) =>
          p.sku?.toLowerCase() === code.toLowerCase() ||
          p.sourceId?.toLowerCase() === code.toLowerCase() ||
          p.variants?.some((v) => v.sku?.toLowerCase() === code.toLowerCase())
      );

      if (matched) {
        const variantMatch = matched.variants?.find((v) => v.sku?.toLowerCase() === code.toLowerCase());
        handleAddToCart(matched, variantMatch || (matched.variants?.length === 1 ? matched.variants[0] : null));
        setSearchQuery('');
        setSuccessToast(`Added: ${matched.name}`);
        setTimeout(() => setSuccessToast(''), 2000);
      } else {
        setErrorMessage(`Barcode/SKU "${code}" not found.`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Total payable
  const finalPayable = calculation ? calculation.netPayableTotal || calculation.totalAmount : 0;

  // Change due calculation
  const receivedNum = Number(amountReceived) || 0;
  const changeDue =
    paymentMethod === 'CASH' && receivedNum > finalPayable
      ? Number((receivedNum - finalPayable).toFixed(2))
      : 0;

  // Finalize Sale
  const handleFinalizeBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to cart before finalizing.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!activeLocation) {
      setErrorMessage('Please select an active stall location.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (sendWhatsApp && customerPhone) {
      const clean = customerPhone.replace(/\D/g, '');
      if (clean.length !== 10) {
        setErrorMessage('Please enter a valid 10-digit Indian phone number for WhatsApp delivery.');
        setTimeout(() => setErrorMessage(''), 3500);
        return;
      }
    }

    setIsFinalizing(true);
    setErrorMessage('');

    try {
      const idempotencyKey = `STALL-${activeLocation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        stockLocationId: activeLocation.id,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items: cart.map((c) => ({
          productId: c.productId,
          variantId: c.variantId || null,
          productName: c.productName,
          variantName: c.variantName || null,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          gstRate: c.gstRate,
          isTaxInclusive: c.isTaxInclusive,
        })),
        overallDiscountType: discountType,
        overallDiscountValue: Number(discountValue) || 0,
        discountReason: discountReason.trim() || null,
        paymentMethod,
        paymentStatus: 'PAID',
        amountReceived: paymentMethod === 'CASH' && receivedNum > 0 ? receivedNum : finalPayable,
        paymentReference: paymentReference.trim() || null,
        notes: notes.trim() || null,
        sendWhatsApp: Boolean(sendWhatsApp && customerPhone),
        idempotencyKey,
      };

      const res = await posApi.finalizeBill(payload);

      if (res?.sale) {
        setFinalizedSale(res.sale);
        setShowReceiptModal(true);

        // Reset cart for next customer
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setDiscountValue('');
        setDiscountReason('');
        setPaymentReference('');
        setAmountReceived('');
        setCalculation(null);
        setMobileCartOpen(false);
        setSuccessToast(`Bill ${res.sale.billNumber} finalized successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);

        // Refresh stall stock for current view
        fetchProducts(searchQuery, selectedCollection, activeLocation.id);
      }
    } catch (err) {
      console.error('Finalize bill failed:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to finalize bill.');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Staff in-place login submission
  const handleInPlaceLogin = async (e) => {
    e.preventDefault();
    const result = await login(loginEmail, loginPassword);
    if (!result?.success) {
      setErrorMessage(result?.error || 'Authentication failed. Please verify credentials.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Unauthenticated screen
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="bg-[#762F39] text-white p-6 text-center">
            <img src={amogaLogo} alt="Amoga" className="h-10 w-auto mx-auto object-contain mb-2 brightness-200" />
            <h2 className="font-serif text-2xl font-bold tracking-tight">AMOGA STALL POS</h2>
            <p className="text-xs uppercase font-mono tracking-widest text-amber-200 mt-1">
              Staff Authorization Required
            </p>
          </div>

          <form onSubmit={handleInPlaceLogin} className="p-6 space-y-4">
            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="admin@amoga.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-[#762F39] hover:bg-[#5E252D] text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Staff...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StallPosLayout
      activeLocation={activeLocation}
      onSelectLocation={setActiveLocation}
      locations={locations}
    >
      {/* Toast and Error Notifications */}
      {errorMessage && (
        <div className="fixed top-16 right-4 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-2 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Billing Split View */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-53px)] overflow-hidden">
        {/* LEFT COLUMN: Product Catalog & Search */}
        <div className="flex-1 flex flex-col bg-[#F9F8F5] border-r border-stone-200 overflow-hidden">
          {/* Search, Barcode & Filter Bar */}
          <div className="p-3 bg-white border-b border-stone-200 space-y-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder={barcodeMode ? 'Scan barcode or enter SKU and press Enter...' : 'Search by name, SKU, or tag...'}
                  className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none transition-colors ${
                    barcodeMode
                      ? 'border-[#762F39] bg-red-50/20 text-[#762F39] focus:ring-2 focus:ring-[#762F39]'
                      : 'border-stone-300 bg-white focus:ring-2 focus:ring-[#3F5A35]'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barcode toggle button */}
              <button
                type="button"
                onClick={() => {
                  setBarcodeMode(!barcodeMode);
                  if (!barcodeMode && barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  barcodeMode
                    ? 'bg-[#762F39] text-white border-[#762F39]'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                }`}
                title="Toggle Barcode Scanner Mode"
              >
                <Barcode className="w-4 h-4" />
                <span className="hidden sm:inline">{barcodeMode ? 'Scanner ON' : 'Scanner'}</span>
              </button>

              {/* Transfer Stock Button */}
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#762F39]/10 hover:bg-[#762F39]/20 text-[#762F39] border border-[#762F39]/30 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                title="Transfer stock from Central Warehouse to Stall"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transfer Stock</span>
              </button>

              {/* Refresh Catalog */}
              <button
                type="button"
                onClick={() => fetchProducts(searchQuery, selectedCollection, activeLocation?.id)}
                className="p-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-stone-600 transition-colors shrink-0 cursor-pointer"
                title="Refresh Stall Stock"
              >
                <RefreshCw className={`w-4 h-4 ${catalogLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Collection Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {COLLECTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCollection(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedCollection === c.id
                      ? `${c.color} shadow-xs`
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actionable Error State for Stock Location failure */}
          {locationsError && (
            <div className="m-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{locationsError}</span>
              </div>
              <button
                type="button"
                onClick={fetchLocations}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium shrink-0 cursor-pointer"
              >
                Retry Locations
              </button>
            </div>
          )}

          {/* Actionable Error State for Catalog failure */}
          {catalogError && (
            <div className="m-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{catalogError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchProducts(searchQuery, selectedCollection, activeLocation?.id)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium shrink-0 cursor-pointer"
              >
                Retry Catalog
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {catalogLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-500 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#762F39]" />
                <span className="text-xs uppercase font-mono tracking-wider">Loading Stall Catalog...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                <p className="text-sm">No items found matching criteria.</p>
                <span className="text-xs text-stone-400">Try adjusting your search query or collection filter.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {products.map((product) => {
                  const hasVariants = product.variants && product.variants.length > 0;
                  const stallStock = product.availableQuantity ?? 0;
                  const isOutOfStock = stallStock <= 0;

                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group ${
                        isOutOfStock ? 'opacity-65' : ''
                      }`}
                    >
                      {/* Product Thumbnail & Collection Badge */}
                      <div className="relative aspect-square bg-stone-100 overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}

                        {/* Stock Tag on Stall */}
                        <div className="absolute top-1.5 left-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider ${
                              isOutOfStock
                                ? 'bg-rose-600 text-white'
                                : stallStock <= 3
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isOutOfStock ? 'OUT OF STOCK' : `STALL: ${stallStock}`}
                          </span>
                        </div>

                        {/* GST Inclusive Badge */}
                        <div className="absolute bottom-1.5 right-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono backdrop-blur-xs">
                            GST {product.gstRate || 0}% INCL.
                          </span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block truncate">
                            {product.sku || 'AMOGA'}
                          </span>
                          <h4 className="font-medium text-xs sm:text-sm text-stone-800 line-clamp-2 leading-tight">
                            {product.name}
                          </h4>
                        </div>

                        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                          <div>
                            {product.price !== null && product.price !== undefined && Number(product.price) > 0 ? (
                              <>
                                <span className="text-xs sm:text-sm font-semibold text-stone-900 block">
                                  ₹{Number(product.price).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono">MRP Incl. Tax</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block">
                                Price to be confirmed
                              </span>
                            )}
                          </div>

                          {/* Add button or variant selector */}
                          {hasVariants ? (
                            <div className="relative">
                              <select
                                onChange={(e) => {
                                  const selectedV = product.variants.find((v) => v.id === e.target.value);
                                  if (selectedV) handleAddToCart(product, selectedV);
                                  e.target.value = '';
                                }}
                                defaultValue=""
                                className="text-xs bg-stone-100 hover:bg-stone-200 border border-stone-300 font-medium text-stone-800 rounded px-2 py-1 cursor-pointer focus:outline-none"
                              >
                                <option value="" disabled>
                                  + Variant
                                </option>
                                {product.variants.map((v) => {
                                  const vHasPrice = v.price !== null && v.price !== undefined && Number(v.price) > 0;
                                  const vOutOfStock = (v.availableQuantity ?? 0) <= 0;
                                  return (
                                    <option key={v.id} value={v.id} disabled={vOutOfStock || !vHasPrice}>
                                      {v.name} ({vHasPrice ? `₹${v.price}` : 'Unpriced'}) {vOutOfStock ? '— Out of Stock' : `— Stock: ${v.availableQuantity}`}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {isOutOfStock && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferProductId(product.id);
                                    setShowTransferModal(true);
                                  }}
                                  className="px-1.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[#762F39] text-[10px] font-mono flex items-center gap-1 border border-stone-200 cursor-pointer"
                                  title="Transfer stock from warehouse to stall"
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                disabled={isOutOfStock || product.price === null || product.price === undefined || Number(product.price) <= 0}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isOutOfStock || product.price === null || product.price === undefined || Number(product.price) <= 0
                                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                    : 'bg-[#762F39] hover:bg-[#5E252D] text-white shadow-xs cursor-pointer'
                                }`}
                                title={isOutOfStock ? 'Item out of stock at this stall' : 'Add to Current Bill'}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Current Bill & Checkout Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-white flex flex-col h-full border-t lg:border-t-0 shadow-lg z-20 overflow-hidden">
          {/* Bill Header */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#762F39]" />
              <span className="font-serif font-bold text-sm text-stone-800">CURRENT BILL</span>
              <span className="px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded-full text-[11px] font-mono">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Customer Input Strip */}
          <div className="p-3 bg-stone-50/50 border-b border-stone-200 grid grid-cols-2 gap-2 shrink-0">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-stone-500 mb-0.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-stone-500 mb-0.5">
                Mobile (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
                <ShoppingBag className="w-10 h-10 stroke-[1.2] mb-2 text-stone-300" />
                <p className="text-xs font-medium text-stone-500">Cart is empty</p>
                <span className="text-[11px] text-stone-400 text-center max-w-[200px] mt-0.5">
                  Click or scan any product from the catalog to start billing.
                </span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-stone-800 truncate leading-snug">{item.productName}</h5>
                    {item.variantName && (
                      <span className="inline-block px-1.5 py-0.2 text-[10px] font-mono bg-stone-200 text-stone-700 rounded mr-1">
                        {item.variantName}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-500 font-mono">
                      ₹{item.unitPrice} × {item.quantity} = ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.key, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center hover:bg-stone-100 text-stone-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-stone-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.key, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center hover:bg-stone-100 text-stone-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.key)}
                      className="w-6 h-6 rounded-md text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Tax Calculation Footer */}
          {cart.length > 0 && (
            <div className="bg-stone-50 border-t border-stone-200 p-3 space-y-2.5 shrink-0">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-stone-500 mb-1">
                  Tender / Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                    { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                    { id: 'OTHER', label: 'Other', icon: Sliders },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === pm.id
                            ? 'bg-[#762F39] text-white border-[#762F39] shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Quick Tender & Change Calculator */}
              {paymentMethod === 'CASH' && (
                <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-900 font-medium">Cash Tendered:</span>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder={`₹${finalPayable}`}
                      className="w-24 px-2 py-1 text-right font-mono font-bold text-xs bg-white border border-emerald-300 rounded focus:outline-none"
                    />
                  </div>
                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1 justify-end">
                    {[100, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountReceived(amt)}
                        className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-mono hover:bg-emerald-200 cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountReceived(finalPayable)}
                      className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono hover:bg-emerald-800 cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>
                  {changeDue > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-200 font-mono text-xs">
                      <span className="text-emerald-800 font-bold">Change Due:</span>
                      <span className="text-emerald-900 font-bold text-sm">₹{changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reference ID input for UPI / Card */}
              {(paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'OTHER') && (
                <div>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={paymentMethod === 'UPI' ? 'UPI UTR / Reference No.' : 'Card Auth / Slip Ref'}
                    className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Tax & Total Summary Breakdown */}
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Taxable Value (Pre-GST):</span>
                  <span>₹{calculation ? calculation.taxableSubtotal?.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>GST Breakdown (Inclusive):</span>
                  <span>
                    CGST ₹{calculation ? calculation.cgstTotal?.toFixed(2) : '0.00'} + SGST ₹
                    {calculation ? calculation.sgstTotal?.toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Discount Control */}
                <div className="flex justify-between items-center text-stone-600 text-[11px] pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-1">
                    <span>Discount:</span>
                    <button
                      type="button"
                      onClick={() => setShowDiscountModal(!showDiscountModal)}
                      className="text-[10px] text-[#762F39] hover:underline"
                    >
                      {discountValue ? `(${discountType === 'PERCENT' ? `${discountValue}%` : `₹${discountValue}`})` : '+ Add'}
                    </button>
                  </div>
                  <span className="text-rose-600">
                    -₹{calculation ? calculation.discountTotal?.toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Discount Inline Editor */}
                {showDiscountModal && (
                  <div className="p-2 bg-stone-50 rounded border border-stone-200 space-y-1.5 my-1 font-sans">
                    <div className="flex items-center gap-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="text-[11px] bg-white border border-stone-300 rounded px-1.5 py-1"
                      >
                        <option value="AMOUNT">Flat ₹</option>
                        <option value="PERCENT">% Off</option>
                      </select>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="Discount value"
                        className="flex-1 text-[11px] bg-white border border-stone-300 rounded px-2 py-1"
                      />
                    </div>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Reason (e.g. Festival offer, stall concession)"
                      className="w-full text-[11px] bg-white border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                )}

                {/* Final Net Amount */}
                <div className="flex justify-between items-center text-stone-900 font-bold text-sm sm:text-base pt-1.5 border-t border-stone-300">
                  <span className="font-serif">TOTAL PAYABLE:</span>
                  <span className="text-[#762F39]">₹{finalPayable.toFixed(2)}</span>
                </div>
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between text-xs text-stone-700 px-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="rounded text-[#762F39] focus:ring-[#762F39]"
                  />
                  <span>Send receipt via WhatsApp</span>
                </label>
              </div>

              {/* Finalize Button */}
              <button
                type="button"
                onClick={handleFinalizeBill}
                disabled={isFinalizing || isCalculating || cart.length === 0}
                className="w-full py-3 bg-[#762F39] hover:bg-[#5E252D] text-white font-medium rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {isFinalizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deducting Stall Stock & Finalizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalize Bill — ₹{finalPayable.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Finalization Modal */}
      {showReceiptModal && finalizedSale && (
        <PosReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setFinalizedSale(null);
          }}
          sale={finalizedSale}
          onResendWhatsApp={async (id, phone) => {
            return await posApi.sendWhatsApp(id, phone);
          }}
        />
      )}

      {/* Quick Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-base font-semibold">Stock Transfer to Stall</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferProductId('');
                  setTransferVariantId('');
                }}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                <div>
                  <span className="font-semibold text-stone-700">Source:</span> Central Warehouse (MAIN-WAREHOUSE)
                </div>
                <div>
                  <span className="font-semibold text-stone-700">Destination Stall:</span> {activeLocation?.name || 'Selected Stall'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Product
                </label>
                <select
                  value={transferProductId}
                  onChange={(e) => {
                    setTransferProductId(e.target.value);
                    setTransferVariantId('');
                  }}
                  required
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                >
                  <option value="">-- Choose Product to Allocate --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku || p.collectionId}) — Stall: {p.availableQuantity ?? 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* If chosen product has variants, allow selecting variant */}
              {(() => {
                const selectedProd = products.find((p) => p.id === transferProductId);
                if (!selectedProd?.variants || selectedProd.variants.length === 0) return null;
                return (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Variant (Optional)
                    </label>
                    <select
                      value={transferVariantId}
                      onChange={(e) => setTransferVariantId(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                    >
                      <option value="">Base Product / No Variant</option>
                      {selectedProd.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.sku}) — Stall: {v.availableQuantity ?? 0}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Transfer Reason
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Stall morning stock replenishment"
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferProductId('');
                    setTransferVariantId('');
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring || !transferProductId}
                  className="px-5 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Confirm Stock Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StallPosLayout>
  );
}
