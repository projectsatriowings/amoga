import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
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
  MapPin,
  User,
  ArrowRight,
  RefreshCw,
  Printer,
  X,
  Lock,
  ArrowLeftRight,
  Send,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { StallPosLayout } from '../layouts/StallPosLayout';
import { useStallAuthStore } from '../store/useStallAuthStore';
import { stallApi } from '../services/stallApiClient';
import { PosReceiptModal } from '../../admin/pos/components/PosReceiptModal';
import { AdminPosHistory } from '../../admin/pos/pages/AdminPosHistory';

const COLLECTIONS = [
  { id: 'all', label: 'All Items', color: 'bg-stone-800 text-white border-stone-800' },
  { id: 'food', label: 'Wholesome Pantry', color: 'bg-[#3F5A35] text-white border-[#3F5A35]' },
  { id: 'tea', label: 'Wellness Tea', color: 'bg-[#5C715E] text-white border-[#5C715E]' },
  { id: 'sarees', label: 'Heritage Sarees', color: 'bg-[#762F39] text-white border-[#762F39]' },
  { id: 'jewellery', label: 'Silver Jewellery', color: 'bg-[#8C6320] text-white border-[#8C6320]' },
];

/**
 * Collection-tailored artistic visual fallback
 * Prevents identical generic placeholders from repeating across unrelated products
 */
function CollectionFallbackImage({ collectionId, name }) {
  switch (collectionId) {
    case 'food':
      return (
        <div className="w-full h-full bg-[#EFECE6] flex flex-col items-center justify-center p-3 text-[#3F5A35]">
          <div className="w-9 h-9 rounded-full bg-[#3F5A35]/10 flex items-center justify-center mb-1">
            <svg className="w-4 h-4 stroke-[1.75]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9A9 9 0 0 0 12 2Z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#3F5A35] font-semibold">Pantry</span>
        </div>
      );
    case 'tea':
      return (
        <div className="w-full h-full bg-[#EAEFE9] flex flex-col items-center justify-center p-3 text-[#5C715E]">
          <div className="w-9 h-9 rounded-full bg-[#5C715E]/10 flex items-center justify-center mb-1">
            <svg className="w-4 h-4 stroke-[1.75]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" x2="6" y1="2" y2="4" />
              <line x1="10" x2="10" y1="2" y2="4" />
            </svg>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5C715E] font-semibold">Wellness Tea</span>
        </div>
      );
    case 'sarees':
      return (
        <div className="w-full h-full bg-[#F5ECEE] flex flex-col items-center justify-center p-3 text-[#762F39]">
          <div className="w-9 h-9 rounded-full bg-[#762F39]/10 flex items-center justify-center mb-1">
            <svg className="w-4 h-4 stroke-[1.75]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#762F39] font-semibold">Heritage Saree</span>
        </div>
      );
    case 'jewellery':
      return (
        <div className="w-full h-full bg-[#F7F3EA] flex flex-col items-center justify-center p-3 text-[#8C6320]">
          <div className="w-9 h-9 rounded-full bg-[#8C6320]/10 flex items-center justify-center mb-1">
            <svg className="w-4 h-4 stroke-[1.75]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 3h12l4 6-10 13L2 9Z" />
              <path d="M11 3 8 9l4 13 4-13-3-6" />
              <path d="M2 9h20" />
            </svg>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6320] font-semibold">Silver Jewellery</span>
        </div>
      );
    default:
      return (
        <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400">
          <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
        </div>
      );
  }
}

/**
 * Resilient image thumbnail with error fallback
 */
function ProductThumbnail({ src, alt, collectionId }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError || src.includes('placeholder-luxury.jpg')) {
    return <CollectionFallbackImage collectionId={collectionId} name={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  );
}

