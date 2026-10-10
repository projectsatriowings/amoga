import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Archive,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminProducts() {
  const { adminFetch } = useAdminStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);

  // Archive modal state
  const [targetProduct, setTargetProduct] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'archive' | 'restore'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        collectionId: selectedCollection,
        q: search,
      });
      if (stockFilter) params.append('inStock', stockFilter);

      const res = await adminFetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load products');
      setProducts(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCollection, stockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleConfirmAction = async () => {
    if (!targetProduct || !modalAction) return;
    setActionLoading(true);
    try {
      const endpoint =
        modalAction === 'archive'
          ? `/api/admin/products/${targetProduct.id}/archive`
          : `/api/admin/products/${targetProduct.id}/restore`;
      const res = await adminFetch(endpoint, { method: 'PATCH' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Action failed');
      }
      setTargetProduct(null);
      setModalAction(null);
      fetchProducts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const collections = [
    { id: 'all', name: 'All Collections' },
    { id: 'food', name: 'Gourmet Food' },
    { id: 'tea', name: 'Botanical Tea' },
    { id: 'sarees', name: 'Heritage Sarees' },
    { id: 'jewellery', name: 'Silver Jewellery' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Product Catalogue</h1>
          <p className="text-xs text-[#7A7167]">
            Unified inventory across all 4 Amoga collections: Gourmet Food, Tea, Heritage Sarees, Silver Jewellery
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filter Tabs by Collection */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E0D5]">
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => {
              setSelectedCollection(col.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCollection === col.id
                ? 'bg-[#1E1916] text-[#F5F2EB]'
                : 'bg-[#FBF9F5] text-[#5C544C] border border-[#D5CEC2] hover:bg-[#EFEAE1]'
            }`}
          >
            {col.name}
          </button>
        ))}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FBF9F5] p-3 rounded-lg border border-[#E5E0D5]">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder="Search by title, slug, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520]"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#4A423B] focus:outline-none focus:border-[#722F37]"
          >
            <option value="">All Stock Statuses</option>
            <option value="true">In Stock Only</option>
            <option value="false">Out of Stock</option>
          </select>

          <button
            onClick={fetchProducts}
            title="Refresh"
            className="p-1.5 bg-white border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading product catalogue...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-700 bg-red-50">
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7167]">
            <p className="font-serif text-base text-[#1A1817] mb-1">No products found</p>
            <p>Try clearing your search terms or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Collection</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Variants</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || '/placeholder.jpg'}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded border border-[#E0D9CD] bg-[#EAE4D9]"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/80x80/f5f2eb/1a1817?text=Amoga';
                          }}
                        />
                        <div>
                          <p className="font-medium text-[#1A1817] line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8377]">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#EFEAE1] border border-[#DFD8CC] text-[10px] font-mono uppercase text-[#5C544C]">
                        {p.collection?.name || p.collectionId}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold text-[#1A1817] tabular-nums whitespace-nowrap">
                      {p.price !== null ? `₹${p.price.toLocaleString('en-IN')}` : 'Bespoke / Unpriced'}
                    </td>
                    <td className="px-5 py-3 font-sans tabular-nums">
                      <span
                        className={`font-semibold ${
                          p.stockQuantity <= 0
                            ? 'text-rose-700'
                            : p.stockQuantity <= 10
                            ? 'text-amber-700'
                            : 'text-emerald-800'
                        }`}
                      >
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#7A7167] font-sans tabular-nums">
                      {p.variants?.length ? `${p.variants.length} options` : 'Standard'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-200 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-[#5C544C] hover:text-[#722F37] hover:bg-[#EFEAE1] rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        {p.isActive ? (
                          <button
                            onClick={() => {
                              setTargetProduct(p);
                              setModalAction('archive');
                            }}
                            className="p-1.5 text-[#8C8377] hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setTargetProduct(p);
                              setModalAction('restore');
                            }}
                            className="p-1.5 text-[#8C8377] hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Restore Product"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#7A7167]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40 hover:bg-[#EFEAE1]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-[#D5CEC2] rounded bg-white disabled:opacity-40 hover:bg-[#EFEAE1]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {targetProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  modalAction === 'archive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {modalAction === 'archive' ? <Archive className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                  {modalAction === 'archive' ? 'Archive Product' : 'Restore Product'}
                </h3>
                <p className="text-xs text-[#7A7167]">{targetProduct.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#4A423B] leading-relaxed">
              {modalAction === 'archive'
                ? 'Archiving hides the product from the customer storefront without deleting order history. Existing orders containing this product remain completely safe.'
                : 'Restoring will re-publish this product to the customer storefront under its collection.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTargetProduct(null);
                  setModalAction(null);
                }}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors ${
                  modalAction === 'archive'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {actionLoading ? 'Processing...' : modalAction === 'archive' ? 'Confirm Archive' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
