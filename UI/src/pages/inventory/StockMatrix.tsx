import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, ArrowUpDown, SlidersHorizontal, Warehouse, Plus, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { inventoryService } from '../../services/inventoryService';
import { warehouseService } from '../../services/warehouseService';
import { InventoryItem, Warehouse as IWarehouse } from '../../types/inventory';
import { useNavigate } from 'react-router-dom';

export const StockMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stock Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState('10');
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'PURCHASE' | 'PRODUCTION'>('ADJUSTMENT');
  const [adjustReason, setAdjustReason] = useState('Routine physical inventory cycle count');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [inv, whs] = await Promise.all([
        inventoryService.getAll(),
        warehouseService.getAllWarehouses(),
      ]);
      setInventory(inv);
      setWarehouses(whs);
    } catch (e: any) {
      showToast('error', 'Error Loading Inventory', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = inventory.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK');

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentQty('10');
    setAdjustType('ADJUSTMENT');
    setAdjustReason('Physical audit discrepancy adjustment');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const delta = parseInt(adjustmentQty, 10);
    if (isNaN(delta) || delta === 0) {
      showToast('error', 'Validation Error', 'Delta quantity must be non-zero');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.updateStock(
        selectedItem.inventoryId,
        delta,
        adjustType,
        `ADJ-${Date.now().toString().slice(-4)}`,
        adjustReason
      );

      showToast(
        'success',
        'Stock Level Updated',
        `Adjusted ${selectedItem.productName} by ${delta > 0 ? '+' : ''}${delta} ${selectedItem.unit}. Logged in Stock Transactions.`
      );
      setIsAdjustOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Stock Adjustment Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'productName',
      header: 'Product Name',
      sortable: true,
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-100">{i.productName}</div>
          <div className="text-[11px] font-mono text-blue-400">{i.productId} • {i.category}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse & Shelf',
      sortable: true,
      render: (i) => (
        <div>
          <span className="text-slate-200 text-xs font-medium">{i.warehouseName}</span>
          <div className="text-[11px] font-mono text-slate-400">Shelf: {i.shelfId || 'Bay General'}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Stock On Hand',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className={`font-mono font-bold text-sm ${
          i.stockStatus === 'OUT_OF_STOCK'
            ? 'text-rose-400'
            : i.stockStatus === 'LOW_STOCK'
            ? 'text-amber-400'
            : 'text-emerald-400'
        }`}>
          {i.quantity} {i.unit}
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Min Safety Buffer',
      align: 'right',
      render: (i) => <span className="font-mono text-xs text-slate-400">{i.minStock} {i.unit}</span>,
    },
    {
      key: 'maxStock',
      header: 'Max Capacity',
      align: 'right',
      render: (i) => <span className="font-mono text-xs text-slate-400">{i.maxStock} {i.unit}</span>,
    },
    {
      key: 'stockStatus',
      header: 'Status',
      sortable: true,
      render: (i) => <StatusBadge status={i.stockStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenAdjust(i)}
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />}
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'warehouseId',
      label: 'Warehouses',
      options: warehouses.map((w) => ({ label: w.warehouseName, value: w.warehouseId })),
    },
    {
      key: 'stockStatus',
      label: 'Stock Status',
      options: [
        { label: 'In Stock', value: 'IN_STOCK' },
        { label: 'Low Stock', value: 'LOW_STOCK' },
        { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Inventory Matrix</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time physical stock levels across warehouses, shelf allocations, and safety buffers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/transactions')}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Audit Log
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/inventory/purchase-orders')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Prominent Low Stock Warning Section */}
      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Critical Low Stock & Out-of-Stock Notice ({lowStockItems.length} Products)
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventory/purchase-orders')}
              className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-900/40"
            >
              Reorder from Suppliers
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {lowStockItems.map((item) => (
              <div
                key={item.inventoryId}
                className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{item.productName}</h4>
                  <p className="text-[11px] text-slate-400">📍 {item.warehouseName}</p>
                  <p className="text-[11px] font-mono text-amber-400 mt-0.5">
                    Remaining: <strong>{item.quantity} {item.unit}</strong> (Min: {item.minStock})
                  </p>
                </div>
                <StatusBadge status={item.stockStatus} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Matrix Table */}
      <DataTable
        data={inventory}
        columns={columns}
        rowKey={(i) => i.inventoryId}
        searchKey={(i) => `${i.productName} ${i.productId} ${i.warehouseName} ${i.category}`}
        searchPlaceholder="Search inventory by product, SKU, warehouse..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <Modal
          isOpen={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          title={`Adjust Inventory Level: ${selectedItem.productName}`}
          subtitle={`Location: ${selectedItem.warehouseName} • Current Stock: ${selectedItem.quantity} ${selectedItem.unit}`}
          maxWidth="md"
          icon={<SlidersHorizontal className="w-5 h-5 text-blue-400" />}
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-mono font-bold text-slate-100 text-sm">{selectedItem.quantity} {selectedItem.unit}</span>
            </div>

            <Select
              label="Transaction Type"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              options={[
                { label: 'ADJUSTMENT (Audit / Cycle Count Correction)', value: 'ADJUSTMENT' },
                { label: 'PURCHASE (Direct Inward Stock Receipt)', value: 'PURCHASE' },
                { label: 'PRODUCTION (Plant Manufacturing Inward)', value: 'PRODUCTION' },
              ]}
              required
            />

            <Input
              label={`Delta Adjustment Quantity (+ / - ${selectedItem.unit})`}
              type="number"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(e.target.value)}
              placeholder="e.g. +20 or -5"
              helperText="Positive value adds stock; negative value deducts stock."
              required
            />

            <Input
              label="Audit Justification / Reference Memo"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Physical count verified by QA Inspector"
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsAdjustOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Apply & Record Transaction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
