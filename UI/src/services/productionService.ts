import { apiClient, simulateLatency } from './api';
import { Machine, ProductionOrder, ProductionLog } from '../types/production';
import { StockTransaction } from '../types/inventory';
import { mockDb } from './mockStorage';

export const productionService = {
  async getMachines(): Promise<Machine[]> {
    try {
      const response = await apiClient.get<Machine[]>('/production/machines');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getMachines();
    }
  },

  async updateMachineStatus(id: string, status: Machine['status']): Promise<Machine> {
    try {
      const response = await apiClient.patch<Machine>(`/production/machines/${id}/status`, { status });
      return response.data;
    } catch {
      await simulateLatency(150);
      const machines = mockDb.getMachines();
      const idx = machines.findIndex((m) => m.machineId === id);
      if (idx === -1) throw new Error(`Machine ${id} not found`);
      machines[idx].status = status;
      mockDb.setMachines(machines);
      return machines[idx];
    }
  },

  async getOrders(): Promise<ProductionOrder[]> {
    try {
      const response = await apiClient.get<ProductionOrder[]>('/production/orders');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getProductionOrders();
    }
  },

  async getOrderById(id: string): Promise<ProductionOrder> {
    try {
      const response = await apiClient.get<ProductionOrder>(`/production/orders/${id}`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const orders = mockDb.getProductionOrders();
      const order = orders.find((o) => o.productionOrderId === id);
      if (!order) throw new Error(`Production order ${id} not found`);
      return order;
    }
  },

  async createOrder(order: Omit<ProductionOrder, 'productionOrderId' | 'producedQuantity'>): Promise<ProductionOrder> {
    try {
      const response = await apiClient.post<ProductionOrder>('/production/orders', order);
      return response.data;
    } catch {
      await simulateLatency(250);
      const orders = mockDb.getProductionOrders();
      const newId = `PRD-ORD-${String(orders.length + 101)}`;
      const newOrder: ProductionOrder = {
        ...order,
        productionOrderId: newId,
        producedQuantity: 0,
      };
      mockDb.setProductionOrders([newOrder, ...orders]);
      return newOrder;
    }
  },

  async updateOrderStatus(id: string, status: ProductionOrder['status']): Promise<ProductionOrder> {
    try {
      const response = await apiClient.patch<ProductionOrder>(`/production/orders/${id}/status`, { status });
      return response.data;
    } catch {
      await simulateLatency(200);
      const orders = mockDb.getProductionOrders();
      const idx = orders.findIndex((o) => o.productionOrderId === id);
      if (idx === -1) throw new Error(`Production order ${id} not found`);
      orders[idx].status = status;
      mockDb.setProductionOrders(orders);
      return orders[idx];
    }
  },

  async getLogs(orderId?: string): Promise<ProductionLog[]> {
    try {
      const url = orderId ? `/production/logs?orderId=${orderId}` : '/production/logs';
      const response = await apiClient.get<ProductionLog[]>(url);
      return response.data;
    } catch {
      await simulateLatency(150);
      const logs = mockDb.getProductionLogs();
      if (orderId) {
        return logs.filter((l) => l.productionOrderId === orderId);
      }
      return logs;
    }
  },

  async addLog(log: Omit<ProductionLog, 'logId' | 'timestamp'>): Promise<ProductionLog> {
    try {
      const response = await apiClient.post<ProductionLog>('/production/logs', log);
      return response.data;
    } catch {
      await simulateLatency(250);
      const logs = mockDb.getProductionLogs();
      const orders = mockDb.getProductionOrders();
      const newId = `LOG-${String(logs.length + 1).padStart(3, '0')}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newLog: ProductionLog = {
        ...log,
        logId: newId,
        timestamp: nowStr,
      };
      mockDb.setProductionLogs([newLog, ...logs]);

      // Update produced quantity in the Production Order
      const orderIdx = orders.findIndex((o) => o.productionOrderId === log.productionOrderId);
      if (orderIdx !== -1) {
        const order = orders[orderIdx];
        const newProduced = order.producedQuantity + log.quantityProduced;
        order.producedQuantity = newProduced;
        if (newProduced >= order.quantity) {
          order.status = 'COMPLETED';

          // When completed, auto-increment inventory & log transaction
          const inventory = mockDb.getInventory();
          const txns = mockDb.getStockTransactions();
          const invIdx = inventory.findIndex((i) => i.productId === order.productId);
          if (invIdx !== -1) {
            inventory[invIdx].quantity += order.quantity;
            inventory[invIdx].stockStatus = 'IN_STOCK';
            mockDb.setInventory(inventory);

            const newTxn: StockTransaction = {
              transactionId: `TXN-${Date.now().toString().slice(-4)}`,
              productId: order.productId,
              productName: order.productName,
              warehouseId: inventory[invIdx].warehouseId,
              warehouseName: inventory[invIdx].warehouseName,
              transactionType: 'PRODUCTION',
              quantity: order.quantity,
              date: nowStr,
              reference: order.productionOrderId,
              notes: `Completed on ${order.machineName}`,
            };
            txns.unshift(newTxn);
            mockDb.setStockTransactions(txns);
          }
        } else if (order.status === 'PLANNED') {
          order.status = 'IN_PROGRESS';
        }
        mockDb.setProductionOrders(orders);
      }

      return newLog;
    }
  },
};
