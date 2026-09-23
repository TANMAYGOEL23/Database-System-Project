import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Alert } from '../types/iot';

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

export const alertService = {
  async getAll(): Promise<Alert[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('alerts').select('*').order('time', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapAlertFromDb);
    }

    await delay(200);
    return mockStorage.alerts;
  },

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: 'ACKNOWLEDGED', acknowledged_by: acknowledgedBy })
        .eq('alert_id', alertId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapAlertFromDb(data);
    }

    await delay(250);
    const alerts = mockStorage.alerts;
    const idx = alerts.findIndex((a) => a.alertId === alertId);
    if (idx === -1) throw new Error(`Alert ${alertId} not found`);

    alerts[idx].status = 'ACKNOWLEDGED';
    alerts[idx].acknowledgedBy = acknowledgedBy;
    mockStorage.alerts = alerts;
    return alerts[idx];
  },

  async resolveAlert(alertId: string): Promise<Alert> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: 'RESOLVED', resolved_at: nowStr })
        .eq('alert_id', alertId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapAlertFromDb(data);
    }

    await delay(250);
    const alerts = mockStorage.alerts;
    const idx = alerts.findIndex((a) => a.alertId === alertId);
    if (idx === -1) throw new Error(`Alert ${alertId} not found`);

    alerts[idx].status = 'RESOLVED';
    alerts[idx].resolvedAt = nowStr;
    mockStorage.alerts = alerts;
    return alerts[idx];
  },
};
