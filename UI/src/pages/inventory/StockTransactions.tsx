import React, { useState, useEffect } from 'react';
import { History, ArrowDownLeft, ArrowUpRight, Bot, SlidersHorizontal, Factory, ShoppingCart } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { inventoryService } from '../../services/inventoryService';
import { warehouseService } from '../../services/warehouseService';
import { StockTransaction, Warehouse } from '../../types/inventory';
import { formatDateTime } from '../../utils/formatters';

export const StockTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [txns, whs] = await Promise.all([
        inventoryService.getTransactions(),
        warehouseService.getAllWarehouses(),
      ]);
      setTransactions(txns);
      setWarehouses(whs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTxnIcon = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'PURCHASE':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SALE':
        return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />;
      case 'PRODUCTION':
        return <Factory className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ROBOT_MOVEMENT':
        return <Bot className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ADJUSTMENT':
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const columns: Column<StockTransaction>[] = [
    {
      key: 'transactionId',
      header: 'Txn ID',
      sortable: true,
      render: (t) => <span className="font-mono font-semibold text-blue-400">{t.transactionId}</span>,
    },
    {
      key: 'productName',
      header: 'Product Item',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.productName}</div>
          <div className="text-[11px] font-mono text-slate-400">{t.productId}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse Facility',
      sortable: true,
      render: (t) => <span className="text-slate-300 text-xs">{t.warehouseName}</span>,
    },
    {
      key: 'transactionType',
      header: 'Type',
      sortable: true,
      render: (t) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-200">
          {getTxnIcon(t.transactionType)}
          {t.transactionType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity Flow',
      sortable: true,
      align: 'right',
      render: (t) => (
        <span className={`font-mono font-bold text-sm ${t.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Document Reference',
      render: (t) => (
        <div>
          <span className="font-mono text-xs text-slate-300 font-semibold">{t.reference}</span>
          {t.notes && <p className="text-[10px] text-slate-400 line-clamp-1">{t.notes}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Audit Timestamp',
      sortable: true,
      render: (t) => <span className="font-mono text-xs text-slate-400">{formatDateTime(t.date)}</span>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'transactionType',
      label: 'Transaction Type',
      options: [
        { label: 'Purchase Inward', value: 'PURCHASE' },
        { label: 'Production Output', value: 'PRODUCTION' },
        { label: 'Customer Sale Outward', value: 'SALE' },
        { label: 'Robot AGV Movement', value: 'ROBOT_MOVEMENT' },
        { label: 'Cycle Adjustment', value: 'ADJUSTMENT' },
      ],
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      options: warehouses.map((w) => ({ label: w.warehouseName, value: w.warehouseName })),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Stock Transaction Audit Ledger</h2>
        <p className="text-xs text-slate-400 mt-1">
          Immutable double-entry inventory movement logs: Purchase Receipts, Manufacturing Runs, AMR Movements, and Sales.
        </p>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        rowKey={(t) => t.transactionId}
        searchKey={(t) => `${t.transactionId} ${t.productName} ${t.reference} ${t.warehouseName}`}
        searchPlaceholder="Search transactions by ID, product, reference..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
