import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Factory, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { ProductionLog, ProductionOrder } from '../../types/production';
import { formatDateTime } from '../../utils/formatters';

export const ProductionLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [quantityProduced, setQuantityProduced] = useState('50');
  const [status, setStatus] = useState<ProductionLog['status']>('NORMAL');
  const [remarks, setRemarks] = useState('Shift run certified within tolerance.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [l, o] = await Promise.all([
        productionService.getLogs(),
        productionService.getOrders(),
      ]);
      setLogs(l);
      setOrders(o);
      if (o.length > 0 && !selectedOrderId) {
        setSelectedOrderId(o[0].productionOrderId);
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Logs', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantityProduced, 10);
    if (isNaN(qty) || qty <= 0) return;

    try {
      setIsSubmitting(true);
      await productionService.addLog({
        productionOrderId: selectedOrderId,
        quantityProduced: qty,
        status,
        remarks,
        operatorName: 'Floor Supervisor Desk',
      });

      showToast('success', 'Production Log Added', `Recorded ${qty} units for order ${selectedOrderId}.`);
      setIsAddLogOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Failed to Add Log', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ProductionLog>[] = [
    {
      key: 'logId',
      header: 'Log ID',
      sortable: true,
      render: (l) => <span className="font-mono font-semibold text-blue-400">{l.logId}</span>,
    },
    {
      key: 'productionOrderId',
      header: 'Production Work Order',
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono font-semibold text-slate-100">{l.productionOrderId}</span>
        </div>
      ),
    },
    {
      key: 'quantityProduced',
      header: 'Produced Output',
      sortable: true,
      align: 'right',
      render: (l) => (
        <span className="font-mono font-bold text-cyan-400 text-sm">
          +{l.quantityProduced} Units
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Operator Notes & Remarks',
      render: (l) => <span className="text-xs text-slate-300">{l.remarks}</span>,
    },
    {
      key: 'operatorName',
      header: 'Recorded By',
      render: (l) => <span className="text-xs text-slate-400">{l.operatorName || 'Shift Operator'}</span>,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (l) => <span className="font-mono text-xs text-slate-400">{formatDateTime(l.timestamp)}</span>,
    },
    {
      key: 'status',
      header: 'Quality Status',
      sortable: true,
      render: (l) => <StatusBadge status={l.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Production Audit Logs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time shift output recordings, defect quarantine logs, and automated work-order completion updates.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddLogOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Production Log
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        rowKey={(l) => l.logId}
        searchKey={(l) => `${l.logId} ${l.productionOrderId} ${l.remarks} ${l.operatorName || ''}`}
        searchPlaceholder="Search logs by order ID, remarks..."
        isLoading={isLoading}
      />

      {/* Add Log Modal */}
      <Modal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        title="Record New Production Batch Log"
        subtitle="PostgreSQL PRODUCTION_LOG entity"
        maxWidth="md"
        icon={<ClipboardList className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleAddLogSubmit} className="space-y-4">
          <Select
            label="Target Work Order"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            options={orders.map((o) => ({
              label: `${o.productionOrderId} - ${o.productName} (${o.producedQuantity}/${o.quantity} units)`,
              value: o.productionOrderId,
            }))}
            required
          />

          <Input
            label="Batch Quantity Produced"
            type="number"
            min="1"
            value={quantityProduced}
            onChange={(e) => setQuantityProduced(e.target.value)}
            required
          />

          <Select
            label="Quality & Inspection Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { label: 'NORMAL (Passed Tolerance Inspection)', value: 'NORMAL' },
              { label: 'DEFECTIVE (Quarantined)', value: 'DEFECTIVE' },
              { label: 'MAINTENANCE_STOP (Halted for Tooling)', value: 'MAINTENANCE_STOP' },
            ]}
            required
          />

          <Input
            label="Operator Remarks / Calibration Details"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Afternoon shift run; tolerance testing within 0.002mm"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsAddLogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Production Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
