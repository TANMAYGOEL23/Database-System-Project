import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Pagination } from './Pagination';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import { EmptyState } from '../feedback/EmptyState';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string | number }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchKey?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  initialPageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchKey,
  searchPlaceholder = 'Search records...',
  filters = [],
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onRowClick,
  actions,
  initialPageSize = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Global text search
      if (searchTerm && searchKey) {
        const searchStr = searchKey(item).toLowerCase();
        if (!searchStr.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Dropdown filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && (item as any)[key] !== undefined) {
          const itemVal = String((item as any)[key]);
          if (itemVal !== value) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKey, activeFilters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const hasActiveFilters = searchTerm !== '' || Object.keys(activeFilters).length > 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Search & Filter Toolbar */}
      {(searchKey || filters.length > 0 || actions) && (
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {searchKey && (
              <div className="w-full sm:w-72">
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            )}

            {filters.map((filter) => (
              <div key={filter.key} className="w-full sm:w-auto">
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                leftIcon={<X className="w-3.5 h-3.5" />}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : paginatedData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={emptyTitle || (hasActiveFilters ? 'No matching records' : 'No records found')}
              description={
                emptyDescription ||
                (hasActiveFilters
                  ? 'Try clearing your search term or active category filters.'
                  : 'There are currently no items logged in this section.')
              }
              actionText={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3.5 px-4 ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors uppercase"
                      >
                        <span>{col.header}</span>
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-normal">
              {paginatedData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
