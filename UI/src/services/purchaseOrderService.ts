import { apiClient, simulateLatency } from './api';
import { PurchaseOrder, StockTransaction } from '../types/inventory';
import { mockDb } from './mockStorage';

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const response = await apiClient.get<PurchaseOrder[]>('/purchase-orders');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getPurchaseOrders();
    }
  },

  async create(po: Omit<PurchaseOrder, 'poId' | 'subtotal' | 'tax' | 'totalAmount'>): Promise<PurchaseOrder> {
    try {
      const response = await apiClient.post<PurchaseOrder>('/purchase-orders', po);
      return response.data;
    } catch {
      await simulateLatency(300);
      const orders = mockDb.getPurchaseOrders();
      const subtotal = po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * 0.18; // 18% standard GST
      const totalAmount = subtotal + tax;

      const newId = `PO2026-${String(orders.length + 1).padStart(3, '0')}`;
      const newPO: PurchaseOrder = {
        ...po,
        poId: newId,
        subtotal,
        tax,
        totalAmount,
        items: po.items.map((item, idx) => ({
          ...item,
          poItemId: `POI-${newId}-${idx + 1}`,
          subtotal: item.quantity * item.unitPrice,
        })),
      };

      mockDb.setPurchaseOrders([newPO, ...orders]);
      return newPO;
    }
  },

  async updateStatus(id: string, status: PurchaseOrder['status']): Promise<PurchaseOrder> {
    try {
      const response = await apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}/status`, { status });
      return response.data;
    } catch {
      await simulateLatency(250);
      const orders = mockDb.getPurchaseOrders();
      const index = orders.findIndex((o) => o.poId === id);
      if (index === -1) throw new Error(`Purchase order ${id} not found`);

      const prevStatus = orders[index].status;
      orders[index] = { ...orders[index], status };
      mockDb.setPurchaseOrders(orders);

      // If status changed to RECEIVED, simulate stock increment and stock transaction!
      if (status === 'RECEIVED' && prevStatus !== 'RECEIVED') {
        const inventory = mockDb.getInventory();
        const txns = mockDb.getStockTransactions();
        const po = orders[index];

        po.items.forEach((item) => {
          const invIdx = inventory.findIndex((i) => i.productId === item.productId);
          if (invIdx !== -1) {
            inventory[invIdx].quantity += item.quantity;
            inventory[invIdx].stockStatus = inventory[invIdx].quantity <= inventory[invIdx].minStock ? 'LOW_STOCK' : 'IN_STOCK';
            inventory[invIdx].lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 19);

            const newTxn: StockTransaction = {
              transactionId: `TXN-${Date.now().toString().slice(-4)}`,
              productId: item.productId,
              productName: item.productName,
              warehouseId: inventory[invIdx].warehouseId,
              warehouseName: inventory[invIdx].warehouseName,
              transactionType: 'PURCHASE',
              quantity: item.quantity,
              date: new Date().toISOString().replace('T', ' ').substring(0, 19),
              reference: po.poId,
              notes: `Received from supplier ${po.supplierName}`,
            };
            txns.unshift(newTxn);
          }
        });

        mockDb.setInventory(inventory);
        mockDb.setStockTransactions(txns);
      }

      return orders[index];
    }
  },
};
