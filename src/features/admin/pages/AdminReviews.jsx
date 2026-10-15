import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ShieldCheck,
  Filter,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminReviews() {
  const { adminFetch } = useAdminStore();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReviews = async (targetPage = page, currentStatus = statusFilter, query = search) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({
        page: String(targetPage),
        limit: '15',
      });
      if (currentStatus !== 'ALL') sp.set('status', currentStatus);
      if (query.trim()) sp.set('q', query.trim());

      const res = await adminFetch(`/api/reviews/admin?${sp.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load reviews');

      setReviews(json.data || []);
      setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, statusFilter, search);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews(1, statusFilter, search);
  };

  const handleModerate = async (reviewId, newStatus) => {
    setUpdatingId(reviewId);
    setActionMessage(null);
    try {
      const res = await adminFetch(`/api/reviews/admin/${reviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update review status');

      setActionMessage({ type: 'success', text: `Review marked as ${newStatus}` });
      fetchReviews(page, statusFilter, search);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Customer Reviews & Moderation</h1>
          <p className="text-xs text-[#7A7167]">
            Moderate client ratings, inspect verified purchaser badges, and publish verified reviews across storefronts
          </p>
        </div>
        <button
          onClick={() => fetchReviews(page, statusFilter, search)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] w-fit cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8C6320]" />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search by author, review text, or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520] cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B] cursor-pointer"
          >
            <option value="ALL">All Statuses ({pagination.total})</option>
            <option value="PENDING">Pending Moderation</option>
            <option value="APPROVED">Approved & Live</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading && reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading reviews...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            No reviews match the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#EAE4D9]">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 hover:bg-[#F5F2EB]/50 transition-colors flex flex-col md:flex-row gap-4 items-start justify-between">
                {/* Left: Product & Review Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {rev.product?.image && (
                    <img
                      src={rev.product.image}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-[#DFD8CC] shrink-0 bg-stone-200"
                    />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1A1817]">
                        {rev.product?.name || 'Catalogue Product'}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFEAE1] text-[#7A7167]">
                        {rev.product?.collectionId || 'Archive'}
                      </span>
                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-[#1A1817]">&bull; {rev.authorName}</span>
                      <span className="text-[#8C8377] font-mono text-[11px]">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {rev.title && (
                      <h4 className="font-medium text-xs text-[#1A1817] pt-1">
                        &ldquo;{rev.title}&rdquo;
                      </h4>
                    )}
                    <p className="text-xs text-[#4A423B] leading-relaxed max-w-2xl whitespace-pre-line">
                      {rev.content}
                    </p>
                  </div>
                </div>

                {/* Right: Moderation Actions & Status Pill */}
                <div className="flex flex-col items-end gap-2.5 shrink-0 self-end md:self-start">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                      rev.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : rev.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {rev.status === 'PENDING' ? 'Pending Approval' : rev.status}
                  </span>

                  <div className="flex items-center gap-2">
                    {rev.status !== 'APPROVED' && (
                      <button
                        type="button"
                        disabled={updatingId === rev.id}
                        onClick={() => handleModerate(rev.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {rev.status !== 'REJECTED' && (
                      <button
                        type="button"
                        disabled={updatingId === rev.id}
                        onClick={() => handleModerate(rev.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={15}
          onPageChange={(p) => setPage(p)}
          itemName="reviews"
        />
      </div>
    </div>
  );
}
