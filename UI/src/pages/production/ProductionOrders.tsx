import React, { useState, useEffect } from 'react';
import { Plus, Factory, Eye, PlusCircle, Calendar, Cpu, CheckCircle2 } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { productService } from '../../services/productService';
import { employeeService } from '../../services/employeeService';
import { ProductionOrder, ProductionLog, Machine, ProductionPriority, ProductionOrderStatus } from '../../types/production';
import { Product } from '../../types/inventory';
import { Employee } from '../../types/hr';
import { formatDate } from '../../utils/formatters';

export const ProductionOrders: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [orderLogs, setOrderLogs] = useState<ProductionLog[]>([]);

  // Create Form State
  const [formData, setFormData] = useState({
    productId: '',
    machineId: '',
    quantity: '500',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    priority: 'HIGH' as ProductionPriority,
    assignedOperatorId: '',
    notes: '',
  });

  // Log Form State
  const [logFormData, setLogFormData] = useState({
    quantityProduced: '50',
    status: 'NORMAL' as ProductionLog['status'],
    remarks: 'Routine shift production run without tool alarms.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ords, machs, prods, emps] = await Promise.all([
        productionService.getOrders(),
        productionService.getMachines(),
        productService.getAll(),
        employeeService.getAll(),
      ]);
      setOrders(ords);
      setMachines(machs);
      setProducts(prods);
      setEmployees(emps);
      if (prods.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: prods[0].productId }));
      }
      if (machs.length > 0 && !formData.machineId) {
        setFormData((prev) => ({ ...prev, machineId: machs[0].machineId }));
      }
      if (emps.length > 0 && !formData.assignedOperatorId) {
        setFormData((prev) => ({ ...prev, assignedOperatorId: emps[0].employeeId }));
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Orders', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    const logs = await productionService.getLogs(order.productionOrderId);
    setOrderLogs(logs);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prd = products.find((p) => p.productId === formData.productId);
    const mach = machines.find((m) => m.machineId === formData.machineId);
    const op = employees.find((e) => e.employeeId === formData.assignedOperatorId);

    if (!prd || !mach) return;

    try {
      setIsSubmitting(true);
      const newOrder = await productionService.createOrder({
        productId: prd.productId,
        productName: prd.productName,
        machineId: mach.machineId,
        machineName: mach.machineName,
        quantity: parseInt(formData.quantity, 10) || 100,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'PLANNED',
        priority: formData.priority,
        assignedOperatorId: op?.employeeId,
        assignedOperatorName: op ? `${op.firstName} ${op.lastName}` : undefined,
        notes: formData.notes,
      });

      showToast('success', 'Production Order Scheduled', `Order ${newOrder.productionOrderId} for ${prd.productName} created.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const qty = parseInt(logFormData.quantityProduced, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('error', 'Validation Error', 'Quantity produced must be > 0');
      return;
    }

    try {
      setIsSubmitting(true);
      await productionService.addLog({
        productionOrderId: selectedOrder.productionOrderId,
        quantityProduced: qty,
        status: logFormData.status,
        remarks: logFormData.remarks,
        operatorName: 'Operator Desk',
      });

      showToast(
        'success',
        'Production Batch Logged',
        `Logged ${qty} units for order ${selectedOrder.productionOrderId}. Order completion updated.`
      );

      setIsAddLogOpen(false);
      const updatedOrder = await productionService.getOrderById(selectedOrder.productionOrderId);
      setSelectedOrder(updatedOrder);
      const updatedLogs = await productionService.getLogs(selectedOrder.productionOrderId);
      setOrderLogs(updatedLogs);
      loadData();
    } catch (err: any) {
      showToast('error', 'Logging Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'productionOrderId',
      header: 'Order ID',
      sortable: true,
      render: (o) => <span className="font-mono font-semibold text-blue-400">{o.productionOrderId}</span>,
    },
    {
      key: 'productName',
      header: 'Product to Manufacture',
      sortable: true,
      render: (o) => (
        <div>
          <div className="font-semibold text-slate-100">{o.productName}</div>
          <div className="text-[11px] text-slate-400 font-mono">Cell: {o.machineName}</div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Manufacturing Progress',
      render: (o) => {
        const pct = Math.round((o.producedQuantity / o.quantity) * 100);
        return (
          <div className="w-48">
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>{o.producedQuantity} / {o.quantity} units</span>
              <span className="font-bold text-cyan-400">{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  pct >= 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'startDate',
      header: 'Schedule Window',
      render: (o) => (
        <span className="font-mono text-xs text-slate-400">
          {formatDate(o.startDate)} → {formatDate(o.endDate)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (o) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
          o.priority === 'URGENT'
            ? 'bg-rose-500/20 text-rose-300'
            : o.priority === 'HIGH'
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {o.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (o) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenDetail(o)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Progress & Logs
        </Button>
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
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Production Orders</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manufacturing batch work orders, machine allocation, operator shift assignments, and real-time progress bars.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Production Order
        </Button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        rowKey={(o) => o.productionOrderId}
        searchKey={(o) => `${o.productionOrderId} ${o.productName} ${o.machineName}`}
        searchPlaceholder="Search production orders by ID, product, machine..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Manufacturing Work Order"
        subtitle="PostgreSQL PRODUCTION_ORDER relational entity"
        maxWidth="lg"
        icon={<Factory className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Product to Manufacture"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={products.map((p) => ({
              label: `${p.productName} (${p.productId})`,
              value: p.productId,
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Machine / Cell"
              value={formData.machineId}
              onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
              options={machines.map((m) => ({
                label: `${m.machineName} (${m.status})`,
                value: m.machineId,
              }))}
              required
            />
            <Input
              label="Target Batch Quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Estimated Completion Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Production Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProductionPriority })}
              options={[
                { label: 'Normal / Medium', value: 'MEDIUM' },
                { label: 'High Priority', value: 'HIGH' },
                { label: 'Urgent Expedite', value: 'URGENT' },
                { label: 'Low Priority', value: 'LOW' },
              ]}
              required
            />
            <Select
              label="Lead Operator"
              value={formData.assignedOperatorId}
              onChange={(e) => setFormData({ ...formData, assignedOperatorId: e.target.value })}
              options={employees.map((emp) => ({
                label: `${emp.fullName || emp.firstName + ' ' + emp.lastName} (${emp.departmentName})`,
                value: emp.employeeId,
              }))}
            />
          </div>

          <Input
            label="Manufacturing Notes / SOP Remarks"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Requires 5-axis calibration before batch execution"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Schedule Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Production Order Detail & Progress Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Work Order: ${selectedOrder.productionOrderId}`}
          subtitle={`${selectedOrder.productName} • Machine: ${selectedOrder.machineName}`}
          maxWidth="2xl"
          icon={<Factory className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-5">
            {/* Visual Cumulative Progress Meter */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Cumulative Factory Output Progress
                  </h4>
                  <p className="font-mono text-lg font-bold text-white mt-0.5">
                    {selectedOrder.producedQuantity} / {selectedOrder.quantity} Units Produced
                  </p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Graphical Bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((selectedOrder.producedQuantity / selectedOrder.quantity) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Start: {formatDate(selectedOrder.startDate)}</span>
                <span>
                  {Math.round((selectedOrder.producedQuantity / selectedOrder.quantity) * 100)}% Finished
                </span>
                <span>Deadline: {formatDate(selectedOrder.endDate)}</span>
              </div>
            </div>

            {/* Production Logs Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Production Batch Logs ({orderLogs.length})
                </h4>
                {selectedOrder.status !== 'COMPLETED' && (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => setIsAddLogOpen(true)}
                    leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                  >
                    Add Production Log
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-950/40 rounded-lg">
                    No production logs recorded yet for this order.
                  </p>
                ) : (
                  orderLogs.map((log) => (
                    <div
                      key={log.logId}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-bold">+{log.quantityProduced} Units</span>
                        <p className="text-slate-300 mt-0.5">{log.remarks}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Logged by: {log.operatorName || 'Shift Operator'}</span>
                      </div>
                      <div className="text-right font-mono text-[11px] text-slate-400">
                        {log.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Production Log Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isAddLogOpen}
          onClose={() => setIsAddLogOpen(false)}
          title={`Log Production Output: ${selectedOrder.productionOrderId}`}
          subtitle="PostgreSQL PRODUCTION_LOG table entry"
          maxWidth="md"
          icon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
        >
          <form onSubmit={handleAddLogSubmit} className="space-y-4">
            <Input
              label="Quantity Produced in Shift"
              type="number"
              min="1"
              value={logFormData.quantityProduced}
              onChange={(e) => setLogFormData({ ...logFormData, quantityProduced: e.target.value })}
              required
            />

            <Select
              label="Batch Quality Status"
              value={logFormData.status}
              onChange={(e) => setLogFormData({ ...logFormData, status: e.target.value as any })}
              options={[
                { label: 'NORMAL (Passed Optical & Tolerance QA)', value: 'NORMAL' },
                { label: 'DEFECTIVE (Quarantined)', value: 'DEFECTIVE' },
                { label: 'MAINTENANCE_STOP (Halted)', value: 'MAINTENANCE_STOP' },
              ]}
              required
            />

            <Input
              label="Operator Remarks"
              value={logFormData.remarks}
              onChange={(e) => setLogFormData({ ...logFormData, remarks: e.target.value })}
              placeholder="e.g. Afternoon shift run; tolerance testing within 0.002mm"
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsAddLogOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="emerald" type="submit" isLoading={isSubmitting}>
                Record Production Log
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
