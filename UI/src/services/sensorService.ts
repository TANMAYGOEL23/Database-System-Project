import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Sensor, SensorData, Alert } from '../types/iot';

function mapSensorFromDb(row: any): Sensor {
  return {
    sensorId: row.sensor_id || row.sensorId,
    sensorName: row.sensor_name || row.sensorName,
    sensorType: row.sensor_type || row.sensorType,
    location: row.location,
    status: row.status,
    lastReading: parseFloat(row.last_reading || row.lastReading || 0),
    unit: row.unit,
    minThreshold: parseFloat(row.min_threshold || row.minThreshold || 0),
    maxThreshold: parseFloat(row.max_threshold || row.maxThreshold || 100),
    lastUpdated: row.last_updated || row.lastUpdated,
  };
}

function mapDataFromDb(row: any): SensorData {
  return {
    dataId: row.data_id || row.dataId,
    sensorId: row.sensor_id || row.sensorId,
    sensorName: row.sensor_name || row.sensorName,
    value: parseFloat(row.value || 0),
    unit: row.unit,
    timestamp: row.timestamp,
  };
}

function mapAlertFromDb(row: any): Alert {
  return {
    alertId: row.alert_id || row.alertId,
    sensorId: row.sensor_id || row.sensorId,
    sensorName: row.sensor_name || row.sensorName,
    alertType: row.alert_type || row.alertType,
    severity: row.severity,
    time: row.time,
    status: row.status,
    message: row.message,
    location: row.location,
    acknowledgedBy: row.acknowledged_by || row.acknowledgedBy,
    resolvedAt: row.resolved_at || row.resolvedAt,
  };
}

export const sensorService = {
  async getSensors(): Promise<Sensor[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('sensors').select('*').order('sensor_id');
      if (error) throw new Error(error.message);
      return (data || []).map(mapSensorFromDb);
    }

    await delay(200);
    return mockStorage.sensors;
  },

  async getTelemetry(sensorId?: string): Promise<SensorData[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('sensor_data').select('*').order('data_id', { ascending: false }).limit(50);
      if (sensorId) q = q.eq('sensor_id', sensorId);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data || []).map(mapDataFromDb);
    }

    await delay(200);
    const data = mockStorage.sensorData;
    return sensorId ? data.filter((d) => d.sensorId === sensorId) : data;
  },

  async simulateReading(sensorId: string, value: number): Promise<{ reading: SensorData; alertCreated?: Alert }> {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nowFull = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (isSupabaseConfigured()) {
      const { data: s } = await supabase.from('sensors').select('*').eq('sensor_id', sensorId).single();
      if (!s) throw new Error(`Sensor ${sensorId} not found`);

      // 1. Insert Telemetry Data
      const dataPayload = {
        sensor_id: sensorId,
        sensor_name: s.sensor_name,
        value,
        unit: s.unit,
        timestamp: nowTime,
      };
      const { data: readingData, error: rErr } = await supabase.from('sensor_data').insert([dataPayload]).select().single();
      if (rErr) throw new Error(rErr.message);

      // 2. Check Thresholds
      let newStatus: Sensor['status'] = 'ONLINE';
      let alertCreated: Alert | undefined;

      if (value > s.max_threshold) {
        newStatus = value > s.max_threshold * 1.2 ? 'CRITICAL' : 'WARNING';
        const alertPayload = {
          sensor_id: sensorId,
          sensor_name: s.sensor_name,
          alert_type: `${s.sensor_type}_THRESHOLD_HIGH`,
          severity: newStatus === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          time: nowFull,
          status: 'ACTIVE',
          message: `${s.sensor_name} exceeded threshold (${value} ${s.unit} > ${s.max_threshold} ${s.unit})`,
          location: s.location,
        };
        const { data: createdAlert } = await supabase.from('alerts').insert([alertPayload]).select().single();
        if (createdAlert) alertCreated = mapAlertFromDb(createdAlert);
      } else if (value < s.min_threshold) {
        newStatus = 'WARNING';
        const alertPayload = {
          sensor_id: sensorId,
          sensor_name: s.sensor_name,
          alert_type: `${s.sensor_type}_BELOW_MIN`,
          severity: 'MEDIUM',
          time: nowFull,
          status: 'ACTIVE',
          message: `${s.sensor_name} dropped below minimal operating threshold`,
          location: s.location,
        };
        const { data: createdAlert } = await supabase.from('alerts').insert([alertPayload]).select().single();
        if (createdAlert) alertCreated = mapAlertFromDb(createdAlert);
      }

      // 3. Update Sensor Live Status
      await supabase.from('sensors').update({ last_reading: value, status: newStatus, last_updated: nowFull }).eq('sensor_id', sensorId);

      return {
        reading: mapDataFromDb(readingData),
        alertCreated,
      };
    }

    await delay(300);
    const sensors = mockStorage.sensors;
    const sIdx = sensors.findIndex((s) => s.sensorId === sensorId);
    if (sIdx === -1) throw new Error(`Sensor ${sensorId} not found`);

    const newReading: SensorData = {
      dataId: `DAT-${Math.floor(1000 + Math.random() * 9000)}`,
      sensorId,
      sensorName: sensors[sIdx].sensorName,
      value,
      unit: sensors[sIdx].unit,
      timestamp: nowTime,
    };
    mockStorage.sensorData = [...mockStorage.sensorData, newReading];

    let newStatus: Sensor['status'] = 'ONLINE';
    let alertCreated: Alert | undefined;

    if (value > sensors[sIdx].maxThreshold) {
      newStatus = value > sensors[sIdx].maxThreshold * 1.2 ? 'CRITICAL' : 'WARNING';
      alertCreated = {
        alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        sensorId,
        sensorName: sensors[sIdx].sensorName,
        alertType: `${sensors[sIdx].sensorType}_THRESHOLD_HIGH`,
        severity: newStatus === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        time: nowFull,
        status: 'ACTIVE',
        message: `${sensors[sIdx].sensorName} exceeded safe limit (${value} ${sensors[sIdx].unit} > ${sensors[sIdx].maxThreshold} ${sensors[sIdx].unit})`,
        location: sensors[sIdx].location,
      };
      mockStorage.alerts = [alertCreated, ...mockStorage.alerts];
    } else if (value < sensors[sIdx].minThreshold) {
      newStatus = 'WARNING';
      alertCreated = {
        alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        sensorId,
        sensorName: sensors[sIdx].sensorName,
        alertType: `${sensors[sIdx].sensorType}_BELOW_MIN`,
        severity: 'MEDIUM',
        time: nowFull,
        status: 'ACTIVE',
        message: `${sensors[sIdx].sensorName} dropped below minimal operating threshold`,
        location: sensors[sIdx].location,
      };
      mockStorage.alerts = [alertCreated, ...mockStorage.alerts];
    }

    sensors[sIdx].lastReading = value;
    sensors[sIdx].status = newStatus;
    sensors[sIdx].lastUpdated = nowFull;
    mockStorage.sensors = sensors;

    return { reading: newReading, alertCreated };
  },
};