export function StallBillingPage() {
  const { user } = useStallAuthStore();

  // Tab State: 'billing' (POS Register) or 'history' (Bill History)
  const [activeTab, setActiveTab] = useState('billing');

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

  // Quick Stock Transfer Modal State (Stall Manager & Super Admin only)
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
  const [paymentStatus, setPaymentStatus] = useState('PAID'); // 'PAID' | 'PENDING'
  const [paymentReference, setPaymentReference] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  // Tax calculation state
  const [calculation, setCalculation] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Finalize Sale & Receipt Modal State
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Toast / feedback message
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const isManagerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'STALL_MANAGER';

  // 1. Fetch authorized stock locations
  const fetchLocations = async () => {
    setLoadingLocations(true);
    setLocationsError('');
    try {
      const res = await stallApi.listLocations();
      if (res?.locations && res.locations.length > 0) {
        setLocations(res.locations);
        // Default to first assigned location if activeLocation not set
        setActiveLocation((prev) => {
          if (prev && res.locations.some((l) => l.id === prev.id)) return prev;
          return res.locations[0];
        });
      } else {
        setLocations([]);
        setLocationsError('No active stall locations assigned to this staff account.');
      }
    } catch (err) {
      console.error('Failed to load stall locations:', err);
      setLocationsError(err.message || 'Failed to connect to stock locations service.');
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // 2. Fetch catalog products scoped to active stock location
  const fetchProducts = async (q = searchQuery, col = selectedCollection, locId = activeLocation?.id) => {
    if (!locId) return;
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const res = await stallApi.searchCatalog({
        query: q,
        collectionId: col,
        stockLocationId: locId,
        inStockOnly: false,
      });
      if (res?.products) {
        setProducts(res.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to search catalog:', err);
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
      await stallApi.transferStock({
        sourceLocationId: warehouse.id,
        destinationLocationId: activeLocation.id,
        items: [
          {
            productId: transferProductId,
            variantId: transferVariantId || null,
            quantity: qty,
          },
        ],
        reason: transferReason || 'Stall stock allocation',
      });

      setSuccessToast(`Successfully transferred ${qty} unit(s) to ${activeLocation.name}`);
      setTimeout(() => setSuccessToast(''), 3000);
      setShowTransferModal(false);
      setTransferProductId('');
      setTransferVariantId('');
      setTransferQuantity(10);
      fetchProducts(searchQuery, selectedCollection, activeLocation.id);
    } catch (err) {
      setErrorMessage(err.message || 'Stock transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  // 3. Cart Operations with strict available stock checks
  const handleAddToCart = (product, variant = null) => {
    const available = variant
      ? (variant.availableQuantity ?? 0)
      : (product.availableQuantity ?? 0);

    if (available <= 0) {
      setErrorMessage(`"${product.name}${variant ? ` (${variant.name})` : ''}" is currently out of stock at this stall.`);
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const cartKey = variant ? `${product.id}_${variant.id}` : `${product.id}_base`;
    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);

    if (existingIndex >= 0) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= available) {
        setErrorMessage(`Cannot exceed available stall inventory. Max available: ${available}.`);
        setTimeout(() => setErrorMessage(''), 3500);
        return;
      }

      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const unitPrice = variant
        ? (variant.price !== null ? Number(variant.price) : Number(product.price || 0))
        : (product.price !== null ? Number(product.price) : 0);

      const newItem = {
        cartKey,
        productId: product.id,
        variantId: variant ? variant.id : null,
        productName: product.name,
        variantName: variant ? variant.name : null,
        sku: variant ? variant.sku : product.sku,
        unitPrice,
        quantity: 1,
        availableStock: available,
        hsnCode: variant ? (variant.hsnCode || product.hsnCode) : product.hsnCode,
        gstRate: variant ? (variant.gstRate ?? product.gstRate ?? 5) : (product.gstRate ?? 5),
        collectionId: product.collectionId,
        image: product.image,
      };

      setCart([...cart, newItem]);
    }

    setSuccessToast(`Added ${product.name} to bill`);
    setTimeout(() => setSuccessToast(''), 1500);
  };

  const handleUpdateQuantity = (cartKey, newQty) => {
    const item = cart.find((i) => i.cartKey === cartKey);
    if (!item) return;

    if (newQty <= 0) {
      handleRemoveItem(cartKey);
      return;
    }

    if (newQty > item.availableStock) {
      setErrorMessage(`Cannot add more than ${item.availableStock} available in this stall.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setCart(cart.map((i) => (i.cartKey === cartKey ? { ...i, quantity: newQty } : i)));
  };

  const handleRemoveItem = (cartKey) => {
    setCart(cart.filter((item) => item.cartKey !== cartKey));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the current bill?')) {
      setCart([]);
      setCalculation(null);
      setDiscountValue('');
      setDiscountReason('');
      setCustomerName('');
      setCustomerPhone('');
      setPaymentReference('');
      setAmountReceived('');
    }
  };

  // 4. Quick SKU / Search Enter handler
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();
      if (!code) return;

      const exactMatch = products.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === code) ||
          (p.sourceId && p.sourceId.toLowerCase() === code) ||
          (p.variants && p.variants.some((v) => v.sku && v.sku.toLowerCase() === code))
      );

      if (exactMatch) {
        const matchedVariant = exactMatch.variants?.find((v) => v.sku && v.sku.toLowerCase() === code);
        handleAddToCart(exactMatch, matchedVariant || null);
        setSearchQuery('');
      } else {
        setErrorMessage(`No product found matching "${code}".`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // 5. Pre-flight tax and discount calculation preview
  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    let isMounted = true;
    const calcTimer = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const res = await stallApi.calculateBill({
          items: cart.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
          stallEventId: activeLocation?.stallEventId || null,
          overallDiscountType: discountType,
          overallDiscountValue: parseFloat(discountValue) || 0,
        });

        if (res?.calculation && isMounted) {
          setCalculation(res.calculation);
        }
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        if (isMounted) setCalcLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(calcTimer);
    };
  }, [cart, discountType, discountValue, activeLocation]);

  // 6. Finalize Bill with atomic stall stock deduction
  const handleFinalizeBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to bill before finalizing.');
      return;
    }
    if (!activeLocation) {
      setErrorMessage('Please select an active stall location.');
      return;
    }

    setIsFinalizing(true);
    setErrorMessage('');
    try {
      const payload = {
        stallEventId: activeLocation.stallEventId || null,
        stockLocationId: activeLocation.id,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        overallDiscountType: discountType,
        overallDiscountValue: parseFloat(discountValue) || 0,
        discountReason: discountReason.trim() || null,
        paymentMethod,
        paymentStatus,
        paymentReference: paymentReference.trim() || null,
        amountReceived: amountReceived ? parseFloat(amountReceived) : null,
        notes: notes.trim() || null,
        sendWhatsApp,
      };

      const res = await stallApi.finalizeBill(payload);
      if (res?.sale) {
        setCompletedSale(res.sale);
        setShowReceiptModal(true);

        // Reset cart
        setCart([]);
        setCalculation(null);
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setPaymentReference('');
        setAmountReceived('');
        setDiscountValue('');
        setDiscountReason('');
        setMobileCartOpen(false);

        // Refresh stall catalog to update remaining quantities
        fetchProducts(searchQuery, selectedCollection, activeLocation.id);
      }
    } catch (err) {
      console.error('Finalize bill error:', err);
      setErrorMessage(err.message || 'Failed to finalize bill. Please check available stock.');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Derive cart totals safely
  const grossPaise = cart.reduce((acc, it) => acc + Math.round(it.unitPrice * 100) * it.quantity, 0);
  const totalPayablePaise = calculation?.netPayablePaise ?? grossPaise;
  const includedGstPaise = calculation?.totalTaxPaise ?? Math.round(grossPaise * 0.05);
  const totalItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Diagnose zero stock across active stall
  const totalAvailableAcrossCatalog = products.reduce((sum, p) => sum + (p.availableQuantity || 0), 0);
  const isStallCompletelyUnstocked = !catalogLoading && products.length > 0 && totalAvailableAcrossCatalog === 0;

  return (
    <StallPosLayout
      activeLocation={activeLocation}
      onSelectLocation={setActiveLocation}
      locations={locations}
    >
      {/* Toast and Error Notifications */}
      {errorMessage && (
        <div className="fixed top-14 right-4 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-2 hover:opacity-80 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successToast && (
        <div className="fixed top-14 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top POS Action Toolbar */}
      <div className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-[#762F39] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Register</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#762F39] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Bill History</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'billing' && isManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#762F39] bg-[#762F39]/10 hover:bg-[#762F39]/20 border border-[#762F39]/30 rounded-lg transition-colors cursor-pointer"
              title="Allocate stock from warehouse into this stall"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Transfer Stock</span>
            </button>
          )}

          <span className="text-[11px] font-mono text-stone-500 hidden md:inline">
            Stall: <strong className="text-stone-800">{activeLocation?.name || 'Selected'}</strong>
          </span>
        </div>
      </div>

      {activeTab === 'billing' ? (
        /* Main Billing Split View */
        <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-97px)] overflow-hidden relative">
          {/* LEFT COLUMN: Product Catalogue & Search */}
          <div className="flex-1 flex flex-col bg-[#F9F8F5] border-r border-stone-200 overflow-hidden">
            {/* Search, Barcode & Filter Bar */}
            <div className="p-2.5 sm:p-3 bg-white border-b border-stone-200 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search by product name, SKU, or tag..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-stone-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F5A35] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Refresh Catalog */}
                <button
                  type="button"
                  onClick={() => fetchProducts(searchQuery, selectedCollection, activeLocation?.id)}
                  className="p-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-stone-600 transition-colors shrink-0 cursor-pointer"
                  title="Refresh Inventory"
                >
                  <RefreshCw className={`w-4 h-4 ${catalogLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Collection Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCollection(c.id)}
                    className={`px-3 py-1.2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCollection === c.id
                        ? `${c.color} shadow-xs font-bold`
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Banner: When stall location has 0 stock allocated */}
            {isStallCompletelyUnstocked && (
              <div className="m-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h5 className="font-semibold text-amber-950">
                      Zero stock allocated to {activeLocation?.name || 'this stall'}
                    </h5>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      Products appear out of stock because this physical stall location has not yet received stock transfers from Central Warehouse.
                    </p>
                  </div>
                </div>
                {isManagerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="px-3 py-1.5 bg-[#762F39] hover:bg-[#5E252D] text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transfer Stock to Stall</span>
                  </button>
                )}
              </div>
            )}

            {/* Error notifications */}
            {locationsError && (
              <div className="m-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                <span>{locationsError}</span>
                <button
                  type="button"
                  onClick={fetchLocations}
                  className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Product Card Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {catalogLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#762F39]" />
                  <span className="text-xs uppercase font-mono tracking-wider">Loading Stall Catalog...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2 text-center p-6">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  <p className="text-sm font-medium text-stone-600">No items found matching criteria.</p>
                  <span className="text-xs text-stone-400">
                    Try adjusting your search query or selecting another collection.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                  {products.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    const stallStock = product.availableQuantity ?? 0;
                    const isOutOfStock = stallStock <= 0;
                    const isLowStock = stallStock > 0 && stallStock <= 3;

                    // Check if already in cart and whether max stock reached
                    const baseCartItem = cart.find((it) => it.productId === product.id && !it.variantId);
                    const isMaxAdded = !hasVariants && baseCartItem && baseCartItem.quantity >= stallStock;

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden relative group ${
                          isOutOfStock ? 'opacity-70 bg-stone-50/50' : ''
                        }`}
                      >
                        {/* Product Thumbnail with Graceful Collection Visual Fallback */}
                        <div className="relative aspect-square bg-stone-100 overflow-hidden">
                          <ProductThumbnail
                            src={product.image}
                            alt={product.name}
                            collectionId={product.collectionId}
                          />

                          {/* Stall Stock Badge */}
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shadow-xs ${
                                isOutOfStock
                                  ? 'bg-rose-600 text-white'
                                  : isLowStock
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-emerald-700 text-white'
                              }`}
                            >
                              {isOutOfStock ? 'OUT OF STOCK' : `STALL: ${stallStock}`}
                            </span>
                          </div>

                          {/* GST Included Badge */}
                          <div className="absolute bottom-1.5 right-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono backdrop-blur-xs">
                              GST {product.gstRate || 5}% INCL.
                            </span>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block truncate">
                              {product.sku || 'AMOGA'}
                            </span>
                            <h4
                              className="font-medium text-xs sm:text-sm text-stone-900 line-clamp-2 leading-snug"
                              title={product.name}
                            >
                              {product.name}
                            </h4>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                            <div>
                              {product.price !== null && product.price !== undefined && Number(product.price) > 0 ? (
                                <>
                                  <span className="text-xs sm:text-sm font-bold text-stone-900 block leading-none">
                                    ₹{Number(product.price).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[9px] text-stone-600 font-mono">Incl. GST</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 block">
                                  Bespoke
                                </span>
                              )}
                            </div>

                            {/* Add Button or Variant Selector */}
                            {hasVariants ? (
                              <div className="relative">
                                <select
                                  disabled={isOutOfStock}
                                  onChange={(e) => {
                                    const selectedV = product.variants.find((v) => v.id === e.target.value);
                                    if (selectedV) handleAddToCart(product, selectedV);
                                    e.target.value = '';
                                  }}
                                  defaultValue=""
                                  className="text-xs bg-stone-100 hover:bg-stone-200 border border-stone-300 font-semibold text-stone-800 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="" disabled>
                                    + Variant
                                  </option>
                                  {product.variants.map((v) => {
                                    const vStock = v.availableQuantity ?? 0;
                                    return (
                                      <option key={v.id} value={v.id} disabled={vStock <= 0}>
                                        {v.name} ({vStock > 0 ? `₹${v.price} • ${vStock} left` : 'Out of stock'})
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isOutOfStock || isMaxAdded}
                                onClick={() => handleAddToCart(product)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                  isOutOfStock
                                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                    : isMaxAdded
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-[#762F39] hover:bg-[#5E252D] text-white shadow-xs'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isOutOfStock ? 'Sold Out' : isMaxAdded ? 'Max Added' : 'Add'}</span>
                              </button>
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

          {/* RIGHT COLUMN: Compact, Sticky Retail Billing Panel */}
          {/* On Mobile: Renders as full-featured Drawer; On Desktop: Side panel */}
          <div
            className={`lg:w-[410px] xl:w-[430px] shrink-0 bg-white border-l border-stone-200 flex flex-col h-full shadow-lg lg:shadow-none z-30 transition-transform duration-300 fixed lg:static inset-y-0 right-0 max-w-full ${
              mobileCartOpen ? 'translate-x-0 w-full sm:w-[420px]' : 'translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Panel Header */}
            <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#762F39]" />
                <h3 className="font-serif text-sm font-bold text-stone-900">Current Register Bill</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#762F39]/10 text-[#762F39] text-[11px] font-mono font-bold">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] font-medium text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Clear Bill
                  </button>
                )}
                {/* Close Drawer button for mobile */}
                <button
                  type="button"
                  onClick={() => setMobileCartOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-stone-200 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                /* Compact Empty Cart State (Zero wasted whitespace) */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                    <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-stone-700 text-sm">Register Bill is Empty</h5>
                    <p className="text-xs text-stone-500 mt-1 max-w-[240px]">
                      Select items from the catalog to add them into the bill.
                    </p>
                  </div>
                  <div className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Tip: Enter customer WhatsApp for digital receipt</span>
                  </div>
                </div>
              ) : (
                cart.map((item) => {
                  const linePaise = Math.round(item.unitPrice * 100) * item.quantity;
                  const isMax = item.quantity >= item.availableStock;

                  return (
                    <div
                      key={item.cartKey}
                      className="p-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-stone-900 truncate">
                            {item.productName}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-500 font-mono">
                            {item.variantName && (
                              <span className="px-1.5 py-0.2 bg-stone-100 rounded text-stone-700 font-semibold">
                                {item.variantName}
                              </span>
                            )}
                            <span className="truncate">{item.sku}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-stone-900 block">
                            ₹{(linePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-stone-600 font-mono">
                            ₹{item.unitPrice} ea
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Actions Control */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.cartKey, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white hover:bg-stone-200 flex items-center justify-center text-stone-700 shadow-2xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isMax}
                            onClick={() => handleUpdateQuantity(item.cartKey, item.quantity + 1)}
                            className={`w-6 h-6 rounded bg-white flex items-center justify-center shadow-2xs cursor-pointer ${
                              isMax ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone-200 text-stone-700'
                            }`}
                            title={isMax ? `Stall stock limit reached (${item.availableStock})` : 'Add one'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMax && (
                            <span className="text-[10px] text-amber-700 font-mono font-medium">
                              Max {item.availableStock}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.cartKey)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Section: Customer, Payment & Final Calculation */}
            {cart.length > 0 && (
              <div className="p-3 bg-stone-50 border-t border-stone-200 space-y-2.5 shrink-0 text-xs">
                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name (opt)"
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="WhatsApp (10 digits)"
                      className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#762F39] focus:outline-none font-mono"
                    />
                    <Smartphone className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Payment Method Pills */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    <span>Payment Method</span>
                    <span className="font-mono text-stone-400">
                      {paymentStatus === 'PAID' ? 'Immediate Settlement' : 'Marked Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                      { id: 'CARD', label: 'Card POS', icon: CreditCard },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                            paymentMethod === m.id
                              ? 'bg-[#762F39] text-white border-[#762F39] shadow-xs'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="bg-white rounded-xl p-2.5 border border-stone-200 space-y-1.5">
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>Gross Subtotal</span>
                    <span className="font-mono">₹{(grossPaise / 100).toFixed(2)}</span>
                  </div>

                  {/* Discount Field */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-stone-600">Discount:</span>
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="0"
                        className="w-14 px-1.5 py-0.5 bg-stone-50 border border-stone-300 rounded text-center text-xs font-mono font-bold"
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="bg-stone-50 border border-stone-300 rounded text-[10px] font-bold py-0.5 px-1 cursor-pointer"
                      >
                        <option value="AMOUNT">₹</option>
                        <option value="PERCENT">%</option>
                      </select>
                    </div>
                    {calculation?.discountPaise > 0 && (
                      <span className="font-mono text-emerald-700 font-bold">
                        -₹{(calculation.discountPaise / 100).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Included GST Notice: Guaranteed never added twice */}
                  <div className="flex justify-between items-center pt-1 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#3F5A35]" />
                      <span>Included GST ({calculation?.effectiveTaxRatePaise ? (calculation.effectiveTaxRatePaise / 100).toFixed(1) : '5'}%)</span>
                    </span>
                    <span className="text-stone-700 font-medium">
                      ₹{(includedGstPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Final Payable Amount in Bold Typography */}
                  <div className="flex justify-between items-baseline pt-1.5 border-t border-stone-200">
                    <span className="font-serif font-bold text-sm text-stone-900">Total Payable</span>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-base sm:text-lg text-[#762F39]">
                        ₹{(totalPayablePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Finalize Button */}
                <button
                  type="button"
                  disabled={isFinalizing || cart.length === 0}
                  onClick={handleFinalizeBill}
                  className="w-full py-3 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#762F39]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isFinalizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Finalizing Bill & Deducting Stock...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalize & Generate Bill</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Bottom Floating Cart Summary Pill (when bill drawer is closed) */}
          {cart.length > 0 && !mobileCartOpen && (
            <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-stone-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-stone-700 animate-slideUp">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#762F39] flex items-center justify-center font-bold text-xs">
                  {totalItemsCount}
                </div>
                <div>
                  <span className="text-[11px] font-mono text-stone-400 block leading-none">
                    Bill Total
                  </span>
                  <span className="font-mono font-bold text-sm text-white">
                    ₹{(totalPayablePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileCartOpen(true)}
                className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <span>View Bill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Bill History Tab (Allows quick reprint and WhatsApp resend) */
        <div className="flex-1 overflow-y-auto bg-stone-50">
          <AdminPosHistory />
        </div>
      )}

      {/* Stock Transfer Modal (For Stall Managers & Super Admins) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-fadeIn">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#762F39]" />
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Transfer Stock to {activeLocation?.name || 'Stall'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Select Product to Transfer
                </label>
                <select
                  value={transferProductId}
                  onChange={(e) => {
                    setTransferProductId(e.target.value);
                    setTransferVariantId('');
                  }}
                  required
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                >
                  <option value="">-- Choose from Catalogue --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {transferProductId && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Select Variant (Optional)
                  </label>
                  {(() => {
                    const sel = products.find((p) => p.id === transferProductId);
                    if (!sel || !sel.variants || sel.variants.length === 0) {
                      return <span className="text-[11px] text-stone-500 font-mono">No variants (Base item)</span>;
                    }
                    return (
                      <select
                        value={transferVariantId}
                        onChange={(e) => setTransferVariantId(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                      >
                        <option value="">Base Product</option>
                        {sel.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.sku})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Transfer Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  required
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Stall stock allocation"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#762F39] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-4 py-2 bg-[#762F39] hover:bg-[#5E252D] text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Stock Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verified POS Receipt Modal */}
      {completedSale && (
        <PosReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setCompletedSale(null);
          }}
          sale={completedSale}
        />
      )}
    </StallPosLayout>
  );
}
