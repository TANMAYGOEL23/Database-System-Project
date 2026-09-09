import React, { useState, useEffect } from 'react';
import { Shelf, Warehouse } from '../../types/inventory';
import { Plus, Grid3X3, Trash2, Tag, QrCode } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { warehouseService } from '../../services/warehouseService';

export const Shelves: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

  const [formData, setFormData] = useState({
    warehouseId: '',
    row: 'A',
    column: '01',
    rfidTag: 'RFID-WH1-A01',
    capacity: '100',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [shs, whs] = await Promise.all([
        warehouseService.getShelves(),
        warehouseService.getAllWarehouses(),
      ]);
      setShelves(shs);
      setWarehouses(whs);
      if (whs.length > 0 && !formData.warehouseId) {
        setFormData((prev) => ({ ...prev, warehouseId: whs[0].warehouseId }));
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Shelves', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wh = warehouses.find((w) => w.warehouseId === formData.warehouseId);
    if (!wh) return;

    try {
      setIsSubmitting(true);
      await warehouseService.createShelf({
        warehouseId: formData.warehouseId,
        warehouseName: wh.warehouseName,
        row: formData.row,
        column: formData.column,
        rfidTag: formData.rfidTag || `RFID-${wh.warehouseId}-${formData.row}${formData.column}`,
        capacity: parseInt(formData.capacity, 10) || 100,
        occupied: 0,
      });

      showToast('success', 'Shelf Registered', `Shelf [Row ${formData.row}, Col ${formData.column}] configured with RFID.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedShelf) return;
    try {
      setIsSubmitting(true);
      await warehouseService.deleteShelf(selectedShelf.shelfId);
      showToast('success', 'Shelf Removed', `Shelf ${selectedShelf.shelfId} deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Shelf>[] = [
    {
      key: 'shelfId',
      header: 'Shelf ID',
      sortable: true,
      render: (s) => <span className="font-mono font-semibold text-blue-400">{s.shelfId}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Assigned Warehouse',
      sortable: true,
      render: (s) => <span className="text-slate-200 font-medium">{s.warehouseName || s.warehouseId}</span>,
    },
    {
      key: 'row',
      header: 'Row Coordinate',
      align: 'center',
      render: (s) => <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Row {s.row}</span>,
    },
    {
      key: 'column',
      header: 'Column Bay',
      align: 'center',
      render: (s) => <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Col {s.column}</span>,
    },
    {
      key: 'rfidTag',
      header: 'Simulated RFID Tag UID',
      render: (s) => (
        <span className="font-mono text-xs text-cyan-400 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-cyan-500" />
          {s.rfidTag}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Bay Capacity',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-xs text-slate-300">
          {s.occupied || 0} / {s.capacity || 100} units
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <button
          onClick={() => {
            setSelectedShelf(s);
            setIsDeleteOpen(true);
          }}
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
          title="Delete Shelf"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'warehouseId',
      label: 'Warehouses',
      options: warehouses.map((w) => ({ label: w.warehouseName, value: w.warehouseId })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Warehouse Shelves & RFID Allocation</h2>
          <p className="text-xs text-slate-400 mt-1">
            2D Coordinate grids (Row, Column) and simulated RFID tag identifiers for automated AGV robot picking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Register Shelf
        </Button>
      </div>

      <DataTable
        data={shelves}
        columns={columns}
        rowKey={(s) => s.shelfId}
        searchKey={(s) => `${s.shelfId} ${s.warehouseName || ''} ${s.rfidTag} Row ${s.row} Col ${s.column}`}
        searchPlaceholder="Search shelves by ID, RFID, row/col..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create Shelf Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Shelf Bay"
        subtitle="Software-simulated RFID shelf coordinate entity"
        maxWidth="md"
        icon={<Grid3X3 className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Assigned Warehouse"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({
              label: `${w.warehouseName} (${w.warehouseId})`,
              value: w.warehouseId,
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Row Identifier"
              value={formData.row}
              onChange={(e) => setFormData({ ...formData, row: e.target.value })}
              placeholder="e.g. A, B, R1"
              required
            />
            <Input
              label="Column Bay Number"
              value={formData.column}
              onChange={(e) => setFormData({ ...formData, column: e.target.value })}
              placeholder="e.g. 01, 02, 12"
              required
            />
          </div>

          <Input
            label="Simulated RFID Tag Code"
            value={formData.rfidTag}
            onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
            placeholder="e.g. RFID-WH1-A01"
            helperText="Simulated RFID payload read by AMR/AGV scanners"
            required
          />

          <Input
            label="Unit Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Register Shelf
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shelf Location"
        message={`Delete shelf ${selectedShelf?.shelfId} [Row ${selectedShelf?.row}, Col ${selectedShelf?.column}]?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
