import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, AlertTriangle, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { ProductionLog } from '../../types/production';
import { formatDate } from '../../utils/formatters';

export const ProductionLogs: React.FC = () => {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await productionService.getLogs();
      setLogs(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Production Logs', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            PASSED QA
          </span>
        );
      case 'DEFECTIVE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            DEFECTIVE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800/60 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-400" />
            MAINTENANCE STOP
          </span>
        );
    }
  };

  const columns: Column<ProductionLog>[] = [
    {
      key: 'logId',
      header: 'Log ID',
      sortable: true,
      render: (l) => <span className="font-mono text-xs font-semibold text-blue-400">{l.logId}</span>,
    },
    {
      key: 'productionOrderId',
      header: 'Work Order Ref',
      sortable: true,
      render: (l) => <span className="font-mono text-xs text-slate-200">{l.productionOrderId}</span>,
    },
    {
      key: 'quantityProduced',
      header: 'Yield Output',
      sortable: true,
      align: 'right',
      render: (l) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          +{l.quantityProduced} Units
        </span>
      ),
    },
    {
      key: 'status',
      header: 'QA Inspection',
      sortable: true,
      render: (l) => getStatusBadge(l.status),
    },
    {
      key: 'operatorName',
      header: 'Floor Operator',
      render: (l) => (
        <span className="text-xs text-slate-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          {l.operatorName || 'Supervisor'}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Batch Remarks',
      render: (l) => <span className="text-xs text-slate-400">{l.remarks}</span>,
    },
    {
      key: 'timestamp',
      header: 'Logged At',
      sortable: true,
      render: (l) => <span className="font-mono text-xs text-slate-400">{formatDate(l.timestamp)}</span>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Batch Status',
      options: [
        { label: 'Passed QA', value: 'NORMAL' },
        { label: 'Defects Logged', value: 'DEFECTIVE' },
        { label: 'Maintenance Stop', value: 'MAINTENANCE_STOP' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Machine Output Logs & Quality Records</h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical ledger of manufacturing shifts, batch inspection yields, and line stoppage reports.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Logs
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        rowKey={(l) => l.logId}
        searchKey={(l) => `${l.logId} ${l.productionOrderId} ${l.operatorName} ${l.remarks}`}
        searchPlaceholder="Search logs by order reference, operator, or notes..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
