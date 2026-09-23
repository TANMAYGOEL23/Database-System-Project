import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { sensorService } from '../../services/sensorService';
import { Sensor } from '../../types/iot';
import { Activity, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface SimulateSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SimulateSensorModal: React.FC<SimulateSensorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const [readingValue, setReadingValue] = useState<string>('42.0');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const list = await sensorService.getSensors();
        setSensors(list);
        if (list.length > 0) {
          setSelectedSensorId(list[0].sensorId);
          setReadingValue(String(list[0].lastReading));
        }
      };
      load();
    }
  }, [isOpen]);

  const selectedSensor = sensors.find((s) => s.sensorId === selectedSensorId);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensorId) return;

    const val = parseFloat(readingValue);
    if (isNaN(val)) {
      showToast('error', 'Invalid Input', 'Please provide a valid numerical reading');
      return;
    }

    try {
      setIsLoading(true);
      const res = await sensorService.simulateReading(selectedSensorId, val);

      if (res.alertCreated) {
        showToast(
          'warning',
          `Safety Alert Generated: ${res.alertCreated.alertType}`,
          `${res.alertCreated.message} (Severity: ${res.alertCreated.severity})`,
          6000
        );
      } else {
        showToast(
          'success',
          'Telemetry Stream Updated',
          `${res.reading.sensorName} packet received: ${res.reading.value} ${res.reading.unit}`
        );
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetThresholdValue = (multiplier: number) => {
    if (!selectedSensor) return;
    setReadingValue((selectedSensor.maxThreshold * multiplier).toFixed(1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inject Simulated IoT Telemetry Packet"
      subtitle="Virtual Sensor Packet Generator & Threshold Alert Trigger"
      maxWidth="md"
      icon={<Activity className="w-5 h-5 text-cyan-400" />}
    >
      <form onSubmit={handleSimulate} className="space-y-4">
        <Select
          label="Target Industrial Sensor Node"
          value={selectedSensorId}
          onChange={(e) => {
            setSelectedSensorId(e.target.value);
            const found = sensors.find((s) => s.sensorId === e.target.value);
            if (found) setReadingValue(String(found.lastReading));
          }}
          options={sensors.map((s) => ({
            label: `${s.sensorName} (${s.sensorType} - ${s.location})`,
            value: s.sensorId,
          }))}
          required
        />

        {selectedSensor && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Unit of Measure:</span>
              <span className="text-slate-200">{selectedSensor.unit}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Safe Bounds:</span>
              <span className="text-emerald-400">
                {selectedSensor.minThreshold} - {selectedSensor.maxThreshold} {selectedSensor.unit}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Last Ingested:</span>
              <span className="text-cyan-400">
                {selectedSensor.lastReading} {selectedSensor.unit}
              </span>
            </div>
          </div>
        )}

        <Input
          label={`Telemetry Reading Value (${selectedSensor?.unit || ''})`}
          type="number"
          step="0.1"
          value={readingValue}
          onChange={(e) => setReadingValue(e.target.value)}
          required
        />

        {/* Quick Simulation Presets */}
        {selectedSensor && (
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Quick Test Trigger Presets:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReadingValue(((selectedSensor.minThreshold + selectedSensor.maxThreshold) / 2).toFixed(1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-medium text-emerald-400 border border-slate-700"
              >
                Nominal
              </button>
              <button
                type="button"
                onClick={() => handleSetThresholdValue(1.05)}
                className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-[11px] font-mono font-medium text-amber-400 border border-amber-800/40"
              >
                Trigger Warning
              </button>
              <button
                type="button"
                onClick={() => handleSetThresholdValue(1.3)}
                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-[11px] font-mono font-medium text-rose-400 border border-rose-800/40"
              >
                Trigger Critical
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="industrial"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Transmit Telemetry Packet
          </Button>
        </div>
      </form>
    </Modal>
  );
};
