import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from './Pagination';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import { EmptyState } from '../feedback/EmptyState';
import { Input } from '../ui/Input';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: string | ((item: T) => string);
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  actions?: React.ReactNode;
  pageSize?: number;
  rowKey: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search records...',
  filters = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  onEmptyAction,
  emptyActionLabel,
  actions,
  pageSize: initialPageSize = 10,
  rowKey,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim() && searchKey) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => {
        if (typeof searchKey === 'function') {
          return searchKey(item).toLowerCase().includes(q);
        }
        const val = (item as any)[searchKey];
        return String(val || '').toLowerCase().includes(q);
      });
    }

    // Dropdown filters
    Object.entries(activeFilters).forEach(([key, filterVal]) => {
      if (filterVal && filterVal !== 'ALL') {
        result = result.filter((item) => String((item as any)[key]) === filterVal);
      }
    });

    // Sorting
    if (sortKey) {
      result.sort((a: any, b: any) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, searchKey, activeFilters, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
      {/* Header controls: Search, Filters, Action buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {searchKey && (
            <div className="w-full sm:w-72">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          )}

          {filters.map((filter) => (
            <div key={filter.key} className="w-full sm:w-auto">
              <select
                value={activeFilters[filter.key] || 'ALL'}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Table Body */}
      {isLoading ? (
        <LoadingSpinner />
      ) : processedData.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-6 py-4 ${col.width || ''} ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.sortable ? 'cursor-pointer select-none hover:text-white' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end w-full' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500">
                          {sortKey === col.key ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {paginatedData.map((item) => (
                <tr
                  key={rowKey(item)}
                  className="transition-colors hover:bg-slate-800/50 group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 whitespace-nowrap ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && processedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
