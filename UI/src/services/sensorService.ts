import { apiClient, simulateLatency } from './api';
import { Sensor, SensorData, Alert } from '../types/iot';
import { mockDb } from './mockStorage';

export const sensorService = {
  async getSensors(): Promise<Sensor[]> {
    try {
      const response = await apiClient.get<Sensor[]>('/sensors');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getSensors();
    }
  },

  async getTelemetry(sensorId?: string): Promise<SensorData[]> {
    try {
      const url = sensorId ? `/sensors/data?sensorId=${sensorId}` : '/sensors/data';
      const response = await apiClient.get<SensorData[]>(url);
      return response.data;
    } catch {
      await simulateLatency(150);
      const data = mockDb.getSensorData();
      if (sensorId) {
        return data.filter((d) => d.sensorId === sensorId);
      }
      return data;
    }
  },

  async simulateReading(sensorId: string, value: number): Promise<{ sensor: Sensor; alertGenerated?: Alert }> {
    try {
      const response = await apiClient.post<{ sensor: Sensor; alertGenerated?: Alert }>('/sensors/simulate', {
        sensorId,
        value,
      });
      return response.data;
    } catch {
      await simulateLatency(250);
      const sensors = mockDb.getSensors();
      const telemetry = mockDb.getSensorData();
      const alerts = mockDb.getAlerts();

      const idx = sensors.findIndex((s) => s.sensorId === sensorId);
      if (idx === -1) throw new Error(`Sensor ${sensorId} not found`);

      const sensor = sensors[idx];
      sensor.lastReading = value;
      sensor.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 19);

      let alertGenerated: Alert | undefined;

      // Check if threshold breached
      if (value > sensor.maxThreshold || value < sensor.minThreshold) {
        sensor.status = value > sensor.maxThreshold * 1.15 ? 'CRITICAL' : 'WARNING';

        // Auto-generate Alert
        const newAlertId = `ALT-${String(alerts.length + 101)}`;
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        alertGenerated = {
          alertId: newAlertId,
          sensorId: sensor.sensorId,
          sensorName: sensor.sensorName,
          alertType: `${sensor.sensorType} Threshold Breach (${value} ${sensor.unit})`,
          severity: sensor.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          time: nowStr,
          status: 'ACTIVE',
          message: `Reading of ${value} ${sensor.unit} outside safe bounds [${sensor.minThreshold} - ${sensor.maxThreshold} ${sensor.unit}]`,
          location: sensor.location,
        };
        alerts.unshift(alertGenerated);
        mockDb.setAlerts(alerts);
      } else {
        sensor.status = 'ONLINE';
      }

      sensors[idx] = sensor;
      mockDb.setSensors(sensors);

      // Record Telemetry
      const timeLabel = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newDatum: SensorData = {
        dataId: `DAT-${Date.now().toString().slice(-4)}`,
        sensorId: sensor.sensorId,
        sensorName: sensor.sensorName,
        value,
        unit: sensor.unit,
        timestamp: timeLabel,
      };
      mockDb.setSensorData([...telemetry, newDatum]);

      return { sensor, alertGenerated };
    }
  },
};
