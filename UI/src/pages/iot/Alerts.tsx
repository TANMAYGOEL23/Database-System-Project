import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Eye, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { alertService } from '../../services/alertService';
import { Alert, AlertStatus, AlertSeverity } from '../../types/iot';
import { formatDate } from '../../utils/formatters';

export const Alerts: React.FC = () => {
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

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId, 'Safety Engineer');
      showToast('success', 'Incident Acknowledged', `Alert ${alertId} assigned for response.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Acknowledge Failed', e.message);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId);
      showToast('success', 'Incident Resolved', `Alert ${alertId} marked as safe & resolved.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Resolve Failed', e.message);
    }
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800">
            HIGH RISK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-950 text-blue-300 border border-blue-800">
            {sev}
          </span>
        );
    }
  };

  const columns: Column<Alert>[] = [
    {
      key: 'alertId',
      header: 'Incident Code',
      sortable: true,
      render: (a) => <span className="font-mono text-xs font-semibold text-rose-400">{a.alertId}</span>,
    },
    {
      key: 'message',
      header: 'Alert Details & Sensor Node',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            {a.message}
          </div>
          <div className="text-[11px] font-mono text-slate-400">Node: {a.sensorName} • {a.location}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (a) => getSeverityBadge(a.severity),
    },
    {
      key: 'time',
      header: 'Trigger Time',
      sortable: true,
      render: (a) => <span className="font-mono text-xs text-slate-400">{formatDate(a.time)}</span>,
    },
    {
      key: 'status',
      header: 'Incident State',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Response Actions',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          {a.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAcknowledge(a.alertId)}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
            >
              Ack
            </Button>
          )}
          {a.status !== 'RESOLVED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleResolve(a.alertId)}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Incident State',
      options: [
        { label: 'Active Alarm', value: 'ACTIVE' },
        { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
        { label: 'Resolved', value: 'RESOLVED' },
      ],
    },
    {
      key: 'severity',
      label: 'Severity Level',
      options: [
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High Risk', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Factory Safety & Telemetry Incidents</h2>
          <p className="text-xs text-slate-400 mt-1">
            Threshold breaches, temperature overshoots, and environmental emergency alarms.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Alarms
        </Button>
      </div>

      <DataTable
        data={alerts}
        columns={columns}
        rowKey={(a) => a.alertId}
        searchKey={(a) => `${a.alertId} ${a.message} ${a.sensorName} ${a.location}`}
        searchPlaceholder="Filter alarms by incident code, location, or message..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
