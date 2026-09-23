import React, { useState, useEffect } from 'react';
import { Plus, Play, CheckCircle, Clock, AlertTriangle, Layers, UserCheck } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { productService } from '../../services/productService';
import { ProductionOrder, Machine, ProductionPriority, ProductionOrderStatus } from '../../types/production';
import { Product } from '../../types/inventory';
import { formatDate } from '../../utils/formatters';

export const ProductionOrders: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<ProductionPriority>('MEDIUM');
  const [operatorName, setOperatorName] = useState('Alex Rivera');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log Output Modal
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<ProductionOrder | null>(null);
  const [producedDelta, setProducedDelta] = useState('10');
  const [logRemarks, setLogRemarks] = useState('Shift batch completed without defects');
  const [logStatus, setLogStatus] = useState<'NORMAL' | 'DEFECTIVE' | 'MAINTENANCE_STOP'>('NORMAL');

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ords, prods, machs] = await Promise.all([
        productionService.getOrders(),
        productService.getAll(),
        productionService.getMachines(),
      ]);
      setOrders(ords);
      setProducts(prods);
      setMachines(machs);
      if (prods.length > 0 && !selectedProdId) setSelectedProdId(prods[0].productId);
      if (machs.length > 0 && !selectedMachineId) setSelectedMachineId(machs[0].machineId);
    } catch (e: any) {
      showToast('error', 'Failed to Load Production Orders', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    setStartDate(today);
    setEndDate(nextWeek.toISOString().split('T')[0]);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prd = products.find((p) => p.productId === selectedProdId);
    const mch = machines.find((m) => m.machineId === selectedMachineId);
    if (!prd || !mch) return;

    try {
      setIsSubmitting(true);
      await productionService.createOrder({
        productId: prd.productId,
        productName: prd.productName,
        machineId: mch.machineId,
        machineName: mch.machineName,
        quantity: parseInt(quantity, 10) || 50,
        startDate,
        endDate,
        status: 'PLANNED',
        priority,
        assignedOperatorName: operatorName,
        notes,
      });

      showToast('success', 'Work Order Created', `Batch scheduled on ${mch.machineName}.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Failed to Schedule Order', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLogOutput = (order: ProductionOrder) => {
    setTargetOrder(order);
    const remaining = order.quantity - order.producedQuantity;
    setProducedDelta(String(Math.max(1, remaining)));
    setLogRemarks('Batch units completed QA inspection');
    setLogStatus('NORMAL');
    setIsLogOpen(true);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrder) return;

    try {
      setIsSubmitting(true);
      const qty = parseInt(producedDelta, 10) || 1;
      await productionService.addLog({
        productionOrderId: targetOrder.productionOrderId,
        quantityProduced: qty,
        status: logStatus,
        remarks: logRemarks,
        operatorName: targetOrder.assignedOperatorName || 'Shift Lead',
      });

      showToast('success', 'Production Logged', `Recorded ${qty} completed units. Finished goods inventory updated.`);
      setIsLogOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Log Submission Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'productionOrderId',
      header: 'Work Order ID',
      sortable: true,
      render: (o) => <span className="font-mono text-xs font-semibold text-blue-400">{o.productionOrderId}</span>,
    },
    {
      key: 'productName',
      header: 'Manufactured Product SKU',
      sortable: true,
      render: (o) => (
        <div>
          <div className="font-semibold text-slate-100">{o.productName}</div>
          <div className="text-[11px] font-mono text-slate-400">SKU: {o.productId}</div>
        </div>
      ),
    },
    {
      key: 'machineName',
      header: 'Workcell / Line',
      sortable: true,
      render: (o) => (
        <span className="text-xs text-slate-300 font-mono">
          {o.machineName} ({o.machineId})
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress & Batch Target',
      sortable: true,
      align: 'right',
      render: (o) => {
        const pct = Math.min(100, Math.round((o.producedQuantity / (o.quantity || 1)) * 100));
        return (
          <div className="text-right">
            <span className="font-mono text-xs font-semibold text-slate-200">
              {o.producedQuantity} / {o.quantity} Units ({pct}%)
            </span>
            <div className="w-24 bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (o) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
            o.priority === 'URGENT'
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : o.priority === 'HIGH'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {o.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Order Status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Floor Actions',
      align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          {o.status !== 'COMPLETED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenLogOutput(o)}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Log Yield
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Order Status',
      options: [
        { label: 'Planned', value: 'PLANNED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manufacturing Orders & Floor Schedules</h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch work orders to assembly lines, log machine output batches, and auto-credit finished goods inventory.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Schedule Work Order
        </Button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        rowKey={(o) => o.productionOrderId}
        searchKey={(o) => `${o.productionOrderId} ${o.productName} ${o.machineName} ${o.assignedOperatorName}`}
        searchPlaceholder="Search work orders by ID, product, or machine..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Schedule Work Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Manufacturing Work Order"
        subtitle="PRODUCTION_ORDERS schema dispatch"
        maxWidth="lg"
        icon={<Layers className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Finished Good / Assembly SKU"
            value={selectedProdId}
            onChange={(e) => setSelectedProdId(e.target.value)}
            options={products.map((p) => ({ label: `${p.productName} (${p.productId})`, value: p.productId }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned CNC / Workcell Machine"
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              options={machines.map((m) => ({ label: `${m.machineName} [${m.location}]`, value: m.machineId }))}
              required
            />
            <Input
              label="Batch Quantity Target"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Estimated Finish Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProductionPriority)}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Urgent', value: 'URGENT' },
              ]}
              required
            />
          </div>

          <Input
            label="Assigned Floor Operator / Supervisor"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            required
          />

          <Input
            label="Engineering Notes / Tooling Instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Preset torque to 45Nm, verify tolerances"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Schedule Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Output Modal */}
      <Modal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Production Batch Yield"
        subtitle={`Record units produced for ${targetOrder?.productionOrderId}`}
        maxWidth="md"
        icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Product:</span>
              <span className="font-semibold text-slate-200">{targetOrder?.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target / Remaining:</span>
              <span className="font-mono text-blue-400">
                {targetOrder ? targetOrder.quantity - targetOrder.producedQuantity : 0} Units remaining
              </span>
            </div>
          </div>

          <Input
            label="Units Produced in This Run"
            type="number"
            min="1"
            value={producedDelta}
            onChange={(e) => setProducedDelta(e.target.value)}
            required
          />

          <Select
            label="Batch Quality Status"
            value={logStatus}
            onChange={(e) => setLogStatus(e.target.value as any)}
            options={[
              { label: 'Normal / Passed Quality Inspection', value: 'NORMAL' },
              { label: 'Defective Units Found', value: 'DEFECTIVE' },
              { label: 'Emergency Maintenance Stop', value: 'MAINTENANCE_STOP' },
            ]}
            required
          />

          <Input
            label="Inspection Remarks"
            value={logRemarks}
            onChange={(e) => setLogRemarks(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsLogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit & Credit Finished Goods
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
