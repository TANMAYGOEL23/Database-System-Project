import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CheckCircle, Clock, Truck, FileText, ChevronRight } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { PurchaseOrder, Supplier, Product, PurchaseOrderStatus } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line Item selector
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState('10');

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pos, sups, prods] = await Promise.all([
        purchaseOrderService.getAll(),
        supplierService.getAll(),
        productService.getAll(),
      ]);
      setOrders(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !selectedSupplierId) setSelectedSupplierId(sups[0].supplierId);
      if (prods.length > 0 && !selectedProdId) setSelectedProdId(prods[0].productId);
    } catch (e: any) {
      showToast('error', 'Failed to load PO records', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    const prod = products.find((p) => p.productId === selectedProdId);
    if (!prod) return;
    const qty = parseInt(itemQty, 10) || 1;
    const cost = prod.costPrice || 100;
    const subtotal = qty * cost;

    setItems([...items, {
      productId: prod.productId,
      productName: prod.productName,
      quantity: qty,
      unitPrice: cost,
      subtotal,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setItems([]);
    setNotes('');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setExpectedDate(d.toISOString().split('T')[0]);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('error', 'Items Required', 'Please add at least one line item to the PO.');
      return;
    }

    const sup = suppliers.find((s) => s.supplierId === selectedSupplierId);
    if (!sup) return;

    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      await purchaseOrderService.create({
        supplierId: sup.supplierId,
        supplierName: sup.supplierName,
        orderDate: today,
        expectedDeliveryDate: expectedDate,
        status: 'PENDING',
        items,
        notes,
      });

      showToast('success', 'Purchase Order Created', `Dispatched PO to ${sup.supplierName}.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'PO Creation Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (poId: string, nextStatus: PurchaseOrderStatus) => {
    try {
      setIsSubmitting(true);
      await purchaseOrderService.updateStatus(poId, nextStatus);
      showToast('success', 'PO Status Updated', `PO marked as ${nextStatus}. Inventory adjusted automatically.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Status Update Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poId',
      header: 'PO Number',
      sortable: true,
      render: (p) => <span className="font-mono text-xs font-semibold text-blue-400">{p.poId}</span>,
    },
    {
      key: 'supplierName',
      header: 'Vendor Supplier',
      sortable: true,
      render: (p) => (
        <span className="font-semibold text-slate-100 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          {p.supplierName}
        </span>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order / Due Date',
      sortable: true,
      render: (p) => (
        <div className="font-mono text-xs text-slate-300">
          <div>Ordered: {formatDate(p.orderDate)}</div>
          <div className="text-[11px] text-slate-400">Due: {p.expectedDeliveryDate ? formatDate(p.expectedDeliveryDate) : 'TBD'}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Line Items Summary',
      render: (p) => (
        <div className="text-xs text-slate-300">
          <span className="font-semibold">{p.items.length} Product SKUs</span>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            {p.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total PO Value (₹)',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          {formatCurrency(p.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: 'Lifecycle Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.status === 'PENDING' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange(p.poId, 'APPROVED')}
            >
              Approve
            </Button>
          )}
          {p.status === 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(p.poId, 'RECEIVED')}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Receive Goods
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Fulfillment Status',
      options: [
        { label: 'Pending Approval', value: 'PENDING' },
        { label: 'Approved / In-Transit', value: 'APPROVED' },
        { label: 'Received at Dock', value: 'RECEIVED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Procurement Orders & Goods Receipts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Supplier purchase requisitions, automated inbound stock sync, and invoice generation pipelines.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Purchase Order
        </Button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        rowKey={(p) => p.poId}
        searchKey={(p) => `${p.poId} ${p.supplierName} ${p.status}`}
        searchPlaceholder="Search POs by reference number or supplier..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* PO Creation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue Purchase Order Requisition"
        subtitle="PURCHASE_ORDER relational order & items generation"
        maxWidth="lg"
        icon={<ShoppingCart className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Vendor / Supplier"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              options={suppliers.map((s) => ({ label: `${s.supplierName} (${s.supplierId})`, value: s.supplierId }))}
              required
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              required
            />
          </div>

          {/* Line Item Adder */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Add Line Items</h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <Select
                  label="Product SKU"
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  options={products.map((p) => ({ label: `${p.productName} [${formatCurrency(p.costPrice)}]`, value: p.productId }))}
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={handleAddItem} className="w-full">
                  Add
                </Button>
              </div>
            </div>

            {/* Item List */}
            {items.length > 0 && (
              <div className="mt-3 border-t border-slate-800 pt-3 space-y-2 max-h-40 overflow-y-auto">
                {items.map((itm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/40 p-2 rounded">
                    <div>
                      <span className="font-semibold text-white">{itm.productName}</span>
                      <span className="text-slate-400 ml-2 font-mono">Qty: {itm.quantity} × {formatCurrency(itm.unitPrice)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(itm.subtotal)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Internal Notes / Shipping Instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Standard Freight, Gate 3 Delivery Dock"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
