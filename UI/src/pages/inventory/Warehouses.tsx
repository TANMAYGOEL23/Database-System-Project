import React, { useState, useEffect } from 'react';
import { Warehouse as IWarehouse, Shelf, InventoryItem } from '../../types/inventory';
import { Plus, Warehouse, Eye, MapPin, Grid3X3, Boxes, DollarSign } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { warehouseService } from '../../services/warehouseService';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedWh, setSelectedWh] = useState<IWarehouse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    warehouseName: '',
    location: '',
    capacity: '3000',
    numberOfShelves: '48',
    inventoryValue: '500000',
    status: 'ACTIVE' as IWarehouse['status'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [whs, shs, inv] = await Promise.all([
        warehouseService.getAllWarehouses(),
        warehouseService.getShelves(),
        inventoryService.getAll(),
      ]);
      setWarehouses(whs);
      setShelves(shs);
      setInventory(inv);
    } catch (e: any) {
      showToast('error', 'Error Loading Warehouses', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = (wh: IWarehouse) => {
    setSelectedWh(wh);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await warehouseService.createWarehouse({
        warehouseName: formData.warehouseName,
        location: formData.location,
        capacity: parseInt(formData.capacity, 10) || 1000,
        numberOfShelves: parseInt(formData.numberOfShelves, 10) || 20,
        inventoryValue: parseFloat(formData.inventoryValue) || 0,
        status: formData.status,
      });

      showToast('success', 'Warehouse Created', `${formData.warehouseName} has been configured.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<IWarehouse>[] = [
    {
      key: 'warehouseId',
      header: 'Warehouse ID',
      sortable: true,
      render: (w) => <span className="font-mono font-semibold text-blue-400">{w.warehouseId}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Facility Name',
      sortable: true,
      render: (w) => (
        <div>
          <div className="font-semibold text-slate-100">{w.warehouseName}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" /> {w.location}
          </div>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Occupancy & Capacity',
      sortable: true,
      render: (w) => {
        const occupancy = w.currentOccupancy || Math.round(w.capacity * 0.75);
        const pct = Math.round((occupancy / w.capacity) * 100);

        return (
          <div className="w-44">
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>{formatNumber(occupancy)} / {formatNumber(w.capacity)}</span>
              <span className="font-bold text-blue-400">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${pct > 85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'numberOfShelves',
      header: 'Shelves Grid',
      align: 'center',
      render: (w) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-300">
          <Grid3X3 className="w-3 h-3 text-cyan-400" /> {w.numberOfShelves} Bays
        </span>
      ),
    },
    {
      key: 'inventoryValue',
      header: 'Asset Valuation',
      sortable: true,
      align: 'right',
      render: (w) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCurrency(w.inventoryValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (w) => <StatusBadge status={w.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (w) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenDetail(w)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Warehouses & Storage Facilities</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pallet capacities, inventory valuations, automated storage retrieval systems (ASRS), and shelf zones.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Warehouse
        </Button>
      </div>

      <DataTable
        data={warehouses}
        columns={columns}
        rowKey={(w) => w.warehouseId}
        searchKey={(w) => `${w.warehouseId} ${w.warehouseName} ${w.location}`}
        searchPlaceholder="Search facilities..."
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Warehouse Facility"
        subtitle="PostgreSQL WAREHOUSE entity entry"
        maxWidth="md"
        icon={<Warehouse className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Warehouse Name"
            value={formData.warehouseName}
            onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
            placeholder="e.g. Automated High-Bay Annex Delta"
            required
          />

          <Input
            label="Physical Plant Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Zone D - East Logistics Ramp"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pallet Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
            <Input
              label="Number of Shelves"
              type="number"
              value={formData.numberOfShelves}
              onChange={(e) => setFormData({ ...formData, numberOfShelves: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Facility
            </Button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Detail Modal */}
      {selectedWh && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Facility Profile: ${selectedWh.warehouseName}`}
          subtitle={`ID: ${selectedWh.warehouseId} • Location: ${selectedWh.location}`}
          maxWidth="2xl"
          icon={<Warehouse className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-5">
            {/* KPI Chips */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400">Total Pallet Capacity</span>
                <p className="font-mono text-base font-bold text-white mt-0.5">{formatNumber(selectedWh.capacity)}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400">Allocated Shelves</span>
                <p className="font-mono text-base font-bold text-cyan-400 mt-0.5">{selectedWh.numberOfShelves} Shelves</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400">Stock Valuation</span>
                <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">{formatCurrency(selectedWh.inventoryValue)}</p>
              </div>
            </div>

            {/* Shelves List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Simulated RFID Shelves in this Facility
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                {shelves
                  .filter((s) => s.warehouseId === selectedWh.warehouseId)
                  .map((shf) => (
                    <div
                      key={shf.shelfId}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">Shelf {shf.shelfId} [Row {shf.row}, Col {shf.column}]</p>
                        <p className="font-mono text-[10px] text-cyan-400">{shf.rfidTag}</p>
                      </div>
                      <span className="font-mono text-xs text-slate-400">{shf.occupied || 0}/{shf.capacity || 100} units</span>
                    </div>
                  ))}
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
    </div>
  );
};
