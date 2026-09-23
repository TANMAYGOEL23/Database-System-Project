import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Building2, MapPin, Layers, RefreshCw } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await warehouseService.getAllWarehouses();
      setWarehouses(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Warehouses', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Warehouse>[] = [
    {
      key: 'warehouseId',
      header: 'Warehouse ID',
      sortable: true,
      render: (w) => <span className="font-mono text-xs font-semibold text-blue-400">{w.warehouseId}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Facility Name',
      sortable: true,
      render: (w) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-100">{w.warehouseName}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Facility Zone / Location',
      sortable: true,
      render: (w) => (
        <span className="text-slate-300 text-xs flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {w.location}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Storage Capacity',
      sortable: true,
      align: 'right',
      render: (w) => (
        <div className="text-right">
          <span className="font-mono text-xs text-slate-200">{w.currentOccupancy || 0} / {w.capacity} Units</span>
          <div className="w-24 bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                ((w.currentOccupancy || 0) / (w.capacity || 1)) > 0.85 ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.round(((w.currentOccupancy || 0) / (w.capacity || 1)) * 100))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'numberOfShelves',
      header: 'Shelving Racks',
      align: 'right',
      render: (w) => (
        <span className="font-mono text-xs text-slate-300 flex items-center justify-end gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          {w.numberOfShelves} Bays
        </span>
      ),
    },
    {
      key: 'inventoryValue',
      header: 'Asset Value Held',
      sortable: true,
      align: 'right',
      render: (w) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {formatCurrency(w.inventoryValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Operational Status',
      sortable: true,
      render: (w) => <StatusBadge status={w.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Warehouses & Storage Facilities</h2>
          <p className="text-xs text-slate-400 mt-1">
            Physical distribution centers, high-density racking bays, and localized material valuation.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Facilities
        </Button>
      </div>

      <DataTable
        data={warehouses}
        columns={columns}
        rowKey={(w) => w.warehouseId}
        searchKey={(w) => `${w.warehouseId} ${w.warehouseName} ${w.location} ${w.status}`}
        searchPlaceholder="Search facilities by name or building zone..."
        isLoading={isLoading}
      />
    </div>
  );
};
