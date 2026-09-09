export type SensorType = 'TEMPERATURE' | 'HUMIDITY' | 'GAS' | 'VIBRATION' | 'POWER' | 'INVENTORY';

export type SensorStatus = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface Sensor {
  sensorId: string;
  sensorName: string;
  sensorType: SensorType;
  location: string;
  status: SensorStatus;
  lastReading: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  lastUpdated: string;
}

export interface SensorData {
  dataId: string;
  sensorId: string;
  sensorName: string;
  value: number;
  unit: string;
  timestamp: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  alertId: string;
  sensorId: string;
  sensorName: string;
  alertType: string;
  severity: AlertSeverity;
  time: string;
  status: AlertStatus;
  message: string;
  location: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}
