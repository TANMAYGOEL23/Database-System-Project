import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Cpu, Bot, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { inventoryService } from '../../services/inventoryService';
import { StockTransaction, StockTransactionType } from '../../types/inventory';
import { formatDate } from '../../utils/formatters';

export const StockTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getTransactions();
      setTransactions(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Stock Transactions', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTxnBadge = (type: StockTransactionType) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
            <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
            PURCHASE (IN)
          </span>
        );
      case 'PRODUCTION':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-950 text-blue-300 border border-blue-800/60 flex items-center gap-1 w-fit">
            <Cpu className="w-3 h-3 text-blue-400" />
            PRODUCTION (IN)
          </span>
        );
      case 'SALE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800/60 flex items-center gap-1 w-fit">
            <ArrowUpRight className="w-3 h-3 text-rose-400" />
            DISPATCH / SALE (OUT)
          </span>
        );
      case 'ROBOT_MOVEMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 w-fit">
            <Bot className="w-3 h-3 text-indigo-400" />
            AMR INTERNAL MOVE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1 w-fit">
            <ArrowLeftRight className="w-3 h-3 text-amber-400" />
            RECONCILIATION
          </span>
        );
    }
  };

  const columns: Column<StockTransaction>[] = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      sortable: true,
      render: (t) => <span className="font-mono text-xs font-semibold text-blue-400">{t.transactionId}</span>,
    },
    {
      key: 'productName',
      header: 'Product / SKU Item',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.productName}</div>
          <div className="text-[11px] font-mono text-slate-400">{t.productId}</div>
        </div>
      ),
    },
    {
      key: 'transactionType',
      header: 'Transaction Event',
      sortable: true,
      render: (t) => getTxnBadge(t.transactionType),
    },
    {
      key: 'quantity',
      header: 'Quantity Delta',
      sortable: true,
      align: 'right',
      render: (t) => (
        <span
          className={`font-mono font-bold text-xs ${
            t.quantity > 0 ? 'text-emerald-400' : t.quantity < 0 ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          {t.quantity > 0 ? `+${t.quantity}` : t.quantity} Units
        </span>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse Hub',
      render: (t) => <span className="text-xs text-slate-300">{t.warehouseName}</span>,
    },
    {
      key: 'reference',
      header: 'Audit Reference',
      render: (t) => (
        <div className="text-xs">
          <span className="font-mono text-slate-200">{t.reference}</span>
          {t.notes && <div className="text-[11px] text-slate-400">{t.notes}</div>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Timestamp',
      sortable: true,
      render: (t) => <span className="font-mono text-xs text-slate-400">{formatDate(t.date)}</span>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'transactionType',
      label: 'Transaction Type',
      options: [
        { label: 'Purchase Receipt', value: 'PURCHASE' },
        { label: 'Production Completion', value: 'PRODUCTION' },
        { label: 'Sale Dispatch', value: 'SALE' },
        { label: 'AMR Robot Transfer', value: 'ROBOT_MOVEMENT' },
        { label: 'Manual Adjustment', value: 'ADJUSTMENT' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Material Movement & Audit Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all physical inventory movements (Purchases, Manufacturing runs, AMR shuttles, Dispatches).
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Audit Ledger
        </Button>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        rowKey={(t) => t.transactionId}
        searchKey={(t) => `${t.transactionId} ${t.productName} ${t.productId} ${t.reference} ${t.warehouseName}`}
        searchPlaceholder="Filter movements by SKU, reference, or order number..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
