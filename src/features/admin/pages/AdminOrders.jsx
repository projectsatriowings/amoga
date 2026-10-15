import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';

export function AdminOrders() {
  const { adminFetch } = useAdminStore();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Live auto-search debounce: start filtering automatically as words are typed
  useEffect(() => {
    if (search !== debouncedSearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async (searchQuery = debouncedSearch, targetPage = page) => {
    if (orders.length === 0) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '10',
        status,
        paymentStatus,
        q: searchQuery,
      });

      const res = await adminFetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load orders');
      setOrders(json.orders);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchOrders(debouncedSearch, page);
  }, [page, status, paymentStatus, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(search);
    fetchOrders(search, 1);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DISPATCHED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'PENDING_PAYMENT':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-stone-50 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Orders & Fulfilment</h1>
          <p className="text-xs text-[#7A7167]">
            Track luxury orders, customer addresses, carrier tracking, and order state transitions
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8C6320]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search by order ref, customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-[#722F37] animate-spin" />
              )}
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                    setPage(1);
                    fetchOrders('', 1);
                  }}
                  className="text-[#8C8377] hover:text-[#1A1817] cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520] cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="ALL">All Order States</option>
            <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B]"
          >
            <option value="ALL">All Payments</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading orders...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No orders matched the filter criteria.</div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Order Ref</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Order Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Placed At</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-[#1A1817]">
                      {ord.orderReference}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1A1817]">{ord.customerName}</p>
                      <p className="text-[11px] text-[#7A7167] font-mono">{ord.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold text-[#1A1817] tabular-nums whitespace-nowrap">
                      ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                          ord.paymentStatus === 'SUCCEEDED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ord.paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#7A7167] font-mono">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFEAE1] hover:bg-[#E5E0D5] border border-[#DFD8CC] rounded text-xs font-medium text-[#4A423B]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
          itemName="orders"
        />
      </div>
    </div>
  );
}
