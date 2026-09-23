import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, CheckCircle, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem } from '../../types/inventory';

export const StockMatrix: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('0');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Physical count reconciliation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getAll();
      setInventory(data);
    } catch (e: any) {
      showToast('error', 'Failed to fetch inventory', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity(String(item.quantity));
    setAdjustmentReason('Physical audit adjustment');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      showToast('error', 'Invalid Quantity', 'Please enter a valid non-negative integer quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.adjustStock(selectedItem.inventoryId, qty, adjustmentReason);
      showToast('success', 'Stock Adjusted', `Reconciled ${selectedItem.productName} to ${qty} ${selectedItem.unit}.`);
      setIsAdjustOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Adjustment Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'inventoryId',
      header: 'Inventory ID',
      sortable: true,
      render: (i) => <span className="font-mono text-xs font-semibold text-blue-400">{i.inventoryId}</span>,
    },
    {
      key: 'productName',
      header: 'Product / SKU',
      sortable: true,
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-100">{i.productName}</div>
          <div className="text-[11px] font-mono text-slate-400">{i.productId} • {i.category}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse & Shelf',
      sortable: true,
      render: (i) => (
        <span className="font-mono text-xs text-slate-300">
          {i.warehouseName} {i.shelfId ? `[Shelf ${i.shelfId}]` : ''}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Current Stock',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className="font-mono font-bold text-sm text-white">
          {i.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{i.unit}</span>
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Min / Max Thresholds',
      align: 'right',
      render: (i) => (
        <span className="font-mono text-xs text-slate-400">
          Min: <span className="text-amber-400">{i.minStock}</span> | Max: <span className="text-slate-300">{i.maxStock}</span>
        </span>
      ),
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
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
        >
          Reconcile
        </Button>
      ),
    },
  ];

  const categories = Array.from(new Set(inventory.map((i) => i.category).filter(Boolean)));
  const warehouses = Array.from(new Set(inventory.map((i) => i.warehouseName).filter(Boolean)));

  const filters: FilterConfig[] = [
    {
      key: 'stockStatus',
      label: 'Stock Health',
      options: [
        { label: 'In Stock', value: 'IN_STOCK' },
        { label: 'Low Stock Alert', value: 'LOW_STOCK' },
        { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
      ],
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      options: warehouses.map((w) => ({ label: w, value: w })),
    },
    {
      key: 'category',
      label: 'Category',
      options: categories.map((c) => ({ label: c, value: c })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Stock Level Matrix & Warehouse Allocations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time material distribution across factory zones with min-max reorder threshold triggers.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Live Data
        </Button>
      </div>

      <DataTable
        data={inventory}
        columns={columns}
        rowKey={(i) => i.inventoryId}
        searchKey={(i) => `${i.inventoryId} ${i.productName} ${i.productId} ${i.warehouseName} ${i.category}`}
        searchPlaceholder="Filter matrix by item, SKU, category, or location..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Reconcile Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Reconcile Physical Inventory"
        subtitle={`Adjust inventory level for ${selectedItem?.productName}`}
        maxWidth="md"
        icon={<SlidersHorizontal className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Warehouse:</span>
              <span className="font-mono text-slate-200">{selectedItem?.warehouseName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current System Level:</span>
              <span className="font-mono font-bold text-amber-400">{selectedItem?.quantity} {selectedItem?.unit}</span>
            </div>
          </div>

          <Input
            label="Verified Physical Quantity"
            type="number"
            min="0"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            required
          />

          <Input
            label="Reason / Audit Reference"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="e.g. End of Month physical cycle count"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsAdjustOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Apply & Log Audit Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
