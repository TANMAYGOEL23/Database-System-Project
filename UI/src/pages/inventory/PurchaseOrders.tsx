import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Eye,
  PackageCheck,
  X,
} from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product, PurchaseOrderStatus } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pos, sups, prods] = await Promise.all([
        purchaseOrderService.getAll(),
        supplierService.getAll(),
        productService.getAll(),
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(sups[0].supplierId);
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Purchase Orders', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedSupplierId(suppliers[0]?.supplierId || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setNotes('');
    if (products.length > 0) {
      setItems([
        {
          productId: products[0].productId,
          productName: products[0].productName,
          quantity: 20,
          unitPrice: products[0].costPrice,
          subtotal: 20 * products[0].costPrice,
          tax: 20 * products[0].costPrice * 0.18,
        },
      ]);
    } else {
      setItems([]);
    }
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const defaultPrd = products[0];
    setItems([
      ...items,
      {
        productId: defaultPrd.productId,
        productName: defaultPrd.productName,
        quantity: 10,
        unitPrice: defaultPrd.costPrice,
        subtotal: 10 * defaultPrd.costPrice,
        tax: 10 * defaultPrd.costPrice * 0.18,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'unitPrice', value: any) => {
    const updated = [...items];
    const targetItem = { ...updated[index] };

    if (field === 'productId') {
      const prd = products.find((p) => p.productId === value);
      targetItem.productId = value;
      targetItem.productName = prd ? prd.productName : value;
      targetItem.unitPrice = prd ? prd.costPrice : targetItem.unitPrice;
    } else if (field === 'quantity') {
      targetItem.quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === 'unitPrice') {
      targetItem.unitPrice = Math.max(0, parseFloat(value) || 0);
    }

    targetItem.subtotal = targetItem.quantity * targetItem.unitPrice;
    targetItem.tax = targetItem.subtotal * 0.18;
    updated[index] = targetItem;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.18;
  const totalAmount = subtotal + tax;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('error', 'Validation Error', 'Purchase order must have at least one product item');
      return;
    }

    const sup = suppliers.find((s) => s.supplierId === selectedSupplierId);
    if (!sup) return;

    try {
      setIsSubmitting(true);
      const newPO = await purchaseOrderService.create({
        supplierId: sup.supplierId,
        supplierName: sup.supplierName,
        orderDate,
        expectedDeliveryDate: expectedDate,
        status: 'PENDING',
        items,
        notes,
      });

      showToast(
        'success',
        'Purchase Order Issued',
        `PO ${newPO.poId} created for ${sup.supplierName} (Total: ${formatCurrency(newPO.totalAmount)}).`
      );
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'PO Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (poId: string, newStatus: PurchaseOrderStatus) => {
    try {
      const updated = await purchaseOrderService.updateStatus(poId, newStatus);
      if (newStatus === 'RECEIVED') {
        showToast(
          'success',
          'Goods Inward Received & Stock Updated',
          `PO ${poId} marked as RECEIVED. Inventory stock balances increased and stock transaction audit recorded!`
        );
      } else {
        showToast('info', 'Status Updated', `PO ${poId} status set to ${newStatus}`);
      }
      loadData();
      if (selectedPO && selectedPO.poId === poId) {
        setSelectedPO(updated);
      }
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.message);
    }
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poId',
      header: 'PO ID',
      sortable: true,
      render: (po) => <span className="font-mono font-semibold text-blue-400">{po.poId}</span>,
    },
    {
      key: 'supplierName',
      header: 'Supplier Vendor',
      sortable: true,
      render: (po) => (
        <div>
          <div className="font-semibold text-slate-100">{po.supplierName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{po.supplierId}</div>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      sortable: true,
      render: (po) => <span className="font-mono text-xs text-slate-300">{formatDate(po.orderDate)}</span>,
    },
    {
      key: 'itemsCount',
      header: 'Line Items',
      align: 'center',
      render: (po) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {po.items.length} Products
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount ($)',
      sortable: true,
      align: 'right',
      render: (po) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {formatCurrency(po.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (po) => <StatusBadge status={po.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (po) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedPO(po);
              setIsDetailOpen(true);
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            View Details
          </Button>

          {po.status === 'APPROVED' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleStatusChange(po.poId, 'RECEIVED')}
              leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
            >
              Receive Goods
            </Button>
          )}

          {po.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(po.poId, 'APPROVED')}
            >
              Approve PO
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'PO Status',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Received', value: 'RECEIVED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Procurement & Purchase Orders</h2>
          <p className="text-xs text-slate-400 mt-1">
            Vendor supply contracts, line-item pricing, GST computation, and automatic stock reception ledger sync.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Purchase Order
        </Button>
      </div>

      <DataTable
        data={purchaseOrders}
        columns={columns}
        rowKey={(po) => po.poId}
        searchKey={(po) => `${po.poId} ${po.supplierName} ${po.supplierId}`}
        searchPlaceholder="Search purchase orders..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Multi-Item Purchase Order Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue Multi-Item Purchase Order"
        subtitle="PostgreSQL PURCHASE_ORDER & PURCHASE_ORDER_ITEM relational schema"
        maxWidth="3xl"
        icon={<FileSpreadsheet className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Selected Supplier"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              options={suppliers.map((s) => ({
                label: `${s.supplierName} (${s.supplierId})`,
                value: s.supplierId,
              }))}
              required
            />
            <Input
              label="Order Date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
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

          {/* Dynamic Product Line Items Section */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Order Items & Quantity ({items.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddItemRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Product Line
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.productName} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 text-right">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Line Total</label>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Tax Calculation Panel */}
            <div className="border-t border-slate-800 pt-3 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-60 text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-60 text-slate-400">
                <span>Tax (18% Standard GST):</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between w-60 text-sm font-bold text-white pt-1 border-t border-slate-800">
                <span>Total PO Amount:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Input
            label="Internal Notes / Shipping Instructions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Deliver to Warehouse Beta Bay 1"
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

      {/* PO Detail Modal */}
      {selectedPO && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Purchase Order: ${selectedPO.poId}`}
          subtitle={`Supplier: ${selectedPO.supplierName} • Date: ${formatDate(selectedPO.orderDate)}`}
          maxWidth="2xl"
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">{selectedPO.supplierName}</h4>
                <p className="text-xs text-slate-400 font-mono">Expected: {formatDate(selectedPO.expectedDeliveryDate)}</p>
              </div>
              <StatusBadge status={selectedPO.status} />
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-850 text-slate-400 font-semibold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedPO.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-200">{item.productName}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-100">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Amount:</span>
                <span className="font-mono">{formatCurrency(selectedPO.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="font-mono">{formatCurrency(selectedPO.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-slate-800">
                <span>Total PO Value:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(selectedPO.totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {selectedPO.status === 'APPROVED' && (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => handleStatusChange(selectedPO.poId, 'RECEIVED')}
                    leftIcon={<PackageCheck className="w-4 h-4" />}
                  >
                    Receive Shipment & Update Stock
                  </Button>
                )}
                {selectedPO.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(selectedPO.poId, 'APPROVED')}
                  >
                    Approve PO
                  </Button>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
