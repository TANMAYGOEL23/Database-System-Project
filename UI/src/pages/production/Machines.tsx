import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, Thermometer, AlertOctagon, Play, Pause, Wrench, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { productionService } from '../../services/productionService';
import { Machine, MachineStatus } from '../../types/production';
import { formatDate } from '../../utils/formatters';

export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await productionService.getMachines();
      setMachines(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Machines', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (machineId: string, status: MachineStatus) => {
    try {
      setIsUpdating(true);
      await productionService.updateMachineStatus(machineId, status);
      showToast('success', 'Machine State Changed', `Machine ${machineId} transitioned to ${status}.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Update Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<Machine>[] = [
    {
      key: 'machineId',
      header: 'Machine Code',
      sortable: true,
      render: (m) => <span className="font-mono text-xs font-semibold text-blue-400">{m.machineId}</span>,
    },
    {
      key: 'machineName',
      header: 'Equipment Name & Model',
      sortable: true,
      render: (m) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            {m.machineName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">{m.model} • {m.location}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Telemetry State',
      sortable: true,
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: 'efficiency',
      header: 'OEE Efficiency',
      sortable: true,
      align: 'right',
      render: (m) => (
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-emerald-400">{m.efficiency}%</span>
          <div className="w-20 bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${m.efficiency > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${m.efficiency}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'temperature',
      header: 'Temp & Power',
      align: 'right',
      render: (m) => (
        <div className="text-right font-mono text-xs space-y-0.5">
          <div className="flex items-center justify-end gap-1 text-slate-300">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>{m.temperature}°C</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-slate-400 text-[11px]">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>{m.powerUsage} kW</span>
          </div>
        </div>
      ),
    },
    {
      key: 'lastMaintenance',
      header: 'Last Service Date',
      sortable: true,
      render: (m) => <span className="font-mono text-xs text-slate-400">{formatDate(m.lastMaintenance)}</span>,
    },
    {
      key: 'actions',
      header: 'Floor Controls',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          {m.status !== 'RUNNING' && (
            <button
              onClick={() => handleStatusChange(m.machineId, 'RUNNING')}
              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors"
              title="Start Production Line"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {m.status === 'RUNNING' && (
            <button
              onClick={() => handleStatusChange(m.machineId, 'IDLE')}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 transition-colors"
              title="Pause / Idle"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleStatusChange(m.machineId, m.status === 'MAINTENANCE' ? 'IDLE' : 'MAINTENANCE')}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition-colors"
            title="Toggle Maintenance Lock"
          >
            <Wrench className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStatusChange(m.machineId, 'ERROR')}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Trigger E-Stop / Fault"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Operation State',
      options: [
        { label: 'Running', value: 'RUNNING' },
        { label: 'Idle / Standby', value: 'IDLE' },
        { label: 'Under Maintenance', value: 'MAINTENANCE' },
        { label: 'Fault / Error', value: 'ERROR' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Machinery & CNC Workcells</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Overall Equipment Effectiveness (OEE), telemetry load, and remote workcell actuators.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Telemetry
        </Button>
      </div>

      <DataTable
        data={machines}
        columns={columns}
        rowKey={(m) => m.machineId}
        searchKey={(m) => `${m.machineId} ${m.machineName} ${m.model} ${m.location} ${m.status}`}
        searchPlaceholder="Filter machinery by code, model, or factory zone..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
