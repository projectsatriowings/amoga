import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemName = 'items',
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-3.5 sm:p-4 border-t border-[#E5E0D5] bg-[#FFFFFF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#746F63]">
      <div className="font-sans text-xs">
        Showing{' '}
        <span className="font-semibold text-[#292820] tabular-nums">
          {startItem}–{endItem}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-[#292820] tabular-nums">
          {totalItems}
        </span>{' '}
        {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg bg-white text-[#292820] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F0] transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-[#898477] font-mono text-xs">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs tabular-nums transition-colors cursor-pointer ${
                  currentPage === p
                    ? 'bg-[#762F39] text-white shadow-2xs font-semibold'
                    : 'text-[#4A423B] hover:bg-[#F8F6F0] border border-transparent hover:border-[#D5CEC2] font-medium'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg bg-white text-[#292820] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F0] transition-colors cursor-pointer"
          title="Next Page"
        >
          <span className="hidden sm:inline text-xs font-medium">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
