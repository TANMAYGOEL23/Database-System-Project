import React, { useState, useEffect } from 'react';
import { Layers, QrCode, Building2, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { warehouseService } from '../../services/warehouseService';
import { Shelf } from '../../types/inventory';

export const Shelves: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await warehouseService.getAllShelves();
      setShelves(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Shelves', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Shelf>[] = [
    {
      key: 'shelfId',
      header: 'Shelf Code',
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold text-blue-400">{s.shelfId}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Warehouse Facility',
      sortable: true,
      render: (s) => (
        <span className="text-slate-200 text-xs font-medium flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          {s.warehouseName || s.warehouseId}
        </span>
      ),
    },
    {
      key: 'row',
      header: 'Bay Coordinate (Row × Col)',
      render: (s) => (
        <span className="font-mono text-xs text-slate-300">
          Row {s.row} • Col {s.column}
        </span>
      ),
    },
    {
      key: 'rfidTag',
      header: 'RFID Tag UID',
      render: (s) => (
        <span className="font-mono text-xs text-indigo-400 flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5 text-indigo-400/70" />
          {s.rfidTag}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Slot Occupancy',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-xs text-slate-300">
          {s.occupied || 0} / {s.capacity || 50} Units
        </span>
      ),
    },
  ];

  const warehouses = Array.from(new Set(shelves.map((s) => s.warehouseName || s.warehouseId).filter(Boolean)));

  const filters: FilterConfig[] = [
    {
      key: 'warehouseName',
      label: 'Warehouse',
      options: warehouses.map((w) => ({ label: w, value: w })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">RFID Shelving Grid & Bin Locations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Coordinate map of automated storage aisles, RFID transponders, and slot occupancy levels.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Grid
        </Button>
      </div>

      <DataTable
        data={shelves}
        columns={columns}
        rowKey={(s) => s.shelfId}
        searchKey={(s) => `${s.shelfId} ${s.warehouseName} ${s.warehouseId} ${s.rfidTag} ${s.row} ${s.column}`}
        searchPlaceholder="Filter shelves by rack code or RFID UID..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
