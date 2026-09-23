import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
      {/* Items count & Page Size Selector */}
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="text-slate-200 font-mono">{startItem}</strong> to{' '}
          <strong className="text-slate-200 font-mono">{endItem}</strong> of{' '}
          <strong className="text-slate-200 font-mono">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 text-slate-400 disabled:opacity-30"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 text-slate-400 disabled:opacity-30"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="px-3 py-1 font-mono font-medium text-slate-300">
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 text-slate-400 disabled:opacity-30"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 text-slate-400 disabled:opacity-30"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
