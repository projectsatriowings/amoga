import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Package,
  FileText,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Camera,
  Play,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminReturns() {
  const { adminFetch } = useAdminStore();
  const [returnRequests, setReturnRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Selected Detail Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [workflowActionLoading, setWorkflowActionLoading] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState(null);

  // Action Form State
  const [nextStatus, setNextStatus] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [infoRequestInput, setInfoRequestInput] = useState('');
  const [inspectionNotesInput, setInspectionNotesInput] = useState('');
  const [returnCarrierInput, setReturnCarrierInput] = useState('');
  const [returnTrackingInput, setReturnTrackingInput] = useState('');
  const [refundRefInput, setRefundRefInput] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [replacementOrderInput, setReplacementOrderInput] = useState('');
  const [shouldRestockInput, setShouldRestockInput] = useState(false);

  // Photo Lightbox State
  const [previewEvidence, setPreviewEvidence] = useState(null);

  const fetchReturns = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '15',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (reasonFilter !== 'ALL') params.set('reason', reasonFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch(`/api/admin/returns?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load return requests');

      setReturnRequests(json.requests || []);
      setPagination(json.pagination || { page: 1, totalPages: 1, totalCount: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(page);
  }, [page, statusFilter, reasonFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReturns(1);
  };

  const handleOpenDetail = async (refOrId) => {
    setDetailLoading(true);
    setWorkflowMessage(null);
    try {
      const res = await adminFetch(`/api/admin/returns/${refOrId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch return details');

      const ret = json.returnRequest;
      setSelectedReturn(ret);
      setNextStatus(ret.status);
      setAdminNotesInput(ret.adminNotes || '');
      setRejectionReasonInput(ret.rejectionReason || '');
      setInfoRequestInput(ret.infoRequestedDetails || '');
      setInspectionNotesInput(ret.inspectionNotes || '');
      setReturnCarrierInput(ret.returnCarrier || 'India Post');
      setReturnTrackingInput(ret.returnTrackingNumber || '');
      setRefundRefInput(ret.refundReference || '');
      setRefundAmountInput(ret.refundAmount ? String(ret.refundAmount) : '');
      setReplacementOrderInput(ret.replacementOrderReference || '');
      setShouldRestockInput(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setWorkflowActionLoading(true);
    setWorkflowMessage(null);

    try {
      const payload = {
        status: nextStatus,
        notes: actionNotes.trim() || undefined,
        adminNotes: adminNotesInput.trim() || undefined,
        rejectionReason: rejectionReasonInput.trim() || undefined,
        infoRequestedDetails: infoRequestInput.trim() || undefined,
        inspectionNotes: inspectionNotesInput.trim() || undefined,
        returnCarrier: returnCarrierInput.trim() || undefined,
        returnTrackingNumber: returnTrackingInput.trim() || undefined,
        refundReference: refundRefInput.trim() || undefined,
        refundAmount: refundAmountInput ? Number(refundAmountInput) : undefined,
        replacementOrderReference: replacementOrderInput.trim() || undefined,
        shouldRestock: shouldRestockInput,
      };

      const res = await adminFetch(`/api/admin/returns/${selectedReturn.id}/workflow`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update workflow state');

      setWorkflowMessage({ type: 'success', text: json.message });
      setSelectedReturn(json.returnRequest);
      fetchReturns(page);
    } catch (err) {
      setWorkflowMessage({ type: 'error', text: err.message });
    } finally {
      setWorkflowActionLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'INFO_REQUESTED':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'PICKUP_SCHEDULED':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'RECEIVED_AT_FACILITY':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'INSPECTED_PASSED':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'INSPECTED_REJECTED':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'REPLACEMENT_DISPATCHED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'REFUND_APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'REFUND_COMPLETED':
        return 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold';
      case 'REJECTED':
        return 'bg-rose-200 text-rose-950 border-rose-400 font-bold';
      case 'CANCELLED':
        return 'bg-stone-200 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getReasonLabel = (r) => {
    switch (r) {
      case 'DAMAGED_PRODUCT':
        return 'Damaged in Transit';
      case 'INCORRECT_PRODUCT':
        return 'Incorrect Product Delivered';
      case 'TRANSIT_SEAL_BROKEN':
        return 'Transit Seal Broken / Tampered';
      case 'DEFECTIVE_OR_SPOILED':
        return 'Defective / Spoiled';
      default:
        return r;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton fallbackTo="/admin" label="Dashboard" />
            <span className="text-xs font-mono text-[#7A7167]">/</span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#722F37] font-semibold">
              Commerce & Claims
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817] flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-[#722F37]" />
            <span>Returns & Claims Management</span>
          </h1>
          <p className="text-xs text-[#7A7167] mt-0.5">
            Process customer returns, review photo/video evidence, schedule pickups, inspect items, and record verified refunds.
          </p>
        </div>

        <button
          onClick={() => fetchReturns(page)}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-[#DDD5C7] rounded-xl text-xs font-semibold text-[#4A423B] hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Claims</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C8377] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Return Ref (AMOGA-RET-...), Customer Email, or Order Ref..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#722F37]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-medium text-[#4A423B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="INFO_REQUESTED">Info Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
              <option value="RECEIVED_AT_FACILITY">Received at Facility</option>
              <option value="INSPECTED_PASSED">Inspected & Passed</option>
              <option value="REPLACEMENT_DISPATCHED">Replacement Dispatched</option>
              <option value="REFUND_COMPLETED">Refund Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-medium text-[#4A423B]"
            >
              <option value="ALL">All Reasons</option>
              <option value="DAMAGED_PRODUCT">Damaged in Transit</option>
              <option value="INCORRECT_PRODUCT">Incorrect Product</option>
              <option value="TRANSIT_SEAL_BROKEN">Broken Transit Seal</option>
              <option value="DEFECTIVE_OR_SPOILED">Defective / Spoiled</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#722F37] text-white rounded-xl text-xs font-semibold hover:bg-[#5E2229] transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading return requests...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-800 bg-rose-50">
            {error}
          </div>
        ) : returnRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167] space-y-2">
            <RotateCcw className="w-8 h-8 text-[#DDD5C7] mx-auto" />
            <p className="font-semibold text-sm text-[#1A1817]">No return requests found</p>
            <p className="text-[11px]">No return claims match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[11px] font-mono uppercase tracking-wider text-[#7A7167]">
                  <th className="py-3 px-4">Claim Ref / Date</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {returnRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-[#722F37] block">{req.returnReference}</span>
                      <span className="text-[10px] text-[#7A7167]">
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-[#1A1817]">
                      <Link
                        to={`/admin/orders/${req.order?.orderReference || req.orderId}`}
                        className="hover:underline text-[#722F37]"
                      >
                        {req.order?.orderReference || 'Order Link'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1A1817] block">
                        {req.order?.customerName || req.customerEmail}
                      </span>
                      <span className="text-[11px] text-[#7A7167] font-mono">{req.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5F2EB] border border-[#E5E0D5] text-[#4A423B]">
                        {getReasonLabel(req.reason)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          req.resolutionPreference === 'REFUND'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {req.resolutionPreference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#4A423B]">
                        <Camera className="w-3.5 h-3.5 text-[#722F37]" />
                        <span>{req.evidences?.length || 0} file(s)</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-semibold text-[#722F37] hover:bg-[#722F37] hover:text-white transition-all shadow-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#EAE3D5] flex items-center justify-between text-xs text-[#7A7167]">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total claims)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-[#FAF8F5] border border-[#DDD5C7] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-[#FAF8F5] border border-[#DDD5C7] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#DDD5C7] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EAE3D5] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#722F37]">
                    {selectedReturn.returnReference}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${getStatusBadge(
                      selectedReturn.status
                    )}`}
                  >
                    {selectedReturn.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1A1817] mt-0.5">
                  Claim Review for Order {selectedReturn.order?.orderReference}
                </h2>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#DDD5C7] flex items-center justify-center text-[#7A7167] hover:text-[#1A1817]"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#292820]">
              {workflowMessage && (
                <div
                  className={`p-3.5 rounded-xl border ${
                    workflowMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {workflowMessage.text}
                </div>
              )}

              {/* Order & Customer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D5]">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#7A7167] block">Customer</span>
                  <p className="font-semibold text-sm text-[#1A1817]">{selectedReturn.order?.customerName}</p>
                  <p className="text-[11px] font-mono text-[#4A423B]">{selectedReturn.customerEmail}</p>
                  {selectedReturn.customerPhone && (
                    <p className="text-[11px] font-mono text-[#7A7167]">{selectedReturn.customerPhone}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-[#7A7167] block">Order Context</span>
                  <p className="font-semibold text-sm text-[#1A1817]">{selectedReturn.order?.orderReference}</p>
                  <p className="text-[11px]">
                    Total Order Value: ₹{Number(selectedReturn.order?.totalAmount || 0).toFixed(2)}
                  </p>
                  <Link
                    to={`/admin/orders/${selectedReturn.order?.orderReference || selectedReturn.orderId}`}
                    target="_blank"
                    className="text-[#722F37] font-semibold underline inline-flex items-center gap-1 mt-1 text-[11px]"
                  >
                    <span>View Order Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-[#7A7167] block">Claim Preference</span>
                  <p className="font-semibold text-sm text-[#1A1817]">{getReasonLabel(selectedReturn.reason)}</p>
                  <p className="text-[11px] font-medium text-[#722F37]">
                    Desired Resolution: <strong>{selectedReturn.resolutionPreference}</strong>
                  </p>
                  {selectedReturn.refundAmount && (
                    <p className="text-[11px] font-mono text-[#287A25]">
                      Claim Amount: ₹{Number(selectedReturn.refundAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Issue Description */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-white border border-[#E5E0D5]">
                <h3 className="font-serif text-sm font-semibold text-[#1A1817]">Customer Description of Issue</h3>
                <p className="text-xs text-[#4A423B] leading-relaxed whitespace-pre-wrap bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE3D5]">
                  {selectedReturn.description}
                </p>
              </div>

              {/* Claimed Line Items */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-semibold text-[#1A1817]">Delivered Products Claimed</h3>
                <div className="border border-[#E5E0D5] rounded-xl overflow-hidden divide-y divide-[#EAE3D5]">
                  {selectedReturn.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#1A1817]">{item.productName}</p>
                        <p className="text-[11px] text-[#7A7167] font-mono">
                          Qty to return: <strong>{item.quantity}</strong> • Unit Price: ₹{Number(item.unitPrice).toFixed(2)}
                        </p>
                        {item.itemConditionNotes && (
                          <p className="text-[11px] text-amber-800 italic mt-0.5">Note: {item.itemConditionNotes}</p>
                        )}
                      </div>
                      <span className="font-bold text-sm text-[#722F37] font-mono">
                        ₹{Number(item.lineTotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Private Evidence Gallery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-semibold text-[#1A1817]">
                    Supporting Evidence ({selectedReturn.evidences?.length || 0})
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Secure Private Storage
                  </span>
                </div>

                {selectedReturn.evidences?.length === 0 ? (
                  <p className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5] text-[11px] text-[#7A7167] italic">
                    No files attached with this submission. Under Indian consumer regulations, evaluate delivery telemetry and package weights.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedReturn.evidences.map((ev) => {
                      const downloadUrl = `/api/admin/returns/${selectedReturn.id}/evidence/${ev.id}`;
                      const isVideo = ev.fileType === 'VIDEO' || ev.mimeType?.startsWith('video/');

                      return (
                        <div
                          key={ev.id}
                          className="group relative rounded-xl border border-[#DDD5C7] overflow-hidden bg-[#FAF8F5] p-2 space-y-1.5"
                        >
                          <div className="h-28 rounded-lg overflow-hidden bg-black/5 flex items-center justify-center relative">
                            {isVideo ? (
                              <div className="flex flex-col items-center gap-1 text-[#722F37]">
                                <Play className="w-8 h-8 fill-current" />
                                <span className="text-[10px] font-mono">Video Evidence</span>
                              </div>
                            ) : (
                              <img
                                src={downloadUrl}
                                alt={ev.fileName}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPreviewEvidence(downloadUrl)}
                              />
                            )}
                          </div>

                          <div className="text-[10px] font-mono truncate text-[#4A423B]">
                            {ev.fileName}
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#7A7167]">{(ev.fileSize / 1024).toFixed(0)} KB</span>
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#722F37] font-semibold underline flex items-center gap-0.5"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Workflow Action Panel */}
              <form onSubmit={handleWorkflowSubmit} className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#C5A46D]/40 space-y-4">
                <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-2">
                  <h3 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#722F37]" />
                    <span>Advance Claim Workflow State</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#8C6320]">Audit-Logged Action</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#4A423B] mb-1">
                      Target Status *
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DDD5C7] rounded-xl text-xs font-medium text-[#1A1817]"
                    >
                      <option value="SUBMITTED">SUBMITTED (Pending review)</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW (Inquiry initiated)</option>
                      <option value="INFO_REQUESTED">INFO REQUESTED (Awaiting customer photos/clarification)</option>
                      <option value="APPROVED">APPROVED (Authorized for reverse pickup/action)</option>
                      <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED (Carrier booking recorded)</option>
                      <option value="RECEIVED_AT_FACILITY">RECEIVED AT FACILITY (Warehouse check-in)</option>
                      <option value="INSPECTED_PASSED">INSPECTED & PASSED (Quality verified)</option>
                      <option value="INSPECTED_REJECTED">INSPECTED & REJECTED (Quality discrepancy)</option>
                      <option value="REPLACEMENT_DISPATCHED">REPLACEMENT DISPATCHED (New order en route)</option>
                      <option value="REFUND_APPROVED">REFUND APPROVED (Finance processing)</option>
                      <option value="REFUND_COMPLETED">REFUND COMPLETED (Payment gateway ref recorded)</option>
                      <option value="REJECTED">REJECTED (Claim declined with formal reason)</option>
                      <option value="CANCELLED">CANCELLED (Customer cancelled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#4A423B] mb-1">
                      Audit Action Log Note
                    </label>
                    <input
                      type="text"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="e.g. Reverse pickup scheduled via India Post Express..."
                      className="w-full px-3 py-2 bg-white border border-[#DDD5C7] rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Conditional Fields Based on Target Status */}
                {nextStatus === 'INFO_REQUESTED' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-orange-900 mb-1">
                      Information Required from Customer *
                    </label>
                    <textarea
                      rows={2}
                      value={infoRequestInput}
                      onChange={(e) => setInfoRequestInput(e.target.value)}
                      placeholder="Detail the required photos or clarification needed..."
                      className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs"
                    />
                  </div>
                )}

                {(nextStatus === 'PICKUP_SCHEDULED' || selectedReturn.status === 'PICKUP_SCHEDULED') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-purple-900 mb-1">
                        Return Pickup Carrier
                      </label>
                      <input
                        type="text"
                        value={returnCarrierInput}
                        onChange={(e) => setReturnCarrierInput(e.target.value)}
                        placeholder="e.g. India Post / BlueDart"
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-purple-900 mb-1">
                        Reverse Tracking / AWB Number
                      </label>
                      <input
                        type="text"
                        value={returnTrackingInput}
                        onChange={(e) => setReturnTrackingInput(e.target.value)}
                        placeholder="e.g. CP123456789IN"
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {(nextStatus === 'INSPECTED_PASSED' || nextStatus === 'INSPECTED_REJECTED') && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#4A423B] mb-1">
                      Inspection Findings & Technical Notes
                    </label>
                    <textarea
                      rows={2}
                      value={inspectionNotesInput}
                      onChange={(e) => setInspectionNotesInput(e.target.value)}
                      placeholder="Physical seal verification, saree fabric inspection, silver hallmark check..."
                      className="w-full px-3 py-2 bg-white border border-[#DDD5C7] rounded-xl text-xs"
                    />
                  </div>
                )}

                {nextStatus === 'REPLACEMENT_DISPATCHED' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-emerald-900 mb-1">
                      Replacement Order Reference / Consignment Number *
                    </label>
                    <input
                      type="text"
                      value={replacementOrderInput}
                      onChange={(e) => setReplacementOrderInput(e.target.value)}
                      placeholder="e.g. AMOGA-ORD-2026-REPLACE-01"
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                )}

                {nextStatus === 'REFUND_COMPLETED' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-300">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-emerald-950 mb-1">
                        Gateway Refund ID / Bank UTR Reference *
                      </label>
                      <input
                        type="text"
                        value={refundRefInput}
                        onChange={(e) => setRefundRefInput(e.target.value)}
                        placeholder="e.g. rfnd_PXYZ123456 or UTR12345678"
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-emerald-800 mt-1">Prevents duplicate refund submissions.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-emerald-950 mb-1">
                        Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === 'REJECTED' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-rose-900 mb-1">
                      Formal Rejection Reason * (Recorded in audit history)
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      placeholder="Explain why the claim does not meet return policy criteria..."
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs"
                    />
                  </div>
                )}

                {/* Safe Restock Option */}
                <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-[#1A1817] flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-[#722F37]" />
                      <span>Restock Returned Inventory</span>
                    </span>
                    <p className="text-[11px] text-[#7A7167]">
                      {selectedReturn.isRestocked
                        ? `Items already restocked on ${new Date(selectedReturn.restockedAt).toLocaleString()} by ${selectedReturn.restockedBy}`
                        : 'Safely increments inventory for undamaged, inspected returned items.'}
                    </p>
                  </div>
                  {!selectedReturn.isRestocked ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shouldRestockInput}
                        onChange={(e) => setShouldRestockInput(e.target.checked)}
                        className="rounded text-[#722F37]"
                      />
                      <span className="text-xs font-semibold text-[#722F37]">Restock Now</span>
                    </label>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Restocked ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(null)}
                    className="px-4 py-2 bg-white border border-[#DDD5C7] rounded-xl text-xs font-medium text-[#4A423B] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={workflowActionLoading}
                    className="px-6 py-2.5 bg-[#722F37] hover:bg-[#5E2229] text-white rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-40"
                  >
                    {workflowActionLoading ? 'Updating Workflow...' : 'Confirm Workflow Transition'}
                  </button>
                </div>
              </form>

              {/* Status History Audit Timeline */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif text-sm font-semibold text-[#1A1817]">Status Audit Trail & History</h3>
                <div className="border border-[#E5E0D5] rounded-xl overflow-hidden divide-y divide-[#EAE3D5]">
                  {selectedReturn.history?.map((h) => (
                    <div key={h.id} className="p-3 bg-white flex items-start justify-between text-xs gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#722F37]">
                            {h.toStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-[#7A7167] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#DDD5C7]">
                            {h.actorRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A423B]">{h.notes || 'Status changed'}</p>
                        <p className="text-[10px] font-mono text-[#7A7167]">Changed by: {h.changedBy}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#7A7167] shrink-0">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {previewEvidence && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewEvidence(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img src={previewEvidence} alt="Evidence preview" className="rounded-xl max-h-[85vh] object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewEvidence(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
