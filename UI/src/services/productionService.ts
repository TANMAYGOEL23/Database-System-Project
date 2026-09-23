import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Machine, ProductionOrder, ProductionLog, MachineStatus } from '../types/production';

function mapMachineFromDb(row: any): Machine {
  return {
    machineId: row.machine_id || row.machineId,
    machineName: row.machine_name || row.machineName,
    model: row.model,
    location: row.location,
    status: row.status,
    efficiency: parseFloat(row.efficiency || 95),
    temperature: parseFloat(row.temperature || 35),
    powerUsage: parseFloat(row.power_usage || row.powerUsage || 20),
    lastMaintenance: row.last_maintenance || row.lastMaintenance,
  };
}

function mapOrderFromDb(row: any): ProductionOrder {
  return {
    productionOrderId: row.production_order_id || row.productionOrderId,
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    machineId: row.machine_id || row.machineId,
    machineName: row.machine_name || row.machineName,
    quantity: parseInt(row.quantity || 0, 10),
    producedQuantity: parseInt(row.produced_quantity || row.producedQuantity || 0, 10),
    startDate: row.start_date || row.startDate,
    endDate: row.end_date || row.endDate,
    status: row.status,
    priority: row.priority,
    assignedOperatorId: row.assigned_operator_id || row.assignedOperatorId,
    assignedOperatorName: row.assigned_operator_name || row.assignedOperatorName,
    notes: row.notes,
  };
}

function mapLogFromDb(row: any): ProductionLog {
  return {
    logId: row.log_id || row.logId,
    productionOrderId: row.production_order_id || row.productionOrderId,
    timestamp: row.timestamp,
    quantityProduced: parseInt(row.quantity_produced || row.quantityProduced || 0, 10),
    status: row.status,
    remarks: row.remarks,
    operatorName: row.operator_name || row.operatorName,
  };
}

