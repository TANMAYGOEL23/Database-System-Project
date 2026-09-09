import React, { useState, useEffect } from 'react';
import { Activity, Zap, RefreshCw, LineChart as ChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { SimulateSensorModal } from '../../components/simulation/SimulateSensorModal';
import { useNotification } from '../../context/NotificationContext';
import { sensorService } from '../../services/sensorService';
import { Sensor, SensorData } from '../../types/iot';

export const SensorDataPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SensorData[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('SNS001');
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tel, s] = await Promise.all([
        sensorService.getTelemetry(),
        sensorService.getSensors(),
      ]);
      setTelemetry(tel);
      setSensors(s);
    } catch (e: any) {
      showToast('error', 'Error Loading Telemetry', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSensor = sensors.find((s) => s.sensorId === selectedSensorId);
  const filteredTelemetry = telemetry.filter((t) => t.sensorId === selectedSensorId);

  const columns: Column<SensorData>[] = [
    {
      key: 'dataId',
      header: 'Packet ID',
      sortable: true,
      render: (d) => <span className="font-mono font-semibold text-cyan-400">{d.dataId}</span>,
    },
    {
      key: 'sensorName',
      header: 'Sensor Node',
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
      header: 'Ingested Telemetry Value',
      sortable: true,
      align: 'right',
      render: (d) => (
        <span className="font-mono font-bold text-sm text-cyan-400">
          {d.value} {d.unit}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Packet Ingestion Time',
      sortable: true,
      render: (d) => <span className="font-mono text-xs text-slate-400">{d.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">IoT Telemetry Telemetry Stream & History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical time-series sensor ingestion logs stored inside the PostgreSQL SENSOR_DATA table.
          </p>
        </div>

        <Button
          variant="industrial"
          onClick={() => setIsSimulateOpen(true)}
          leftIcon={<Zap className="w-4 h-4" />}
        >
          Simulate Sensor Reading
        </Button>
      </div>

      {/* Historical Telemetry Chart Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Telemetry Waveform Telemetry Chart
              </h3>
              <p className="text-xs text-slate-400">
                {activeSensor ? `${activeSensor.sensorName} (${activeSensor.location})` : 'Select a sensor'}
              </p>
            </div>
          </div>

          <div className="w-72">
            <Select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              options={sensors.map((s) => ({
                label: `${s.sensorName} (${s.unit})`,
                value: s.sensorId,
              }))}
            />
          </div>
        </div>

        <div className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredTelemetry} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val} ${activeSensor?.unit || ''}`, 'Telemetry Value']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="value"
                name={`${activeSensor?.sensorName || 'Sensor'} Reading (${activeSensor?.unit || ''})`}
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#06b6d4' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Telemetry Stream Data Table */}
      <DataTable
        data={telemetry}
        columns={columns}
        rowKey={(d) => d.dataId}
        searchKey={(d) => `${d.dataId} ${d.sensorName} ${d.sensorId}`}
        searchPlaceholder="Search telemetry packets..."
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
