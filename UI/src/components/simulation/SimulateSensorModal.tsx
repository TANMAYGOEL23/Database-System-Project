import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Cpu, Zap, Thermometer, Wind } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { sensorService } from '../../services/sensorService';
import { useNotification } from '../../context/NotificationContext';
import { Sensor } from '../../types/iot';

interface SimulateSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SimulateSensorModal: React.FC<SimulateSensorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [readingValue, setReadingValue] = useState<string>('45.0');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const s = await sensorService.getSensors();
        setSensors(s);
        if (s.length > 0) {
          setSelectedSensorId(s[0].sensorId);
          setReadingValue(String(s[0].lastReading));
        }
      };
      load();
    }
  }, [isOpen]);

  const activeSensor = sensors.find((s) => s.sensorId === selectedSensorId);

  const handleSensorSelect = (id: string) => {
    setSelectedSensorId(id);
    const s = sensors.find((x) => x.sensorId === id);
    if (s) setReadingValue(String(s.lastReading));
  };

  const handlePreset = (val: number) => {
    setReadingValue(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensorId || !activeSensor) return;

    const numericVal = parseFloat(readingValue);
    if (isNaN(numericVal)) {
      showToast('error', 'Validation Error', 'Please enter a valid numeric reading value');
      return;
    }

    try {
      setIsLoading(true);
      const res = await sensorService.simulateReading(selectedSensorId, numericVal);

      if (res.alertGenerated) {
        showToast(
          'error',
          `CRITICAL ALERT GENERATED: ${res.alertGenerated.alertType}`,
          `Sensor reading ${numericVal} ${activeSensor.unit} breached safe operating threshold (${activeSensor.maxThreshold} ${activeSensor.unit})!`
        );
      } else {
        showToast(
          'success',
          'Telemetry Ingested Successfully',
          `Sensor ${activeSensor.sensorName} reading recorded at ${numericVal} ${activeSensor.unit} (Normal range).`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Sensor Simulation Error', err.message || 'Failed to simulate sensor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate IoT Sensor Telemetry"
      subtitle="Transmit simulated telemetry readings into PostgreSQL SENSOR_DATA table"
      icon={<Activity className="w-5 h-5 text-cyan-400" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
          <Cpu className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
          <span>
            <strong>Trigger Simulation:</strong> Entering values above the maximum threshold will automatically simulate the database event trigger that generates an active <code>ALERT</code> record.
          </span>
        </div>

        <Select
          label="Target Industrial Sensor"
          value={selectedSensorId}
          onChange={(e) => handleSensorSelect(e.target.value)}
          options={sensors.map((s) => ({
            value: s.sensorId,
            label: `${s.sensorName} [${s.sensorType} - ${s.location}]`,
          }))}
          required
        />

        {activeSensor && (
          <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Operating Safe Bounds:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {activeSensor.minThreshold} {activeSensor.unit} — {activeSensor.maxThreshold} {activeSensor.unit}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Current Status:</span>
              <span className="font-semibold text-blue-400">{activeSensor.status}</span>
            </div>

            {/* Quick Test Presets */}
            <div className="pt-2 border-t border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Quick Test Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePreset(Number(((activeSensor.minThreshold + activeSensor.maxThreshold) / 2).toFixed(1)))}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] transition-colors"
                >
                  🟢 Normal Nominal
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(Number((activeSensor.maxThreshold * 0.95).toFixed(1)))}
                  className="px-2.5 py-1 rounded bg-amber-900/40 border border-amber-700/50 hover:bg-amber-800/50 text-amber-200 text-[11px] transition-colors"
                >
                  🟡 Near Threshold
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(Number((activeSensor.maxThreshold * 1.25).toFixed(1)))}
                  className="px-2.5 py-1 rounded bg-rose-900/40 border border-rose-700/50 hover:bg-rose-800/50 text-rose-200 text-[11px] transition-colors flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> 🔴 Alarm Breach Test
                </button>
              </div>
            </div>
          </div>
        )}

        <Input
          label={`Sensor Reading Value (${activeSensor ? activeSensor.unit : 'Units'})`}
          type="number"
          step="0.1"
          value={readingValue}
          onChange={(e) => setReadingValue(e.target.value)}
          leftIcon={<Zap className="w-4 h-4 text-cyan-400" />}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="industrial" type="submit" isLoading={isLoading} leftIcon={<Activity className="w-4 h-4" />}>
            Transmit Telemetry Packet
          </Button>
        </div>
      </form>
    </Modal>
  );
};
