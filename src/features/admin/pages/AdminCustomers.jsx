import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminCustomers() {
  const { adminFetch } = useAdminStore();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        q: search,
      });

      const res = await adminFetch(`/api/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load customers');
      setCustomers(json.customers);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenDetail = async (email) => {
    setDetailLoading(true);
    try {
      const res = await adminFetch(`/api/admin/customers/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load customer dossier');
      setSelectedCustomer(json.customer);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Customer Directory</h1>
          <p className="text-xs text-[#7A7167]">
            Guest and registered buyer profiles synthesized from verified order records
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="p-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] w-fit"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-[#FBF9F5] p-3 rounded-lg border border-[#E5E0D5] flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone number, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520]"
        >
          Search
        </button>
      </form>

      {/* Customers Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading customer directory...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">No customer records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Total Spend</th>
                  <th className="px-5 py-3">Latest Order</th>
                  <th className="px-5 py-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#1A1817]">
                      {c.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-[#5C544C]">
                      <p>{c.email}</p>
                      <p className="text-[#8C8377]">{c.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-[#5C544C]">
                      {c.city}, {c.state} ({c.pincode})
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold tabular-nums text-[#1A1817]">
                      {c.totalOrders}
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold tabular-nums text-[#722F37]">
                      ₹{c.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#7A7167]">
                      {new Date(c.lastOrderAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(c.email)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFEAE1] hover:bg-[#E5E0D5] border border-[#DFD8CC] rounded text-xs font-medium text-[#4A423B]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#7A7167]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} clients)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">{selectedCustomer.name}</h3>
                <p className="text-xs font-mono text-[#8C6320]">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-[#7A7167] hover:text-[#1A1817]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F5F2EB] p-3 rounded border border-[#E0D9CD]">
              <div>
                <span className="text-[#7A7167] block">Phone:</span>
                <span className="font-mono text-[#1A1817]">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-[#7A7167] block">Lifetime Value:</span>
                <span className="font-sans font-bold tabular-nums text-[#722F37]">
                  ₹{selectedCustomer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[#7A7167] block">Primary Delivery Address:</span>
                <span className="text-[#1A1817]">
                  {selectedCustomer.addressLine1}, {selectedCustomer.city}, {selectedCustomer.state} — {selectedCustomer.pincode}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-serif text-sm font-bold text-[#1A1817] mb-2">Order History ({selectedCustomer.orders.length})</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedCustomer.orders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-white rounded border border-[#E5E0D5] text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium text-[#1A1817]">{ord.orderReference}</span>
                      <span className="text-[10px] text-[#7A7167] block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-sans font-semibold tabular-nums text-[#1A1817] block">
                        ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-[#4A423B]">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
