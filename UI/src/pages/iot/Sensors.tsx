import React, { useState, useEffect } from 'react';
import { Activity, Zap, Plus, RefreshCw, Thermometer, Wind, Eye } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SimulateSensorModal } from '../../components/simulation/SimulateSensorModal';
import { useNotification } from '../../context/NotificationContext';
import { sensorService } from '../../services/sensorService';
import { Sensor, SensorType } from '../../types/iot';
import { useNavigate } from 'react-router-dom';

export const Sensors: React.FC = () => {
  const navigate = useNavigate();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

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

  const columns: Column<Sensor>[] = [
    {
      key: 'sensorId',
      header: 'Sensor ID',
      sortable: true,
      render: (s) => <span className="font-mono font-semibold text-cyan-400">{s.sensorId}</span>,
    },
    {
      key: 'sensorName',
      header: 'Sensor Node & Type',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-100">{s.sensorName}</div>
          <div className="text-[11px] font-mono text-slate-400">{s.sensorType} • {s.location}</div>
        </div>
      ),
    },
    {
      key: 'lastReading',
      header: 'Live Telemetry Reading',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span className={`font-mono font-bold text-sm ${
          s.status === 'CRITICAL'
            ? 'text-rose-400'
            : s.status === 'WARNING'
            ? 'text-amber-400'
            : 'text-emerald-400'
        }`}>
          {s.lastReading} {s.unit}
        </span>
      ),
    },
    {
      key: 'thresholds',
      header: 'Operating Safe Bounds',
      render: (s) => (
        <span className="font-mono text-xs text-slate-400">
          [{s.minThreshold} — {s.maxThreshold} {s.unit}]
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      header: 'Last Packet',
      sortable: true,
      render: (s) => <span className="font-mono text-xs text-slate-400">{s.lastUpdated.split(' ')[1] || s.lastUpdated}</span>,
    },
    {
      key: 'status',
      header: 'Telemetry Status',
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/iot/data')}
          leftIcon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
        >
          View Data
        </Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'sensorType',
      label: 'Sensor Types',
      options: [
        { label: 'Temperature', value: 'TEMPERATURE' },
        { label: 'Humidity', value: 'HUMIDITY' },
        { label: 'Gas / Sniffer', value: 'GAS' },
        { label: 'Vibration', value: 'VIBRATION' },
        { label: 'Power Draw', value: 'POWER' },
        { label: 'Optical Inventory', value: 'INVENTORY' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Online Nominal', value: 'ONLINE' },
        { label: 'Warning Warning', value: 'WARNING' },
        { label: 'Critical Threshold', value: 'CRITICAL' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Environmental & IoT Sensors</h2>
          <p className="text-xs text-slate-400 mt-1">
            Software-simulated sensor nodes: Spindle Thermal Probes, Hydraulic Vibration, Battery VOC Gas, and Power Meters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/iot/data')}
            leftIcon={<Activity className="w-4 h-4" />}
          >
            Telemetry History
          </Button>
          <Button
            variant="industrial"
            onClick={() => setIsSimulateOpen(true)}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Simulate Telemetry Reading
          </Button>
        </div>
      </div>

      <DataTable
        data={sensors}
        columns={columns}
        rowKey={(s) => s.sensorId}
        searchKey={(s) => `${s.sensorId} ${s.sensorName} ${s.sensorType} ${s.location}`}
        searchPlaceholder="Search sensors by ID, name, zone..."
        filters={filters}
        isLoading={isLoading}
      />

      <SimulateSensorModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
