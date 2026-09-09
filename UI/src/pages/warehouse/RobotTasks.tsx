import React, { useState, useEffect } from 'react';
import { Route, Plus, Bot, Play, CheckCircle2, ArrowRight, MapPin, Layers } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SimulateRobotTaskModal } from '../../components/simulation/SimulateRobotTaskModal';
import { useNotification } from '../../context/NotificationContext';
import { robotService } from '../../services/robotService';
import { RobotTask, RobotTaskStatus } from '../../types/warehouse';
import { formatDateTime } from '../../utils/formatters';

const LIFECYCLE_STEPS: RobotTaskStatus[] = [
  'CREATED',
  'ASSIGNED',
  'IN_PROGRESS',
  'PICKED',
  'DELIVERED',
  'COMPLETED',
];

export const RobotTasks: React.FC = () => {
  const [tasks, setTasks] = useState<RobotTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RobotTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await robotService.getTasks();
      setTasks(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Tasks', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdvanceTask = async (taskId: string) => {
    try {
      const updated = await robotService.advanceTaskStatus(taskId);
      showToast(
        'success',
        'Mission Step Advanced',
        `Task ${taskId} is now in state: ${updated.status}${
          updated.status === 'COMPLETED' ? ' (Inventory Stock Movement Recorded!)' : ''
        }`
      );
      loadData();
      if (selectedTask && selectedTask.taskId === taskId) {
        setSelectedTask(updated);
      }
    } catch (err: any) {
      showToast('error', 'Advance Failed', err.message);
    }
  };

  const columns: Column<RobotTask>[] = [
    {
      key: 'taskId',
      header: 'Mission ID',
      sortable: true,
      render: (t) => <span className="font-mono font-semibold text-indigo-400">{t.taskId}</span>,
    },
    {
      key: 'robotName',
      header: 'Assigned Robot',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.robotName || t.robotId}</span>
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Payload Material',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.productName}</div>
          <div className="text-[11px] font-mono text-slate-400">Qty: {t.quantity} units</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Transfer Route',
      render: (t) => (
        <div className="text-xs text-slate-300">
          <span className="font-mono text-[11px] text-cyan-400">{t.shelfLocation || t.shelfId}</span>
          <span className="text-slate-500 mx-1.5">→</span>
          <span className="font-mono text-[11px] text-emerald-400">{t.targetLocation}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Task Status',
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'startTime',
      header: 'Dispatch Time',
      sortable: true,
      render: (t) => <span className="font-mono text-xs text-slate-400">{formatDateTime(t.startTime)}</span>,
    },
    {
      key: 'actions',
      header: 'Execution Step',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAdvanceTask(t.taskId)}
              leftIcon={<Play className="w-3 h-3 text-indigo-400" />}
            >
              Advance Step
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTask(t);
                setIsDetailOpen(true);
              }}
            >
              View Lifecycle
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Task State',
      options: [
        { label: 'Created', value: 'CREATED' },
        { label: 'Assigned', value: 'ASSIGNED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Picked Goods', value: 'PICKED' },
        { label: 'Delivered', value: 'DELIVERED' },
        { label: 'Completed', value: 'COMPLETED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Autonomous AGV / AMR Material Missions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time autonomous picking, transit waypoints, drop-off confirmation, and stock movement sync.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Dispatch Robot Mission
        </Button>
      </div>

      {/* Visual Stepper Demonstration Banner */}
      <div className="p-5 rounded-xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Autonomous Mission Lifecycle State Machine
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {LIFECYCLE_STEPS.map((step, idx) => (
            <div
              key={step}
              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 font-mono font-bold text-[10px] flex items-center justify-center border border-indigo-700/50">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-bold text-slate-200 font-mono">{step}</span>
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      <DataTable
        data={tasks}
        columns={columns}
        rowKey={(t) => t.taskId}
        searchKey={(t) => `${t.taskId} ${t.robotName || ''} ${t.productName || ''} ${t.targetLocation}`}
        searchPlaceholder="Search robot tasks by ID, product, location..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Dispatch Modal */}
      <SimulateRobotTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />

      {/* Detail & Lifecycle Modal */}
      {selectedTask && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Autonomous Mission: ${selectedTask.taskId}`}
          subtitle={`Robot: ${selectedTask.robotName || selectedTask.robotId} • Target: ${selectedTask.targetLocation}`}
          maxWidth="lg"
          icon={<Bot className="w-5 h-5 text-indigo-400" />}
        >
          <div className="space-y-5">
            {/* Visual Stepper */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mission Execution Progression
              </h4>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = LIFECYCLE_STEPS.indexOf(selectedTask.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span
                          className={`text-xs font-mono ${
                            isCurrent
                              ? 'text-indigo-400 font-bold'
                              : isDone
                              ? 'text-slate-200 font-medium'
                              : 'text-slate-500'
                          }`}
                        >
                          {step}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase animate-pulse">
                            Current Stage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payload Material:</span>
                <span className="font-semibold text-slate-200">{selectedTask.productName} ({selectedTask.quantity} units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Pick Shelf:</span>
                <span className="font-mono text-cyan-400">{selectedTask.shelfLocation || selectedTask.shelfId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Waypoint:</span>
                <span className="font-mono text-emerald-400">{selectedTask.targetLocation}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {selectedTask.status !== 'COMPLETED' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAdvanceTask(selectedTask.taskId)}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Advance Mission Step
                </Button>
              ) : (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Mission Completed & Logged
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