export const productionService = {
  async getMachines(): Promise<Machine[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('machines').select('*').order('machine_id');
      if (error) throw new Error(error.message);
      return (data || []).map(mapMachineFromDb);
    }

    await delay(200);
    return mockStorage.machines;
  },

  async updateMachineStatus(machineId: string, status: MachineStatus): Promise<Machine> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('machines').update({ status }).eq('machine_id', machineId).select().single();
      if (error) throw new Error(error.message);
      return mapMachineFromDb(data);
    }

    await delay(250);
    const list = mockStorage.machines;
    const idx = list.findIndex((m) => m.machineId === machineId);
    if (idx === -1) throw new Error(`Machine ${machineId} not found`);
    list[idx].status = status;
    mockStorage.machines = list;
    return list[idx];
  },

  async getOrders(): Promise<ProductionOrder[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('production_orders').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapOrderFromDb);
    }

    await delay(200);
    return mockStorage.productionOrders;
  },

  async getOrderById(id: string): Promise<ProductionOrder> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('production_orders').select('*').eq('production_order_id', id).single();
      if (error) throw new Error(error.message);
      return mapOrderFromDb(data);
    }

    await delay(150);
    const o = mockStorage.productionOrders.find((ord) => ord.productionOrderId === id);
    if (!o) throw new Error(`Order ${id} not found`);
    return o;
  },

  async createOrder(order: Omit<ProductionOrder, 'productionOrderId' | 'producedQuantity'>): Promise<ProductionOrder> {
    if (isSupabaseConfigured()) {
      const payload = {
        product_id: order.productId,
        product_name: order.productName,
        machine_id: order.machineId,
        machine_name: order.machineName,
        quantity: order.quantity,
        produced_quantity: 0,
        start_date: order.startDate,
        end_date: order.endDate,
        status: order.status || 'PLANNED',
        priority: order.priority || 'MEDIUM',
        assigned_operator_id: order.assignedOperatorId,
        assigned_operator_name: order.assignedOperatorName,
        notes: order.notes,
      };

      const { data, error } = await supabase.from('production_orders').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapOrderFromDb(data);
    }

    await delay(300);
    const newOrd: ProductionOrder = {
      ...order,
      productionOrderId: `WO-MFG-${Math.floor(1000 + Math.random() * 9000)}`,
      producedQuantity: 0,
    };
    mockStorage.productionOrders = [newOrd, ...mockStorage.productionOrders];
    return newOrd;
  },

  async getLogs(orderId?: string): Promise<ProductionLog[]> {
    if (isSupabaseConfigured()) {
      let query = supabase.from('production_logs').select('*').order('timestamp', { ascending: false });
      if (orderId) query = query.eq('production_order_id', orderId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapLogFromDb);
    }

    await delay(200);
    const logs = mockStorage.productionLogs;
    return orderId ? logs.filter((l) => l.productionOrderId === orderId) : logs;
  },

  async addLog(log: Omit<ProductionLog, 'logId' | 'timestamp'>): Promise<ProductionLog> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isSupabaseConfigured()) {
      const logPayload = {
        production_order_id: log.productionOrderId,
        timestamp: nowStr,
        quantity_produced: log.quantityProduced,
        status: log.status,
        remarks: log.remarks,
        operator_name: log.operatorName || 'Floor Supervisor',
      };

      const { data: createdLog, error } = await supabase.from('production_logs').insert([logPayload]).select().single();
      if (error) throw new Error(error.message);

      // Update Order
      const { data: ord } = await supabase.from('production_orders').select('*').eq('production_order_id', log.productionOrderId).single();
      if (ord) {
        const newProduced = (ord.produced_quantity || 0) + log.quantityProduced;
        const newStatus = newProduced >= ord.quantity ? 'COMPLETED' : 'IN_PROGRESS';
        await supabase.from('production_orders').update({ produced_quantity: newProduced, status: newStatus }).eq('production_order_id', log.productionOrderId);

        if (newStatus === 'COMPLETED' && ord.product_id) {
          const { data: inv } = await supabase.from('inventory').select('*').eq('product_id', ord.product_id).single();
          if (inv) {
            await supabase.from('inventory').update({ quantity: inv.quantity + ord.quantity, stock_status: 'IN_STOCK', last_updated: nowStr }).eq('inventory_id', inv.inventory_id);

            await supabase.from('stock_transactions').insert([
              {
                product_id: ord.product_id,
                product_name: ord.product_name,
                warehouse_id: inv.warehouse_id,
                warehouse_name: inv.warehouse_name,
                transaction_type: 'PRODUCTION',
                quantity: ord.quantity,
                date: nowStr,
                reference: ord.production_order_id,
                notes: `Completed production run on ${ord.machine_name}`,
              },
            ]);
          }
        }
      }

      return mapLogFromDb(createdLog);
    }

    await delay(300);
    const newLog: ProductionLog = {
      ...log,
      logId: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: nowStr,
    };
    mockStorage.productionLogs = [newLog, ...mockStorage.productionLogs];

    const orders = mockStorage.productionOrders;
    const oIdx = orders.findIndex((o) => o.productionOrderId === log.productionOrderId);
    if (oIdx !== -1) {
      orders[oIdx].producedQuantity += log.quantityProduced;
      if (orders[oIdx].producedQuantity >= orders[oIdx].quantity) {
        orders[oIdx].status = 'COMPLETED';
        const inventory = mockStorage.inventory;
        const invIdx = inventory.findIndex((i) => i.productId === orders[oIdx].productId);
        if (invIdx !== -1) {
          inventory[invIdx].quantity += orders[oIdx].quantity;
          inventory[invIdx].stockStatus = 'IN_STOCK';
          inventory[invIdx].lastUpdated = nowStr;
          const newTxn = {
            transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            productId: orders[oIdx].productId,
            productName: orders[oIdx].productName,
            warehouseId: inventory[invIdx].warehouseId,
            warehouseName: inventory[invIdx].warehouseName,
            transactionType: 'PRODUCTION' as const,
            quantity: orders[oIdx].quantity,
            date: nowStr,
            reference: orders[oIdx].productionOrderId,
            notes: `Completed production run on ${orders[oIdx].machineName}`,
          };
          mockStorage.stockTransactions = [newTxn, ...mockStorage.stockTransactions];
        }
        mockStorage.inventory = inventory;
      } else {
        orders[oIdx].status = 'IN_PROGRESS';
      }
      mockStorage.productionOrders = orders;
    }

    return newLog;
  },
};
