import { apiClient, simulateLatency } from './api';
import { Alert } from '../types/iot';
import { mockDb } from './mockStorage';

export const alertService = {
  async getAll(): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>('/alerts');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getAlerts();
    }
  },

  async acknowledgeAlert(alertId: string, employeeName: string): Promise<Alert> {
    try {
      const response = await apiClient.patch<Alert>(`/alerts/${alertId}/acknowledge`, { employeeName });
      return response.data;
    } catch {
      await simulateLatency(150);
      const alerts = mockDb.getAlerts();
      const idx = alerts.findIndex((a) => a.alertId === alertId);
      if (idx === -1) throw new Error(`Alert ${alertId} not found`);
      alerts[idx].status = 'ACKNOWLEDGED';
      alerts[idx].acknowledgedBy = employeeName;
      mockDb.setAlerts(alerts);
      return alerts[idx];
    }
  },

  async resolveAlert(alertId: string): Promise<Alert> {
    try {
      const response = await apiClient.patch<Alert>(`/alerts/${alertId}/resolve`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const alerts = mockDb.getAlerts();
      const idx = alerts.findIndex((a) => a.alertId === alertId);
      if (idx === -1) throw new Error(`Alert ${alertId} not found`);
      alerts[idx].status = 'RESOLVED';
      alerts[idx].resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      mockDb.setAlerts(alerts);
      return alerts[idx];
    }
  },
};
