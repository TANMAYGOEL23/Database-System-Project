import React, { useState, useEffect } from 'react';
import { Bot, FastForward, CheckCircle2, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { SimulateRobotTaskModal } from '../../components/simulation/SimulateRobotTaskModal';
import { useNotification } from '../../context/NotificationContext';
import { robotService } from '../../services/robotService';
import { RobotTask, RobotTaskStatus } from '../../types/warehouse';
import { formatDate } from '../../utils/formatters';

export const RobotTasks: React.FC = () => {
  const [tasks, setTasks] = useState<RobotTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await robotService.getTasks();
      setTasks(data);
    } catch (e: any) {
      showToast('error', 'Error Loading AMR Tasks', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdvance = async (taskId: string) => {
    try {
      setIsAdvancing(true);
      const updated = await robotService.advanceTaskStatus(taskId);
      showToast('success', 'Task Advanced', `AMR Mission stepped forward to ${updated.status}.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Step Advance Failed', e.message);
    } finally {
      setIsAdvancing(false);
    }
  };

  const columns: Column<RobotTask>[] = [
    {
      key: 'taskId',
      header: 'Mission Task ID',
      sortable: true,
      render: (t) => <span className="font-mono text-xs font-semibold text-blue-400">{t.taskId}</span>,
    },
    {
      key: 'robotId',
      header: 'Assigned AMR Robot',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs text-indigo-300 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          {t.robotName || t.robotId}
        </span>
      ),
    },
    {
      key: 'productId',
      header: 'Payload Material',
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.productName || t.productId}</div>
          <div className="text-[11px] font-mono text-slate-400">Qty: {t.quantity} Units</div>
        </div>
      ),
    },
    {
      key: 'routing',
      header: 'Routing (Pick → Drop)',
      render: (t) => (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-300">Shelf {t.shelfId}</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-emerald-400">{t.targetLocation}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
            t.priority === 'URGENT'
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {t.priority || 'NORMAL'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Mission Progress',
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'actions',
      header: 'Step Control',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAdvance(t.taskId)}
              disabled={isAdvancing}
              leftIcon={<FastForward className="w-3.5 h-3.5" />}
            >
              Advance Step
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Mission Status',
      options: [
        { label: 'Assigned', value: 'ASSIGNED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Picked Material', value: 'PICKED' },
        { label: 'Delivered to Cell', value: 'DELIVERED' },
        { label: 'Completed', value: 'COMPLETED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AMR Material Shuttle Missions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated transport tickets dispatching materials between warehouse shelving and CNC lines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Missions
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
        data={tasks}
        columns={columns}
        rowKey={(t) => t.taskId}
        searchKey={(t) => `${t.taskId} ${t.robotId} ${t.productName} ${t.targetLocation}`}
        searchPlaceholder="Filter mission tickets by AMR code, SKU, or drop point..."
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
