import React, { useState, useEffect } from 'react';
import { Bot, BatteryCharging, Battery, BatteryWarning, Navigation, RefreshCw, Play, CheckCircle2 } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { SimulateRobotTaskModal } from '../../components/simulation/SimulateRobotTaskModal';
import { useNotification } from '../../context/NotificationContext';
import { robotService } from '../../services/robotService';
import { Robot, RobotStatus } from '../../types/warehouse';

export const Robots: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await robotService.getRobots();
      setRobots(data);
    } catch (e: any) {
      showToast('error', 'Failed to load AMR fleet', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusToggle = async (robotId: string, currentStatus: RobotStatus) => {
    try {
      const nextStatus: RobotStatus = currentStatus === 'CHARGING' ? 'IDLE' : 'CHARGING';
      await robotService.updateRobotStatus(robotId, nextStatus, nextStatus === 'CHARGING' ? 100 : undefined);
      showToast('success', 'Robot Updated', `${robotId} switched to ${nextStatus}.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Update Failed', e.message);
    }
  };

  const columns: Column<Robot>[] = [
    {
      key: 'robotId',
      header: 'AMR Fleet ID',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold text-blue-400">{r.robotId}</span>,
    },
    {
      key: 'robotName',
      header: 'Robot Name & Chassis',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            {r.robotName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">Model: {r.model}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Fleet Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'battery',
      header: 'Battery Level',
      sortable: true,
      align: 'right',
      render: (r) => {
        const isLow = r.battery < 25;
        return (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
              {r.status === 'CHARGING' ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : isLow ? (
                <BatteryWarning className="w-4 h-4 text-rose-400" />
              ) : (
                <Battery className="w-4 h-4 text-slate-300" />
              )}
              <span className={isLow ? 'text-rose-400 font-bold' : 'text-slate-200'}>{r.battery}%</span>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isLow ? 'bg-rose-500' : r.battery > 60 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${r.battery}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'currentLocation',
      header: 'Current Waypoint',
      render: (r) => (
        <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
          <Navigation className="w-3 h-3 text-slate-400" />
          {r.currentLocation}
        </span>
      ),
    },
    {
      key: 'payloadCapacityKg',
      header: 'Max Payload',
      align: 'right',
      render: (r) => <span className="font-mono text-xs text-slate-300">{r.payloadCapacityKg} kg</span>,
    },
    {
      key: 'totalTasksCompleted',
      header: 'Missions Completed',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {r.totalTasksCompleted}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Controls',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStatusToggle(r.robotId, r.status)}
            leftIcon={r.status === 'CHARGING' ? <Play className="w-3 h-3" /> : <BatteryCharging className="w-3 h-3" />}
          >
            {r.status === 'CHARGING' ? 'Deploy' : 'Dock & Charge'}
          </Button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Fleet Status',
      options: [
        { label: 'Idle / Ready', value: 'IDLE' },
        { label: 'Busy on Mission', value: 'BUSY' },
        { label: 'Docked & Charging', value: 'CHARGING' },
        { label: 'Under Maintenance', value: 'MAINTENANCE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Autonomous Mobile Robots (AMR Fleet)</h2>
          <p className="text-xs text-slate-400 mt-1">
            LiDAR navigation telemetry, payload capacity, battery health, and autonomous dispatch controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Fleet
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsSimModalOpen(true)}
            leftIcon={<Bot className="w-4 h-4" />}
          >
            Simulate AMR Mission
          </Button>
        </div>
      </div>

      <DataTable
        data={robots}
        columns={columns}
        rowKey={(r) => r.robotId}
        searchKey={(r) => `${r.robotId} ${r.robotName} ${r.model} ${r.currentLocation}`}
        searchPlaceholder="Search robots by chassis ID or model..."
        filters={filters}
        isLoading={isLoading}
      />

      <SimulateRobotTaskModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
