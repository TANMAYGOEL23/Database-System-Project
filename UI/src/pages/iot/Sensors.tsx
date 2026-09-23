import React, { useState, useEffect } from 'react';
import { Activity, Radio, Thermometer, Wind, Zap, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { SimulateSensorModal } from '../../components/simulation/SimulateSensorModal';
import { useNotification } from '../../context/NotificationContext';
import { sensorService } from '../../services/sensorService';
import { Sensor, SensorType } from '../../types/iot';
import { formatDate } from '../../utils/formatters';

export const Sensors: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await sensorService.getSensors();
      setSensors(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Sensors', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'TEMPERATURE':
        return <Thermometer className="w-3.5 h-3.5 text-amber-400" />;
      case 'HUMIDITY':
      case 'GAS':
        return <Wind className="w-3.5 h-3.5 text-blue-400" />;
      case 'POWER':
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const columns: Column<Sensor>[] = [
    {
      key: 'sensorId',
      header: 'Node ID',
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold text-blue-400">{s.sensorId}</span>,
    },
    {
      key: 'sensorName',
      header: 'Sensor Node & Type',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            {getSensorIcon(s.sensorType)}
            {s.sensorName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">{s.sensorType} • {s.location}</div>
        </div>
      ),
    },
    {
      key: 'lastReading',
      header: 'Live Telemetry Value',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span className="font-mono font-bold text-sm text-emerald-400">
          {s.lastReading.toFixed(1)} <span className="text-xs font-normal text-slate-400">{s.unit}</span>
        </span>
      ),
    },
    {
      key: 'thresholds',
      header: 'Threshold Boundaries',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-xs text-slate-400">
          [{s.minThreshold} - {s.maxThreshold} {s.unit}]
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Node Health',
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'lastUpdated',
      header: 'Last Heartbeat',
      sortable: true,
      render: (s) => <span className="font-mono text-xs text-slate-400">{formatDate(s.lastUpdated)}</span>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Telemetry Health',
      options: [
        { label: 'Online', value: 'ONLINE' },
        { label: 'Warning', value: 'WARNING' },
        { label: 'Critical Alert', value: 'CRITICAL' },
        { label: 'Offline', value: 'OFFLINE' },
      ],
    },
    {
      key: 'sensorType',
      label: 'Sensor Metric',
      options: [
        { label: 'Temperature', value: 'TEMPERATURE' },
        { label: 'Humidity', value: 'HUMIDITY' },
        { label: 'Gas / Air Quality', value: 'GAS' },
        { label: 'Vibration', value: 'VIBRATION' },
        { label: 'Power Draw', value: 'POWER' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">IoT Environmental & Machinery Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Distributed sensor grid monitoring HVAC, hydraulic temperature, vibration harmonics, and gas safety.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Heartbeat
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsSimModalOpen(true)}
            leftIcon={<Radio className="w-4 h-4" />}
          >
            Simulate IoT Telemetry
          </Button>
        </div>
      </div>

      <DataTable
        data={sensors}
        columns={columns}
        rowKey={(s) => s.sensorId}
        searchKey={(s) => `${s.sensorId} ${s.sensorName} ${s.location} ${s.sensorType}`}
        searchPlaceholder="Search sensor nodes by name, ID, or zone..."
        filters={filters}
        isLoading={isLoading}
      />

      <SimulateSensorModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
