import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Archive,
  RotateCcw,
  RefreshCw,
  X,
  FileSpreadsheet,
  Trash2,
  MoreVertical,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPagination } from '../components/AdminPagination';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { invalidateProductsCache } from '../../../hooks/useProducts';

export function AdminProducts() {
  const { adminFetch } = useAdminStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Three-dot action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Action modal state
  const [targetProduct, setTargetProduct] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'archive' | 'restore' | 'delete'
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [modalError, setModalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lock body scroll when modal is displayed
  useBodyScrollLock(Boolean(targetProduct));

  // Dismiss action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-actions-menu]')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeMenuId) {
          setActiveMenuId(null);
        } else if (targetProduct && !actionLoading) {
          setTargetProduct(null);
          setModalAction(null);
          setDeleteConfirmText('');
          setModalError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetProduct, actionLoading, activeMenuId]);

  // Auto-dismiss top notifications
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification]);

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

  const fetchProducts = async (searchQuery = debouncedSearch, targetPage = page) => {
    if (products.length === 0) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '10',
        collectionId: selectedCollection,
        q: searchQuery,
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
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProducts(debouncedSearch, page);
  }, [page, selectedCollection, stockFilter, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(search);
    fetchProducts(search, 1);
  };

  const handleConfirmAction = async () => {
    if (!targetProduct || !modalAction) return;
    setActionLoading(true);
    setModalError(null);

    try {
      let endpoint = '';
      let method = 'PATCH';

      if (modalAction === 'archive') {
        endpoint = `/api/admin/products/${targetProduct.id}/archive`;
        method = 'PATCH';
      } else if (modalAction === 'restore') {
        endpoint = `/api/admin/products/${targetProduct.id}/restore`;
        method = 'PATCH';
      } else if (modalAction === 'delete') {
        endpoint = `/api/admin/products/${targetProduct.id}`;
        method = 'DELETE';
      }

      const res = await adminFetch(endpoint, { method });
      const json = await res.json();

      if (!res.ok) {
        setModalError({
          message: json.message || 'Action failed',
          canArchive: Boolean(json.canArchive),
        });
        return;
      }

      const savedCollection = targetProduct.collectionId || 'all';
      setNotification({
        type: 'success',
        message: json.message || 'Action completed successfully',
      });

      setTargetProduct(null);
      setModalAction(null);
      setDeleteConfirmText('');
      setModalError(null);

      invalidateProductsCache(savedCollection);
      fetchProducts();
    } catch (err) {
      setModalError({
        message: err.message || 'An unexpected network error occurred.',
        canArchive: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const collections = [
    { id: 'all', name: 'All Collections' },
    { id: 'food', name: 'Wholesome Pantry' },
    { id: 'tea', name: 'Wellness Tea' },
    { id: 'sarees', name: 'Heritage Sarees' },
    { id: 'jewellery', name: 'Sterling Silver' },
  ];

  // Validation calculations for restore
  const restoreHasValidPrice =
    targetProduct &&
    ((targetProduct.price !== null && targetProduct.price !== undefined && targetProduct.price > 0) ||
      (targetProduct.variants &&
        targetProduct.variants.length > 0 &&
        targetProduct.variants.some((v) => v.price !== null && v.price !== undefined && v.price > 0)));

  // Verification calculations for permanent delete
  const targetSku = targetProduct?.sku || targetProduct?.sourceId || '';
  const isDeleteMatch =
    targetProduct &&
    (deleteConfirmText.trim().toLowerCase() === targetProduct.name.trim().toLowerCase() ||
      (targetSku && deleteConfirmText.trim().toLowerCase() === targetSku.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      {/* Floating or Top Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs shadow-sm transition-all animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-500 hover:text-stone-800 p-0.5 rounded cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Product Catalogue</h1>
          <p className="text-xs text-[#7A7167]">
            Unified inventory across all 4 Amoga collections: Wholesome Pantry, Wellness Tea, Heritage Sarees, Sterling Silver
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/bulk-upload"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E1916] text-[#F5F2EB] text-xs font-semibold rounded shadow-xs hover:bg-[#332C27] transition-colors border border-[#4A4036]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D1B072]" />
            <span>Bulk Product Upload</span>
          </Link>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Link>
        </div>
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
                    fetchProducts('', 1);
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
            onClick={() => fetchProducts(debouncedSearch, page)}
            title="Refresh"
            className="p-1.5 bg-white border border-[#D5CEC2] rounded text-[#4A423B] hover:bg-[#EFEAE1] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-visible">
        {loading && products.length === 0 ? (
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
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs text-[#332D28]">
              <thead className="bg-[#F5F2EB] text-[10px] font-mono uppercase tracking-wider text-[#7A7167] border-b border-[#E5E0D5]">
                <tr>
                  <th className="px-3.5 py-2.5">Product</th>
                  <th className="px-3.5 py-2.5">Collection</th>
                  <th className="px-3.5 py-2.5">Price</th>
                  <th className="px-3.5 py-2.5">Stock</th>
                  <th className="px-3.5 py-2.5">Variants</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="px-3.5 py-2.5">
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-[#8C8377]">{p.slug}</span>
                            {p.sku && (
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#EAE4D9] text-[#5C544C] rounded border border-[#D5CEC2]">
                                {p.sku}
                              </span>
                            )}
                            {p.specs?.categoryReviewRequired && (
                              <span
                                className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-300 font-semibold cursor-help"
                                title={p.specs?.reviewReason || 'Category review required: Please edit and select an approved category'}
                              >
                                Needs Category Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#EFEAE1] border border-[#DFD8CC] text-[10px] font-mono uppercase text-[#5C544C]">
                        {p.collection?.name || p.collectionId}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-sans font-semibold text-[#1A1817] tabular-nums whitespace-nowrap">
                      {p.price !== null ? `₹${p.price.toLocaleString('en-IN')}` : 'Bespoke / Unpriced'}
                    </td>
                    <td className="px-3.5 py-2.5 font-sans tabular-nums">
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
                    <td className="px-3.5 py-2.5 text-[#7A7167] font-sans tabular-nums">
                      {p.variants?.length ? `${p.variants.length} options` : 'Standard'}
                    </td>
                    <td className="px-3.5 py-2.5">
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
                    <td className="px-3.5 py-2.5 text-right relative">
                      <div className="relative inline-flex items-center justify-end" data-actions-menu>
                        {/* Three-Dot Actions Dropdown */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === p.id ? null : p.id);
                          }}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            activeMenuId === p.id
                              ? 'bg-[#1E1916] text-[#F5F2EB]'
                              : 'text-[#8C8377] hover:text-[#1A1817] hover:bg-[#EFEAE1]'
                          }`}
                          title="Product Actions Menu"
                          aria-haspopup="true"
                          aria-expanded={activeMenuId === p.id}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === p.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-[#FBF9F5] border border-[#D5CEC2] rounded-md shadow-xl z-30 py-1 divide-y divide-[#EAE4D9] text-left select-none animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <Link
                                to={`/admin/products/${p.id}/edit`}
                                onClick={() => setActiveMenuId(null)}
                                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#332D28] hover:bg-[#EFEAE1] transition-colors w-full"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#7A7167]" />
                                <span>Edit Product</span>
                              </Link>

                              {p.isActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setTargetProduct(p);
                                    setModalAction('archive');
                                    setModalError(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#332D28] hover:bg-[#EFEAE1] transition-colors w-full cursor-pointer text-left"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Archive Product</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setTargetProduct(p);
                                    setModalAction('restore');
                                    setModalError(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#332D28] hover:bg-[#EFEAE1] transition-colors w-full cursor-pointer text-left"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Restore Product</span>
                                </button>
                              )}
                            </div>

                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setTargetProduct(p);
                                  setModalAction('delete');
                                  setDeleteConfirmText('');
                                  setModalError(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 transition-colors w-full cursor-pointer text-left font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          </div>
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
        <AdminPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
          itemName="products"
        />
      </div>

      {/* Confirmation Dialogs */}
      {targetProduct && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setTargetProduct(null);
              setModalAction(null);
              setDeleteConfirmText('');
              setModalError(null);
            }
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl overscroll-contain select-text"
          >
            {/* Modal Error / Blocked Safeguard Notification */}
            {modalError && (
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-950">Action Blocked by Safeguard</p>
                    <p className="mt-0.5 leading-relaxed">{modalError.message}</p>
                  </div>
                </div>

                {modalError.canArchive && modalAction === 'delete' && (
                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                    <span className="text-[11px] text-rose-800">
                      Recommendation: Archive this product to retain order & financial history.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalAction('archive');
                        setModalError(null);
                        setDeleteConfirmText('');
                      }}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded text-[11px] transition-colors"
                    >
                      Archive Instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1. ARCHIVE MODAL */}
            {modalAction === 'archive' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-amber-100 text-amber-800">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1A1817]">Archive Product</h3>
                    <p className="text-xs text-[#7A7167]">
                      {targetProduct.name} {targetProduct.sku ? `• SKU: ${targetProduct.sku}` : ''}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#F5F2EB] rounded border border-[#E5E0D5] text-xs text-[#4A423B] space-y-2">
                  <p className="font-medium text-[#1A1817]">
                    This product will no longer be available for purchase on the customer storefront.
                  </p>
                  <p className="leading-relaxed">
                    All product details, variants, inventory records, and historical references are fully preserved. You can safely restore this product to active status at any time.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetProduct(null);
                      setModalAction(null);
                      setModalError(null);
                    }}
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{actionLoading ? 'Archiving...' : 'Confirm Archive'}</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. RESTORE MODAL */}
            {modalAction === 'restore' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-800">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1A1817]">Restore Product</h3>
                    <p className="text-xs text-[#7A7167]">
                      {targetProduct.name} {targetProduct.sku ? `• SKU: ${targetProduct.sku}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#4A423B] leading-relaxed">
                  Restoring will re-publish this product to the customer storefront under{' '}
                  <span className="font-semibold text-[#1A1817]">
                    {targetProduct.collection?.name || targetProduct.collectionId}
                  </span>.
                </p>

                {/* Pre-restore validation status */}
                <div className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-2">
                  <p className="font-medium text-[#1A1817] text-[11px] uppercase tracking-wider font-mono">
                    Catalogue Verification Check:
                  </p>
                  <div className="space-y-1.5 text-[#5C544C]">
                    <div className="flex items-center justify-between">
                      <span>Selling Price:</span>
                      <span className="font-semibold text-[#1A1817]">
                        {targetProduct.price !== null ? `₹${targetProduct.price.toLocaleString('en-IN')}` : 'Unpriced / Bespoke'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stock Status:</span>
                      <span className="font-semibold text-[#1A1817]">
                        {targetProduct.stockQuantity} units available
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Variants:</span>
                      <span className="font-semibold text-[#1A1817]">
                        {targetProduct.variants?.length ? `${targetProduct.variants.length} options` : 'Standard product'}
                      </span>
                    </div>
                  </div>

                  {!restoreHasValidPrice && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Product or its variants must have an approved selling price greater than ₹0 before being made purchasable. Please edit the product to set an approved price first.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetProduct(null);
                      setModalAction(null);
                      setModalError(null);
                    }}
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={actionLoading || !restoreHasValidPrice}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{actionLoading ? 'Restoring...' : 'Confirm Restore'}</span>
                  </button>
                </div>
              </>
            )}

            {/* 3. PERMANENT DELETE MODAL */}
            {modalAction === 'delete' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-rose-950">
                      Permanently delete this product?
                    </h3>
                    <p className="text-xs font-mono font-semibold text-rose-900 mt-0.5">
                      {targetProduct.sku || targetProduct.name}
                    </p>
                  </div>
                </div>

                {/* Product Metadata Summary */}
                <div className="p-3 bg-white rounded border border-[#E5E0D5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7167]">Product Name:</span>
                    <span className="font-semibold text-[#1A1817]">{targetProduct.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7167]">SKU:</span>
                    <span className="font-mono font-semibold text-[#1A1817]">
                      {targetProduct.sku || targetProduct.sourceId || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7167]">Collection:</span>
                    <span className="font-medium text-[#1A1817]">
                      {targetProduct.collection?.name || targetProduct.collectionId}
                    </span>
                  </div>
                </div>

                {/* Statutory & Safeguards Explanation */}
                <div className="text-xs text-[#5C544C] leading-relaxed space-y-2">
                  <p>
                    <span className="font-semibold text-rose-950">This action cannot be undone through the application.</span> The product will be permanently removed from the catalogue and PostgreSQL database, subject to historical-data and dependency safeguards.
                  </p>
                  <p className="text-[11px] text-[#7A7167]">
                    Products referenced by customer orders, POS sales, payments, or active inventory reservations cannot be deleted and must be archived instead to preserve transactional and financial integrity.
                  </p>
                </div>

                {/* Typing confirmation requirement */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-medium text-[#1A1817]">
                    To confirm deletion, please type the product name or SKU (
                    <span className="font-mono font-bold text-rose-900 select-all">
                      {targetSku || targetProduct.name}
                    </span>
                    ) below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={`Type "${targetSku || targetProduct.name}" to enable deletion`}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D5]">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetProduct(null);
                      setModalAction(null);
                      setDeleteConfirmText('');
                      setModalError(null);
                    }}
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded font-medium transition-colors cursor-pointer border border-[#D5CEC2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={!isDeleteMatch || actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{actionLoading ? 'Deleting...' : 'Permanently Delete'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
