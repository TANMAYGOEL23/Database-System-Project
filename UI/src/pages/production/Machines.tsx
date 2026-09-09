import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, Thermometer, ShieldCheck, RefreshCw, Power } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { Machine, MachineStatus } from '../../types/production';
import { formatDate } from '../../utils/formatters';

export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await productionService.getMachines();
      setMachines(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Machinery', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (machine: Machine, newStatus: MachineStatus) => {
    try {
      await productionService.updateMachineStatus(machine.machineId, newStatus);
      showToast('success', 'Machinery Status Updated', `${machine.machineName} set to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const columns: Column<Machine>[] = [
    {
      key: 'machineId',
      header: 'Machine ID',
      sortable: true,
      render: (m) => <span className="font-mono font-semibold text-blue-400">{m.machineId}</span>,
    },
    {
      key: 'machineName',
      header: 'Industrial Machine & Model',
      sortable: true,
      render: (m) => (
        <div>
          <div className="font-semibold text-slate-100">{m.machineName}</div>
          <div className="text-[11px] font-mono text-slate-400">{m.model} • {m.location}</div>
        </div>
      ),
    },
    {
      key: 'efficiency',
      header: 'Operating OEE',
      sortable: true,
      align: 'right',
      render: (m) => (
        <span className="font-mono font-bold text-xs text-cyan-400">
          {m.efficiency.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'temperature',
      header: 'Core Temperature',
      align: 'right',
      render: (m) => (
        <span className={`font-mono text-xs ${m.temperature > 50 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
          {m.temperature.toFixed(1)}°C
        </span>
      ),
    },
    {
      key: 'powerUsage',
      header: 'Power Draw',
      align: 'right',
      render: (m) => (
        <span className="font-mono text-xs text-slate-300">
          {m.powerUsage.toFixed(1)} kW
        </span>
      ),
    },
    {
      key: 'lastMaintenance',
      header: 'Last Serviced',
      render: (m) => <span className="text-xs text-slate-400">{formatDate(m.lastMaintenance)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: 'actions',
      header: 'Control',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          {m.status === 'RUNNING' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleToggleStatus(m, 'IDLE')}
              className="text-xs"
            >
              Set Idle
            </Button>
          ) : (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleToggleStatus(m, 'RUNNING')}
              className="text-xs"
            >
              Start Cell
            </Button>
          )}
          {m.status !== 'MAINTENANCE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStatus(m, 'MAINTENANCE')}
              className="text-xs"
            >
              Service
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Machine Status',
      options: [
        { label: 'Running', value: 'RUNNING' },
        { label: 'Idle', value: 'IDLE' },
        { label: 'Maintenance', value: 'MAINTENANCE' },
        { label: 'Error Alarms', value: 'ERROR' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Heavy Machinery & Robotic Cells</h2>
          <p className="text-xs text-slate-400 mt-1">
            CNC lathes, SMD pick-and-place lines, 500T hydraulic presses, and fiber laser welding cells.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      <DataTable
        data={machines}
        columns={columns}
        rowKey={(m) => m.machineId}
        searchKey={(m) => `${m.machineId} ${m.machineName} ${m.model} ${m.location}`}
        searchPlaceholder="Search machine by model, cell, location..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
