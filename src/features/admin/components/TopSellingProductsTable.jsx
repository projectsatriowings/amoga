import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  Package,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { AdminPagination } from './AdminPagination';

const COLLECTION_LABELS = {
  food: 'Wholesome Pantry',
  tea: 'Wellness Tea',
  sarees: 'Heritage Sarees',
  jewellery: 'Silver Jewellery',
};

export function TopSellingProductsTable({ products = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortField, setSortField] = useState('revenue'); // 'revenue' | 'unitsSold' | 'price'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.collectionId && p.collectionId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCollection =
        selectedCollection === 'all' || p.collectionId === selectedCollection;

      return matchesSearch && matchesCollection;
    });
  }, [products, searchTerm, selectedCollection]);

  // Sort
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA = a[sortField] || 0;
      let valB = b[sortField] || 0;

      if (sortOrder === 'desc') {
        return valB - valA;
      }
      return valA - valB;
    });
  }, [filteredProducts, sortField, sortOrder]);

  // Pagination (10 per page)
  const totalItems = sortedProducts.length;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#746F63]" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded-lg text-xs text-[#292820] placeholder-[#A89F93] focus:outline-none focus:border-[#762F39]"
          />
        </div>

        {/* Collection Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'food', 'tea', 'sarees', 'jewellery'].map((col) => (
            <button
              key={col}
              onClick={() => {
                setSelectedCollection(col);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCollection === col
                  ? 'bg-[#762F39] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] border border-[#E5E0D5] text-[#746F63] hover:text-[#292820] hover:bg-[#FAF8F5]'
              }`}
            >
              {col === 'all' ? 'All Collections' : COLLECTION_LABELS[col] || col}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-[#E5E0D5] rounded-xl overflow-hidden bg-[#FFFFFF] shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5E0D5] text-[#746F63] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-3 font-medium">Collection</th>
                <th
                  className="py-3 px-3 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('price')}
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 text-[#A89F93]" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('unitsSold')}
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Units Sold</span>
                    <ArrowUpDown className="w-3 h-3 text-[#A89F93]" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-[#A89F93]" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium text-center">Stock Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]/70">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#746F63]">
                    <Package className="w-8 h-8 text-[#A89F93] mx-auto mb-2" />
                    <p className="font-serif text-sm text-[#292820]">No products found</p>
                    <p className="text-[11px] text-[#746F63] mt-0.5">
                      Adjust your search or collection filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isOutOfStock = !p.inStock || p.stockQuantity <= 0;
                  const isLowStock = !isOutOfStock && p.stockQuantity <= 10;

                  return (
                    <motion.tr
                      key={p.id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-[#F8F6F0]/60 transition-colors"
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F8F6F0] border border-[#E5E0D5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[#A89F93]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                            <p className="font-medium text-[#292820] truncate text-xs">
                              {p.name}
                            </p>
                            <p className="text-[10px] font-mono text-[#A89F93] truncate">
                              {p.slug || p.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Collection */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FAF8F5] border border-[#E5E0D5] text-[#746F63] whitespace-nowrap">
                          {COLLECTION_LABELS[p.collectionId] || p.collectionId || 'Bespoke'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-sans font-semibold text-xs text-[#292820] tabular-nums">
                          {p.price > 0
                            ? `₹${p.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : 'Bespoke'}
                        </span>
                      </td>

                      {/* Units Sold */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-sans font-semibold text-xs text-[#292820] tabular-nums">
                          {p.unitsSold.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-sans font-semibold text-xs text-[#762F39] tabular-nums">
                          ₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            {p.stockQuantity} low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {p.stockQuantity} units
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/products`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#762F39] hover:text-[#8F414B] hover:underline"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Item Pagination Bar */}
        {totalItems > 0 && (
          <div className="p-3 border-t border-[#E5E0D5] bg-[#FAF8F5]/60">
            <AdminPagination
              currentPage={currentPage}
              totalItems={totalItems}
              limit={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
