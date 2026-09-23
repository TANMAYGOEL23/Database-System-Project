import React, { useState, useEffect } from 'react';
import { Radio, Activity, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { sensorService } from '../../services/sensorService';
import { SensorData, Sensor } from '../../types/iot';

export const SensorDataPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SensorData[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tData, sList] = await Promise.all([
        sensorService.getTelemetry(),
        sensorService.getSensors(),
      ]);
      setTelemetry(tData);
      setSensors(sList);
    } catch (e: any) {
      showToast('error', 'Error Loading Telemetry Feed', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<SensorData>[] = [
    {
      key: 'dataId',
      header: 'Stream Record ID',
      sortable: true,
      render: (d) => <span className="font-mono text-xs font-semibold text-blue-400">{d.dataId}</span>,
    },
    {
      key: 'sensorName',
      header: 'Origin Sensor Node',
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-semibold text-slate-100">{d.sensorName}</div>
          <div className="text-[11px] font-mono text-slate-400">{d.sensorId}</div>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Transmitted Value',
      sortable: true,
      align: 'right',
      render: (d) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          {d.value.toFixed(2)} {d.unit}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Sampling Timestamp',
      sortable: true,
      render: (d) => <span className="font-mono text-xs text-slate-400">{d.timestamp}</span>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'sensorName',
      label: 'Sensor Node',
      options: sensors.map((s) => ({ label: s.sensorName, value: s.sensorName })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Time-Series Telemetry Feed</h2>
          <p className="text-xs text-slate-400 mt-1">
            Raw ingest logs from edge IoT gateways, vibration analyzers, and thermal imaging cameras.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Feed
        </Button>
      </div>

      <DataTable
        data={telemetry}
        columns={columns}
        rowKey={(d) => d.dataId}
        searchKey={(d) => `${d.dataId} ${d.sensorName} ${d.sensorId}`}
        searchPlaceholder="Search telemetry stream by node or ID..."
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
};
