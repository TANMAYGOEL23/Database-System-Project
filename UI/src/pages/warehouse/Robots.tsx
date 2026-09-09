import React, { useState, useEffect } from 'react';
import { Bot, BatteryCharging, BatteryMedium, MapPin, Activity, Play, Wrench, RefreshCw, Zap } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { robotService } from '../../services/robotService';
import { Robot, RobotStatus } from '../../types/warehouse';
import { SimulateRobotTaskModal } from '../../components/simulation/SimulateRobotTaskModal';

export const Robots: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await robotService.getRobots();
      setRobots(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Robots', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (robot: Robot, newStatus: RobotStatus) => {
    try {
      await robotService.updateRobotStatus(
        robot.robotId,
        newStatus,
        newStatus === 'CHARGING' ? 100 : robot.battery
      );
      showToast('success', 'Robot State Updated', `${robot.robotName} status set to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast('error', 'State Update Failed', err.message);
    }
  };

  const columns: Column<Robot>[] = [
    {
      key: 'robotId',
      header: 'Robot ID',
      sortable: true,
      render: (r) => <span className="font-mono font-semibold text-indigo-400">{r.robotId}</span>,
    },
    {
      key: 'robotName',
      header: 'Fleet Unit & Model',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-400" />
            {r.robotName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">{r.model}</div>
        </div>
      ),
    },
    {
      key: 'battery',
      header: 'Battery SoC',
      sortable: true,
      render: (r) => (
        <div className="w-32">
          <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              {r.status === 'CHARGING' ? (
                <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <BatteryMedium className="w-3.5 h-3.5 text-slate-400" />
              )}
              {r.battery}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                r.battery > 50 ? 'bg-emerald-500' : r.battery > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${r.battery}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'currentLocation',
      header: 'Current Waypoint',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{r.currentLocation}</span>
        </div>
      ),
    },
    {
      key: 'totalTasksCompleted',
      header: 'Completed Missions',
      sortable: true,
      align: 'right',
      render: (r) => <span className="font-mono font-bold text-slate-200">{r.totalTasksCompleted}</span>,
    },
    {
      key: 'status',
      header: 'Fleet Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Command',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status !== 'CHARGING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(r, 'CHARGING')}
              leftIcon={<Zap className="w-3 h-3 text-cyan-400" />}
              className="text-xs"
            >
              Dock & Charge
            </Button>
          )}
          {r.status === 'CHARGING' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleUpdateStatus(r, 'IDLE')}
              className="text-xs"
            >
              Undock / Ready
            </Button>
          )}
          {r.status !== 'MAINTENANCE' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUpdateStatus(r, 'MAINTENANCE')}
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
      label: 'Fleet Status',
      options: [
        { label: 'Idle / Available', value: 'IDLE' },
        { label: 'Busy on Mission', value: 'BUSY' },
        { label: 'Charging at Dock', value: 'CHARGING' },
        { label: 'In Maintenance', value: 'MAINTENANCE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Autonomous Mobile Robot (AMR / AGV) Fleet</h2>
          <p className="text-xs text-slate-400 mt-1">
            Software-simulated automated guided vehicles for warehouse shelf pallet transfers and CNC material delivery.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsTaskModalOpen(true)}
          leftIcon={<Bot className="w-4 h-4" />}
        >
          Dispatch AMR Mission
        </Button>
      </div>

      <DataTable
        data={robots}
        columns={columns}
        rowKey={(r) => r.robotId}
        searchKey={(r) => `${r.robotId} ${r.robotName} ${r.model} ${r.currentLocation}`}
        searchPlaceholder="Search robot fleet..."
        filters={filters}
        isLoading={isLoading}
      />

      <SimulateRobotTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
