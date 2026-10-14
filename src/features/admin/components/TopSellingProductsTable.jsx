import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  Package,
  ArrowUpDown,
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
  const totalPages = Math.ceil(totalItems / itemsPerPage);
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
    <div className="space-y-3.5 w-full">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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
              type="button"
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

      {/* Table Container - Strictly 100% width, no horizontal scroll */}
      <div className="border border-[#E5E0D5] rounded-xl overflow-hidden bg-[#FFFFFF] shadow-2xs w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            {/* Column sizing: Product (30%), Collection (14%), Price (12%), Units (9%), Revenue (14%), Stock (12%), Actions (9%) */}
            <colgroup><col className="w-[30%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[9%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[9%]" /></colgroup>
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5E0D5] text-[#746F63] font-mono text-[10px] uppercase tracking-wider select-none">
                <th className="py-2.5 pl-3 pr-1.5 font-medium">Product</th>
                <th className="py-2.5 px-1.5 font-medium">Collection</th>
                <th
                  className="py-2.5 px-1.5 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('price')}
                  title="Sort by Price"
                >
                  <div className="inline-flex items-center gap-0.5 justify-end">
                    <span>Price</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-[#A89F93]" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-1.5 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('unitsSold')}
                  title="Sort by Units Sold"
                >
                  <div className="inline-flex items-center gap-0.5 justify-end">
                    <span>Units</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-[#A89F93]" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-1.5 font-medium text-right cursor-pointer hover:text-[#292820]"
                  onClick={() => handleSort('revenue')}
                  title="Sort by Revenue"
                >
                  <div className="inline-flex items-center gap-0.5 justify-end">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-[#A89F93]" />
                  </div>
                </th>
                <th className="py-2.5 px-1 font-medium text-center">Stock</th>
                <th className="py-2.5 pl-1 pr-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]/70">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#746F63]">
                    <Package className="w-7 h-7 text-[#A89F93] mx-auto mb-1.5" />
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
                      transition={{ duration: 0.12 }}
                      className="hover:bg-[#F8F6F0]/60 transition-colors"
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-2 pl-3 pr-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-[#F8F6F0] border border-[#E5E0D5] overflow-hidden shrink-0 flex items-center justify-center">
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
                              <Package className="w-3.5 h-3.5 text-[#A89F93]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-medium text-[#292820] truncate text-xs leading-tight"
                              title={p.name}
                            >
                              {p.name}
                            </p>
                            <p
                              className="text-[10px] font-mono text-[#A89F93] truncate leading-tight mt-0.5"
                              title={p.slug || p.id}
                            >
                              {p.slug || p.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Collection */}
                      <td className="py-2 px-1.5 min-w-0">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FAF8F5] border border-[#E5E0D5] text-[#746F63] truncate max-w-full"
                          title={COLLECTION_LABELS[p.collectionId] || p.collectionId || 'Bespoke'}
                        >
                          {COLLECTION_LABELS[p.collectionId] || p.collectionId || 'Bespoke'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-2 px-1.5 text-right whitespace-nowrap">
                        <span className="font-sans font-semibold text-xs text-[#292820] tabular-nums">
                          {p.price > 0
                            ? `₹${p.price.toLocaleString('en-IN')}`
                            : 'Bespoke'}
                        </span>
                      </td>

                      {/* Units Sold */}
                      <td className="py-2 px-1.5 text-right whitespace-nowrap">
                        <span className="font-sans font-semibold text-xs text-[#292820] tabular-nums">
                          {p.unitsSold.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="py-2 px-1.5 text-right whitespace-nowrap">
                        <span className="font-sans font-semibold text-xs text-[#762F39] tabular-nums">
                          {p.revenue > 0
                            ? `₹${p.revenue.toLocaleString('en-IN')}`
                            : '₹0'}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-2 px-1 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-2.5 h-2.5 shrink-0" />
                            <span>Out</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>{p.stockQuantity} low</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            <span>{p.stockQuantity} units</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 pl-1 pr-3 text-right whitespace-nowrap">
                        <Link
                          to="/admin/products"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#762F39] hover:text-[#8F414B] hover:underline"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
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
          <AdminPagination
            currentPage={currentPage}
            totalItems={totalItems}
            totalPages={totalPages}
            pageSize={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="items"
          />
        )}
      </div>
    </div>
  );
}
