import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { posApi } from '../services/posApiClient';
import { PosReceiptModal } from '../components/PosReceiptModal';

const COLLECTIONS = [
  { id: 'all', label: 'All Collections', color: 'bg-stone-800 text-white' },
  { id: 'food', label: 'Wholesome Pantry', color: 'bg-[#3F5A35] text-white' },
  { id: 'tea', label: 'Wellness Tea', color: 'bg-[#5C715E] text-white' },
  { id: 'sarees', label: 'Heritage Sarees', color: 'bg-[#762F39] text-white' },
  { id: 'jewellery', label: 'Silver Jewellery', color: 'bg-[#8C6320] text-white' },
];

export function AdminPosNewBill() {
  const { admin } = useAdminStore();

  // Stall & Configuration State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [posSettings, setPosSettings] = useState(null);

  // Search & Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const barcodeInputRef = useRef(null);

  // Cart & Customer State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

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

  // Submission & Receipt State
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizedSale, setFinalizedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Load initial settings and active events
  useEffect(() => {
    async function init() {
      try {
        const [settRes, evRes] = await Promise.all([
          posApi.getSettings(),
          posApi.listEvents('ACTIVE'),
        ]);

        if (settRes?.settings) {
          setPosSettings(settRes.settings);
          if (settRes.settings.enableBarcodeScanner) {
            setBarcodeMode(true);
          }
        }

        if (evRes?.events && evRes.events.length > 0) {
          setEvents(evRes.events);
          setSelectedEventId(evRes.events[0].id);
        }
      } catch (err) {
        console.error('Failed to load POS settings or events:', err);
      }
    }
    init();
  }, []);

  // Fetch catalog products
  const fetchProducts = async (q = searchQuery, col = selectedCollection) => {
    setCatalogLoading(true);
    try {
      const res = await posApi.searchCatalog({
        query: q,
        collectionId: col,
        inStockOnly: false,
      });
      if (res?.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to search catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, selectedCollection);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCollection]);

  // Recalculate bill taxes when cart or discounts change
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
          stallEventId: selectedEventId || null,
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
  }, [cart, selectedEventId, discountType, discountValue]);

  // Handle adding product/variant to cart
  const handleAddToCart = (product, variant = null) => {
    const itemKey = variant ? `v_${variant.id}` : `p_${product.id}`;
    const maxStock = variant ? variant.availableQuantity : product.availableQuantity;

    if (maxStock <= 0) {
      setErrorMessage(`"${product.name}" is currently out of stock.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.key === itemKey);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= maxStock) {
          setErrorMessage(`Cannot add more: only ${maxStock} in stock.`);
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
              setErrorMessage(`Cannot exceed available stock of ${item.maxStock}.`);
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
        setErrorMessage(`Barcode "${code}" not found.`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Total payable
  const finalPayable = calculation ? calculation.netPayableTotal || calculation.totalAmount : 0;

  // Change due calculation
  const receivedNum = Number(amountReceived) || 0;
  const changeDue = paymentMethod === 'CASH' && receivedNum > finalPayable
    ? Number((receivedNum - finalPayable).toFixed(2))
    : 0;

  // Finalize Sale
  const handleFinalizeBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to cart before finalizing.');
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
      const idempotencyKey = `POS-WEB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        stallEventId: selectedEventId || null,
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
        setSuccessToast(`Bill ${res.sale.billNumber} finalized successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);

        // Refresh product stock
        fetchProducts();
      }
    } catch (err) {
      console.error('Finalize error:', err);
      setErrorMessage(err.message || 'Failed to finalize bill. Please check stock and try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col -m-6 p-4 sm:p-6 lg:p-8">
      
      {/* Top Banner / Register Header */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#762F39] to-[#5C232B] flex items-center justify-center text-white shadow-md">
            <ShoppingBag className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Stall Billing & Point of Sale
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                LIVE REGISTER
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Rapid GST-inclusive counter billing for exhibitions, trade fairs, and pop-up stalls.
            </p>
          </div>
        </div>

        {/* Stall & Staff Metadata */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stall Selector */}
          <div className="flex items-center gap-2 bg-[#FAF9F5] px-3 py-2 rounded-xl border border-stone-300 text-xs">
            <MapPin className="w-4 h-4 text-[#762F39]" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="">Direct Stall (Default)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.city})
                </option>
              ))}
            </select>
          </div>

          {/* Cashier Badge */}
          <div className="flex items-center gap-2 bg-[#FAF9F5] px-3 py-2 rounded-xl border border-stone-300 text-xs">
            <User className="w-4 h-4 text-[#8C6320]" />
            <span className="text-stone-600 font-sans">Staff:</span>
            <span className="font-semibold text-stone-900">{admin?.name || 'Cashier'}</span>
          </div>
        </div>
      </div>

      {/* Error & Success Feedback Alerts */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successToast && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Register Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        
        {/* LEFT COLUMN: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Search & Barcode Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                placeholder={barcodeMode ? 'Scan barcode or type SKU/Name and press Enter...' : 'Search by product name, SKU, or category...'}
                className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#762F39] focus:outline-none transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setBarcodeMode((prev) => !prev);
                if (!barcodeMode && barcodeInputRef.current) {
                  barcodeInputRef.current.focus();
                }
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                barcodeMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-300'
              }`}
              title="Toggle Barcode Scanner Auto-Submit"
            >
              <Barcode className="w-4 h-4" />
              <span>{barcodeMode ? 'Scanner ON' : 'Scanner'}</span>
            </button>
          </div>

          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {COLLECTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shadow-sm ${
                  selectedCollection === c.id
                    ? `${c.color} font-bold ring-2 ring-offset-1 ring-stone-400`
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto p-1 scrollbar-thin">
            {catalogLoading ? (
              <div className="col-span-full py-16 text-center text-stone-500 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono uppercase tracking-wider">Loading Catalogue...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-stone-300 p-6">
                <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="font-serif text-sm font-semibold text-stone-700">No items matched your search</p>
                <p className="text-xs text-stone-500 mt-0.5">Try searching with a broader name or SKU.</p>
              </div>
            ) : (
              products.map((p) => {
                const hasVariants = p.variants && p.variants.length > 0;
                const isOutOfStock = p.availableQuantity <= 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md ${
                      isOutOfStock ? 'border-red-200 opacity-60' : 'border-stone-200 hover:border-[#762F39]/50'
                    }`}
                  >
                    {/* Image & Stock Badge */}
                    <div className="relative aspect-square bg-[#F8F6F0] overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}

                      {/* Stock Pill */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-md ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : p.availableQuantity < 5
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${p.availableQuantity} left`}
                      </span>

                      {/* Collection Pill */}
                      <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded-md font-mono">
                        {p.collectionName || p.category}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-xs font-semibold text-stone-900 line-clamp-1 leading-snug">
                          {p.name}
                        </h3>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                          SKU: {p.sku} | HSN: {p.hsnCode}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold font-mono text-[#762F39]">
                            ₹{Number(p.price).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[8px] text-stone-500 font-mono">Incl. {p.gstRate}% GST</span>
                        </div>

                        {/* If product has multiple variants, render variant buttons */}
                        {hasVariants && p.variants.length > 1 ? (
                          <div className="flex flex-col gap-1 w-full mt-2">
                            <span className="text-[9px] text-stone-500 font-mono">Select Size/Variant:</span>
                            <div className="grid grid-cols-2 gap-1">
                              {p.variants.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={v.availableQuantity <= 0}
                                  onClick={() => handleAddToCart(p, v)}
                                  className="px-1.5 py-1 text-[10px] bg-stone-100 hover:bg-[#762F39] hover:text-white rounded font-medium disabled:opacity-40 transition truncate text-left"
                                  title={`${v.name} - ₹${v.price} (${v.availableQuantity} in stock)`}
                                >
                                  {v.name} (₹{v.price})
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(p, hasVariants ? p.variants[0] : null)}
                            className="w-8 h-8 rounded-xl bg-[#762F39] hover:bg-[#8C3A46] text-white flex items-center justify-center transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                            aria-label={`Add ${p.name}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: POS Register / Current Bill Cart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-lg p-4 sm:p-5 flex flex-col justify-between sticky top-4">
          
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#762F39]" />
                <h2 className="font-serif font-bold text-base text-stone-900">Current Stall Bill</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#762F39]/10 text-[#762F39] font-mono px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((sum, it) => sum + it.quantity, 0)} Items
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-stone-400 hover:text-red-600 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="py-3 border-b border-stone-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1 flex items-center justify-between">
                  <span>Mobile (+91)</span>
                  <span className="text-[9px] text-emerald-700 font-mono font-medium">WhatsApp</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-3 pr-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39] font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp auto-send checkbox */}
              <div className="col-span-2 pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendWhatsAppCheck"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="sendWhatsAppCheck" className="text-[11px] text-stone-600 cursor-pointer flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-emerald-600" />
                  <span>Send digital tax invoice to customer via WhatsApp upon finalization</span>
                </label>
              </div>
            </div>

            {/* Line Items List */}
            <div className="py-3 max-h-60 overflow-y-auto space-y-2 border-b border-stone-200 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 text-stone-300" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-stone-400">Click products or scan barcodes to begin billing.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 hover:border-stone-300 transition"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-xs text-stone-900 leading-tight">{item.productName}</p>
                      {item.variantName && (
                        <span className="text-[10px] text-stone-500 font-mono">Size: {item.variantName} | </span>
                      )}
                      <span className="text-[10px] text-stone-500 font-mono">₹{Number(item.unitPrice).toFixed(0)}</span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.key, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-bold font-mono text-stone-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.key, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <span className="w-16 text-right font-mono font-bold text-xs text-[#762F39]">
                        ₹{(item.unitPrice * item.quantity).toFixed(0)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.key)}
                        className="w-6 h-6 ml-1 text-stone-400 hover:text-red-600 transition flex items-center justify-center"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount Trigger & Payment Method Selection */}
            {cart.length > 0 && (
              <div className="py-3 border-b border-stone-200 space-y-3">
                {/* Discount Summary Pill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">Authorized Discount:</span>
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6320] hover:text-[#762F39] transition bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
                  >
                    <Tag className="w-3 h-3" />
                    <span>
                      {Number(discountValue) > 0
                        ? `${discountType === 'PERCENT' ? `${discountValue}%` : `₹${discountValue}`} (${discountReason || 'Promo'})`
                        : '+ Add Discount'}
                    </span>
                  </button>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'CASH'
                          ? 'bg-[#3F5A35] text-white border-[#3F5A35] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'UPI'
                          ? 'bg-[#762F39] text-white border-[#762F39] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'CARD'
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('OTHER')}
                      className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'OTHER'
                          ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Split/Other</span>
                    </button>
                  </div>
                </div>

                {/* Cash Calculator / UPI Reference input */}
                {paymentMethod === 'CASH' ? (
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">Amount Received (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder={finalPayable ? String(finalPayable) : '0'}
                        className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-stone-500 font-semibold mb-0.5">Change Due</span>
                      <div className="px-2 py-1 bg-white border border-stone-200 rounded font-mono font-bold text-emerald-700">
                        ₹{changeDue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">
                      Transaction / UPI Ref ID
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UPI/2026/839482 or Card Auth Code"
                      className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Financial & Tax Breakdown */}
            {calculation && (
              <div className="py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Gross Subtotal (Incl. GST):</span>
                  <span className="font-mono">₹{Number(calculation.grossSubtotal).toFixed(2)}</span>
                </div>

                {Number(calculation.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{Number(calculation.discountAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Taxable Value (Deconstructed):</span>
                  <span className="font-mono">₹{Number(calculation.taxableSubtotal || calculation.taxableAmount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>GST Total ({calculation.isInterState ? 'IGST' : 'CGST + SGST'}):</span>
                  <span className="font-mono">₹{Number(calculation.totalGstAmount || calculation.totalTaxAmount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-stone-900 font-bold">
                  <span className="font-serif text-sm">TOTAL PAYABLE:</span>
                  <span className="font-mono text-xl text-[#762F39]">
                    ₹{Number(calculation.netPayableTotal || calculation.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Big Action Button */}
          <div className="mt-4 pt-3 border-t border-stone-200">
            <button
              type="button"
              disabled={cart.length === 0 || isFinalizing}
              onClick={handleFinalizeBill}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#762F39] via-[#8C3A46] to-[#5C232B] hover:brightness-110 text-white font-bold text-sm shadow-md transition active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isFinalizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deducting Stock & Finalizing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Finalize & Print Bill (₹{finalPayable.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Discount Configuration Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-base text-stone-900">Apply Authorized Discount</h3>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Discount Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('AMOUNT')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      discountType === 'AMOUNT'
                        ? 'bg-[#762F39] text-white border-[#762F39]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Direct Rupees (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      discountType === 'PERCENT'
                        ? 'bg-[#762F39] text-white border-[#762F39]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Discount Value {discountType === 'PERCENT' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENT' ? 'e.g. 10' : 'e.g. 100'}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
                {posSettings && Number(discountValue) > (posSettings.maxDiscountPercentWithoutApproval || 15) && discountType === 'PERCENT' && (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Exceeds {posSettings.maxDiscountPercentWithoutApproval}% threshold. Requires Store Manager role.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reason (Audit Record)</label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Stall Exhibition Promo / VIP Pass"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#762F39] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountValue('');
                  setDiscountReason('');
                  setShowDiscountModal(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Clear Discount
              </button>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-1.5 text-xs font-bold bg-[#762F39] hover:bg-[#8C3A46] text-white rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Amoga Invoice & Receipt Modal */}
      <PosReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        sale={finalizedSale}
        onResendWhatsApp={async (id, phone) => {
          return await posApi.sendWhatsApp(id, phone);
        }}
      />

    </div>
  );
}
