import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Receipt,
  Printer,
  Share2,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Clock,
  User,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';
import { PosReceiptModal } from '../components/PosReceiptModal';

export function AdminPosHistory() {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [stallEventId, setStallEventId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Events list for filter dropdown
  const [events, setEvents] = useState([]);

  // Selected Sale for Receipt Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Action Modals: Cancel & Refund
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [actionTargetSale, setActionTargetSale] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [restockItems, setRestockItems] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await posApi.listEvents();
        if (res?.events) setEvents(res.events);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEvents();
  }, []);

  // Fetch sales
  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const res = await posApi.listSales({
        page,
        limit: pagination.limit,
        search,
        status,
        paymentStatus,
        paymentMethod,
        stallEventId,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      if (res?.sales) {
        setSales(res.sales);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch POS sales:', err);
      setErrorMsg(err.message || 'Failed to load POS sales history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, paymentStatus, paymentMethod, stallEventId, startDate, endDate]);

  // Handle Cancel Bill
  const handleCancelSubmit = async () => {
    if (!actionTargetSale) return;
    setIsSubmittingAction(true);
    try {
      const res = await posApi.cancelSale(actionTargetSale.id, actionReason || 'Customer cancelled at stall');
      if (res?.success) {
        setSuccessMsg(`Bill ${actionTargetSale.billNumber} cancelled and inventory restored.`);
        setCancelModalOpen(false);
        setActionTargetSale(null);
        setActionReason('');
        fetchSales(pagination.page);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel bill.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Refund Bill
  const handleRefundSubmit = async () => {
    if (!actionTargetSale) return;
    setIsSubmittingAction(true);
    try {
      const res = await posApi.refundSale(actionTargetSale.id, {
        refundAmount: refundAmount ? Number(refundAmount) : null,
        reason: actionReason || 'Customer return requested',
        restockItems,
      });
      if (res?.success) {
        setSuccessMsg(`Bill ${actionTargetSale.billNumber} refunded successfully.`);
        setRefundModalOpen(false);
        setActionTargetSale(null);
        setActionReason('');
        setRefundAmount('');
        fetchSales(pagination.page);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process refund.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#762F39] to-[#5C232B] flex items-center justify-center text-white shadow-md">
            <Receipt className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Stall Bill History & Audit
            </h1>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Verified archive of all stall sales, tax invoice receipts, WhatsApp dispatches, and inventory movements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200">
            Total Bills: {pagination.totalCount}
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill No, Mobile, Customer, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#762F39]"
            />
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={stallEventId}
              onChange={(e) => setStallEventId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">All Stalls / Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">All Bill Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Split / Other</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none font-mono"
              title="Start Date"
            />
          </div>

        </div>
      </div>

      {/* Bill History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Bill No / Date</th>
                <th className="py-3.5 px-4">Stall / Event</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Sold</th>
                <th className="py-3.5 px-4">Total & GST</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-500">
                    <div className="w-6 h-6 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading bill history...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-400">
                    <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-600">No stall bills found</p>
                    <p className="text-[11px] text-stone-400">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const dateStr = new Date(sale.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = new Date(sale.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  const isCancelled = sale.status === 'CANCELLED';
                  const isRefunded = sale.status === 'REFUNDED';

                  return (
                    <tr key={sale.id} className="hover:bg-stone-50/70 transition">
                      
                      {/* Bill No / Date */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-stone-900 block">{sale.billNumber}</span>
                        <span className="text-[10px] text-stone-500">{dateStr} {timeStr}</span>
                      </td>

                      {/* Stall / Event */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 block">
                          {sale.stallEvent?.name || 'Walk-in Stall'}
                        </span>
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{sale.staffEmail?.split('@')[0]}</span>
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 block">
                          {sale.customerName || 'Walk-in Customer'}
                        </span>
                        {sale.customerPhone ? (
                          <span className="text-[10px] text-stone-500 font-mono">📱 +91 {sale.customerPhone}</span>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">No phone</span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-stone-800 block">
                          {sale.totalItemsCount || (sale.items || []).reduce((s, i) => s + i.quantity, 0)} Units
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {(sale.items || []).map((i) => i.productName).slice(0, 2).join(', ')}
                          {(sale.items || []).length > 2 ? '...' : ''}
                        </span>
                      </td>

                      {/* Total & GST */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-stone-900 text-sm block">
                          ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          GST: ₹{Number(sale.totalTaxAmount).toFixed(2)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800 font-mono text-[11px] block">
                          {sale.paymentMethod || 'CASH'}
                        </span>
                        {sale.paymentReference && (
                          <span className="text-[9px] text-stone-500 font-mono truncate max-w-[100px] block" title={sale.paymentReference}>
                            Ref: {sale.paymentReference}
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Status */}
                      <td className="py-3 px-4">
                        {sale.whatsAppStatus === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Sent</span>
                          </span>
                        ) : sale.whatsAppStatus === 'FALLBACK_READY' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Share2 className="w-3 h-3 text-amber-600" />
                            <span>Direct</span>
                          </span>
                        ) : sale.customerPhone ? (
                          <span className="text-[10px] text-stone-400 font-mono">Pending</span>
                        ) : (
                          <span className="text-[10px] text-stone-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isCancelled ? (
                          <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            CANCELLED
                          </span>
                        ) : isRefunded ? (
                          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            REFUNDED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Receipt */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSale(sale);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 text-stone-600 hover:text-[#762F39] hover:bg-stone-100 rounded-lg transition"
                            title="View & Print Tax Invoice Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick WhatsApp Share */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSale(sale);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="WhatsApp Receipt Delivery"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Cancel Bill (only if active) */}
                          {!isCancelled && !isRefunded && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionTargetSale(sale);
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Bill & Restore Stock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Refund Bill */}
                          {!isCancelled && !isRefunded && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionTargetSale(sale);
                                setRefundAmount(String(sale.totalAmount));
                                setRefundModalOpen(true);
                              }}
                              className="p-1.5 text-stone-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                              title="Process Refund & Compensating Restock"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-[#FAF9F5] border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-mono">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} bills)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchSales(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchSales(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice / Receipt Modal */}
      <PosReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        onResendWhatsApp={async (id, phone) => {
          const res = await posApi.sendWhatsApp(id, phone);
          fetchSales(pagination.page);
          return res;
        }}
      />

      {/* Cancel Bill Confirmation Modal */}
      {cancelModalOpen && actionTargetSale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Cancel Stall Bill</h3>
                <p className="text-xs text-stone-500 font-mono">{actionTargetSale.billNumber}</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-stone-700">
                Are you sure you want to cancel this bill? Cancelling will:
              </p>
              <ul className="list-disc pl-5 text-stone-600 space-y-1">
                <li>Mark the sale record as <strong>CANCELLED</strong>.</li>
                <li><strong>Automatically restore</strong> stock in the shared inventory ledger.</li>
                <li>Record a compensating <code>POS_CANCEL</code> inventory log and audit trail.</li>
                <li>Historical bill records are preserved immutably.</li>
              </ul>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reason for Cancellation:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Customer changed mind, accidental duplicate bill"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleCancelSubmit}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Bill Modal */}
      {refundModalOpen && actionTargetSale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Process Bill Refund</h3>
                <p className="text-xs text-stone-500 font-mono">{actionTargetSale.billNumber}</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Refund Amount (₹) [Max: ₹{Number(actionTargetSale.totalAmount).toFixed(2)}]
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(actionTargetSale.totalAmount)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Refund Reason:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Stall return / Saree exchange"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restockCheck"
                  checked={restockItems}
                  onChange={(e) => setRestockItems(e.target.checked)}
                  className="rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="restockCheck" className="text-xs text-stone-700 cursor-pointer">
                  Restock returned items into available inventory
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isSubmittingAction || !refundAmount}
                onClick={handleRefundSubmit}
                className="px-4 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-xl flex items-center gap-1.5"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
