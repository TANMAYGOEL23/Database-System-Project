import React, { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, CheckCircle2, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { Alert } from '../../types/iot';
import { formatDateTime } from '../../utils/formatters';

export const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await alertService.getAll();
      setAlerts(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Alerts', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (alert: Alert) => {
    try {
      await alertService.acknowledgeAlert(alert.alertId, user?.fullName || 'Shift Operator');
      showToast('info', 'Alert Acknowledged', `Incident ${alert.alertId} acknowledged by ${user?.fullName || 'Operator'}`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleResolve = async (alert: Alert) => {
    try {
      await alertService.resolveAlert(alert.alertId);
      showToast('success', 'Alert Resolved', `Incident ${alert.alertId} cleared and marked resolved.`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const columns: Column<Alert>[] = [
    {
      key: 'alertId',
      header: 'Alert ID',
      sortable: true,
      render: (a) => <span className="font-mono font-semibold text-rose-400">{a.alertId}</span>,
    },
    {
      key: 'alertType',
      header: 'Incident Event / Trigger',
      sortable: true,
      render: (a) => (
        <div>
          <div className={`font-semibold ${a.status === 'ACTIVE' ? 'text-rose-200' : 'text-slate-200'}`}>
            {a.alertType}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 max-w-md leading-relaxed">{a.message}</div>
        </div>
      ),
    },
    {
      key: 'sensorName',
      header: 'Originating Sensor & Zone',
      sortable: true,
      render: (a) => (
        <div>
          <div className="text-slate-200 font-medium text-xs">{a.sensorName}</div>
          <div className="text-[10px] text-slate-400 font-mono">📍 {a.location}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (a) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            a.severity === 'CRITICAL'
              ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/50'
              : a.severity === 'HIGH'
              ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
              : 'bg-blue-500/25 text-blue-300'
          }`}
        >
          {a.severity}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Trigger Timestamp',
      sortable: true,
      render: (a) => <span className="font-mono text-xs text-slate-400">{formatDateTime(a.time)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          {a.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAcknowledge(a)}
              className="text-xs"
            >
              Acknowledge
            </Button>
          )}
          {a.status !== 'RESOLVED' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleResolve(a)}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Resolve
            </Button>
          )}
          {a.status === 'RESOLVED' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Incident Status',
      options: [
        { label: 'Active Unresolved', value: 'ACTIVE' },
        { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
        { label: 'Resolved Closed', value: 'RESOLVED' },
      ],
    },
    {
      key: 'severity',
      label: 'Severity Level',
      options: [
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Incidents & Safety Alerts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time critical alarm feeds generated automatically by PostgreSQL database event triggers.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Feed
        </Button>
      </div>

      <DataTable
        data={alerts}
        columns={columns}
        rowKey={(a) => a.alertId}
        searchKey={(a) => `${a.alertId} ${a.alertType} ${a.sensorName} ${a.location}`}
        searchPlaceholder="Search alerts by incident ID, sensor, zone..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
