import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminOrderDetail() {
  const { id } = useParams();
  const { adminFetch } = useAdminStore();

  const [order, setOrder] = useState(null);
  const [allowedNextStatuses, setAllowedNextStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status transition state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Tracking state
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load order');
      setOrder(json.order);
      setAllowedNextStatuses(json.allowedNextStatuses || []);
      setCarrier(json.order.carrier || '');
      setTrackingNumber(json.order.trackingNumber || '');
      setTrackingUrl(json.order.trackingUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await adminFetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: selectedStatus,
          reason: statusReason.trim() || 'Status advancement by admin staff',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Status transition rejected');

      setStatusMessage({ type: 'success', text: json.message });
      setSelectedStatus('');
      setStatusReason('');
      fetchOrder();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    setUpdatingTracking(true);
    setTrackingMessage(null);

    try {
      const res = await adminFetch(`/api/admin/orders/${id}/tracking`, {
        method: 'PATCH',
        body: JSON.stringify({
          carrier,
          trackingNumber,
          trackingUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save tracking');

      setTrackingMessage({ type: 'success', text: 'Tracking details updated' });
      fetchOrder();
    } catch (err) {
      setTrackingMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingTracking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#7A7167]">
        <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <BackButton
          collection="admin"
          fallbackTo="/admin/orders"
          label="Back to All Orders"
        />
        <span className="text-[10px] font-mono text-[#8C6320]">
          Placed on {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7167]">Order Reference</span>
          <h1 className="font-mono text-xl font-bold text-[#1A1817]">{order.orderReference}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-mono uppercase text-[#7A7167]">Order Status</span>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/30">
              {order.status}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-mono uppercase text-[#7A7167]">Payment</span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                order.paymentStatus === 'SUCCEEDED'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Workflow Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Lifecycle Transition */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAE4D9] pb-3">
            <Clock className="w-4 h-4 text-[#8C6320]" />
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Finite State Transition</h2>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {allowedNextStatuses.length === 0 ? (
            <div className="p-3 bg-[#F5F2EB] rounded text-xs text-[#7A7167] italic">
              Order has reached terminal state ({order.status}). No further state transitions permitted.
            </div>
          ) : (
            <form onSubmit={handleStatusTransition} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#4A423B] mb-1">
                  Permitted Next State *
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                >
                  <option value="">Select next state...</option>
                  {allowedNextStatuses.map((st) => (
                    <option key={st} value={st}>
                      Advance to: {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#4A423B] mb-1">
                  Reason for Transition *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Packed at warehouse, dispatched via Blue Dart"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || !selectedStatus}
                className="w-full py-2 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229] disabled:opacity-40 transition-colors"
              >
                {updatingStatus ? 'Advancing State...' : 'Commit Status Transition'}
              </button>
            </form>
          )}
        </div>

        {/* Carrier & Tracking */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAE4D9] pb-3">
            <Truck className="w-4 h-4 text-[#8C6320]" />
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Fulfilment & Tracking</h2>
          </div>

          {trackingMessage && (
            <div
              className={`p-3 rounded text-xs ${
                trackingMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {trackingMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveTracking} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#4A423B] mb-1">
                Logistics Carrier
              </label>
              <input
                type="text"
                placeholder="e.g. Blue Dart Express, Delhivery, DHL Luxury"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#4A423B] mb-1">
                Tracking Waybill Number
              </label>
              <input
                type="text"
                placeholder="e.g. BLUEDART-88291024"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#4A423B] mb-1">
                Carrier Web Tracking Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://www.bluedart.com/tracking/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
              />
            </div>

            {order.trackingNumber && (
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <a
                  href={`/track/${order.orderReference}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#722F37] font-semibold hover:underline"
                >
                  View Amoga Live Tracking Page ↗
                </a>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8C6320] font-semibold hover:underline"
                  >
                    Carrier Portal ↗
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={updatingTracking}
              className="w-full py-2 bg-[#1E1916] text-white text-xs font-semibold rounded hover:bg-[#2C2520] transition-colors"
            >
              {updatingTracking ? 'Saving...' : 'Update Tracking Details'}
            </button>
          </form>
        </div>
      </div>

      {/* Grid: Customer Snapshot & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Address */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-3">
          <div className="flex items-center gap-2 border-b border-[#EAE4D9] pb-3">
            <User className="w-4 h-4 text-[#8C6320]" />
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Customer Snapshot</h2>
          </div>

          <div className="text-xs space-y-1.5 text-[#4A423B]">
            <p className="font-semibold text-sm text-[#1A1817]">{order.customerName}</p>
            <p className="font-mono text-[#7A7167]">{order.customerEmail}</p>
            <p className="font-mono text-[#7A7167]">{order.customerPhone}</p>
          </div>

          <div className="pt-2 border-t border-[#EAE4D9] text-xs text-[#4A423B] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#1A1817] mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#8C6320]" />
              <span>Delivery Destination</span>
            </div>
            <p>{order.addressLine1}</p>
            {order.addressLine2 && <p>{order.addressLine2}</p>}
            <p>
              {order.city}, {order.state} — <span className="font-mono font-medium">{order.pincode}</span>
            </p>
            {order.deliveryInstructions && (
              <p className="text-[11px] text-[#8C6320] italic mt-2">
                Note: {order.deliveryInstructions}
              </p>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-3">
          <div className="flex items-center gap-2 border-b border-[#EAE4D9] pb-3">
            <CreditCard className="w-4 h-4 text-[#8C6320]" />
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Financial Breakdown</h2>
          </div>

          <div className="space-y-2 text-xs text-[#5C544C]">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-sans font-medium text-[#1A1817] tabular-nums">₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Charge:</span>
              <span className="font-sans font-medium text-[#1A1817] tabular-nums">₹{order.shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (GST Included):</span>
              <span className="font-sans font-medium text-[#1A1817] tabular-nums">₹{order.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Promotional Discount:</span>
                <span className="font-sans font-medium tabular-nums">-₹{order.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#EAE4D9] flex justify-between text-sm font-bold text-[#1A1817]">
              <span>Authoritative Total:</span>
              <span className="font-sans font-bold text-lg text-[#722F37] tabular-nums">
                ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Frozen Order Line Items Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D5] bg-[#F5F2EB]">
          <h2 className="font-serif text-sm font-bold text-[#1A1817]">
            Historical Frozen Line Items ({order.items.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#332D28]">
            <thead className="bg-[#FAF7F0] text-[10px] font-mono uppercase text-[#7A7167] border-b border-[#E5E0D5]">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Collection</th>
                <th className="px-5 py-3">Variant</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D9]">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F5F2EB]/50">
                  <td className="px-5 py-3 font-medium text-[#1A1817]">
                    {item.productName}
                  </td>
                  <td className="px-5 py-3 font-mono uppercase text-[10px] text-[#7A7167]">
                    {item.collectionId}
                  </td>
                  <td className="px-5 py-3 font-sans text-[#5C544C]">
                    {item.variantName || 'Standard'}
                  </td>
                  <td className="px-5 py-3 font-sans tabular-nums">
                    ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 font-sans font-semibold tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 font-sans font-semibold tabular-nums text-right text-[#1A1817]">
                    ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions List */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D5] bg-[#F5F2EB]">
          <h2 className="font-serif text-sm font-bold text-[#1A1817]">
            Associated Payment Transactions ({order.payments.length})
          </h2>
        </div>

        <div className="p-4 space-y-3">
          {order.payments.length === 0 ? (
            <p className="text-xs text-[#7A7167] italic">No payment transactions recorded for this order yet.</p>
          ) : (
            order.payments.map((pay) => (
              <div key={pay.id} className="p-3 bg-white rounded border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-medium text-[#1A1817]">{pay.paymentReference}</span>
                  <div className="flex items-center gap-2 text-[11px] text-[#7A7167] font-mono mt-0.5">
                    <span>Provider: {pay.provider}</span>
                    <span>•</span>
                    <span>Verified: {pay.verifiedAt ? new Date(pay.verifiedAt).toLocaleTimeString() : 'No'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans font-semibold tabular-nums text-[#1A1817]">
                    ₹{pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      pay.status === 'SUCCEEDED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : pay.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {pay.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Milestone History & Tracking Events */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D5] bg-[#F5F2EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8C6320]" />
            <h2 className="font-serif text-sm font-bold text-[#1A1817]">
              Live Milestone History & Atelier Activity Log ({order.trackingEvents?.length || 0})
            </h2>
          </div>
          <a
            href={`/track/${order.orderReference}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#722F37] hover:underline font-semibold"
          >
            Open Patron Live Tracking ↗
          </a>
        </div>

        <div className="p-5 space-y-4">
          {(!order.trackingEvents || order.trackingEvents.length === 0) ? (
            <p className="text-xs text-[#7A7167] italic">No tracking milestones recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-4 border-l-2 border-[#E5E0D5]">
              {order.trackingEvents.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#722F37] border-2 border-[#FBF9F5]" />
                  <div className="bg-white p-3.5 rounded border border-[#E5E0D5]">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="font-serif font-bold text-xs text-[#1A1817]">
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C6320]">
                        {new Date(evt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-xs text-[#5C544C] mb-2">{evt.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#7A7167]">
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E5E0D5]">
                        Status: {evt.status}
                      </span>
                      {evt.carrier && (
                        <span>Carrier: {evt.carrier}</span>
                      )}
                      {evt.trackingNumber && (
                        <span>AWB: {evt.trackingNumber}</span>
                      )}
                      {evt.actor && (
                        <span className="text-[#722F37] font-semibold">Actor: {evt.actor}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
