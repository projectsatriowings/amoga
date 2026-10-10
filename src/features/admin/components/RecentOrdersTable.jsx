import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, ExternalLink, ArrowRight, Filter, ChevronRight } from 'lucide-react';
import { AdminPagination } from './AdminPagination';

export function RecentOrdersTable({ orders = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((ord) => {
        const matchesSearch =
          ord.orderReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ord.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ord.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' || ord.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'totalAmount') {
          diff = a.totalAmount - b.totalAmount;
        } else {
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortAsc ? diff : -diff;
      });
  }, [orders, searchTerm, statusFilter, sortField, sortAsc]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((page - 1) * 10, page * 10);
  }, [filteredOrders, page]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-[#3F5A35]/10 text-[#3F5A35] border-[#3F5A35]/30';
      case 'PROCESSING':
        return 'bg-[#B08A4D]/10 text-[#8C6320] border-[#B08A4D]/30';
      case 'DISPATCHED':
        return 'bg-[#762F39]/10 text-[#762F39] border-[#762F39]/30';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898477]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order ref, customer name, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E5E0D5] rounded-lg text-[#292820] placeholder-[#898477] focus:outline-none focus:border-[#762F39]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-[#762F39] text-white shadow-xs font-semibold'
                  : 'text-[#746F63] hover:text-[#292820] bg-[#FFFFFF] border border-[#E5E0D5]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table for Desktop / Tablet */}
      <div className="hidden md:block w-full border border-[#E5E0D5] rounded-xl bg-[#FFFFFF] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-[#292820] table-auto">
          <thead className="bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#746F63] border-b border-[#E5E0D5]">
            <tr>
              <th className="px-3.5 py-2.5">Order Ref</th>
              <th className="px-3.5 py-2.5">Customer</th>
              <th
                className="px-3.5 py-2.5 cursor-pointer select-none hover:text-[#292820] whitespace-nowrap"
                onClick={() => toggleSort('totalAmount')}
              >
                <div className="flex items-center gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-3.5 py-2.5 whitespace-nowrap">Order Status</th>
              <th className="px-3.5 py-2.5 whitespace-nowrap">Payment</th>
              <th
                className="px-3.5 py-2.5 cursor-pointer select-none hover:text-[#292820] whitespace-nowrap"
                onClick={() => toggleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-3.5 py-2.5 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8F6F0]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-xs text-[#746F63]">
                  No orders match the current search or status filter.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className="hover:bg-[#FAF8F5] transition-colors duration-150 group"
                >
                  <td className="px-3.5 py-2.5 font-mono text-xs font-medium text-[#292820]">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="text-[#762F39] hover:underline block truncate max-w-[170px]"
                      title={ord.orderReference}
                    >
                      <span>{ord.orderReference}</span>
                    </Link>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <p className="font-medium text-[#292820] truncate max-w-[150px]">{ord.customerName || 'Guest Patron'}</p>
                    <p className="text-[11px] text-[#746F63] font-mono truncate max-w-[150px]">{ord.customerEmail}</p>
                  </td>
                  <td className="px-3.5 py-2.5 font-sans font-semibold text-xs sm:text-sm text-[#292820] tabular-nums whitespace-nowrap">
                    ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${getOrderStatusBadge(
                        ord.status
                      )}`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${getPaymentStatusBadge(
                        ord.paymentStatus
                      )}`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-[#746F63] font-mono text-[11px] whitespace-nowrap">
                    {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#762F39] hover:bg-[#762F39]/10 rounded-md font-medium transition-colors"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#746F63] bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl">
            No orders match the current filter.
          </div>
        ) : (
          paginatedOrders.map((ord) => (
            <Link
              key={ord.id}
              to={`/admin/orders/${ord.id}`}
              className="block p-4 bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl hover:border-[#D5CEC2] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-[#762F39]">
                  {ord.orderReference}
                </span>
                <span className="font-sans font-semibold text-sm text-[#292820] tabular-nums">
                  ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-[#292820] mb-2">
                <p className="font-medium">{ord.customerName}</p>
                <p className="text-[11px] text-[#746F63] font-mono">{ord.customerEmail}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F8F6F0] text-[10px] font-mono">
                <span
                  className={`px-1.5 py-0.5 rounded border font-medium ${getOrderStatusBadge(
                    ord.status
                  )}`}
                >
                  {ord.status}
                </span>
                <span className="text-[#746F63]">
                  {new Date(ord.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={Math.ceil(filteredOrders.length / 10) || 1}
        totalItems={filteredOrders.length}
        pageSize={10}
        onPageChange={setPage}
        itemName="orders"
      />
    </div>
  );
}
