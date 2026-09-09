import { apiClient, simulateLatency } from './api';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { mockDb } from './mockStorage';

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<InventoryItem[]>('/inventory');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getInventory();
    }
  },

  async getTransactions(): Promise<StockTransaction[]> {
    try {
      const response = await apiClient.get<StockTransaction[]>('/inventory/transactions');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getStockTransactions();
    }
  },

  async updateStock(
    inventoryId: string,
    deltaQuantity: number,
    transactionType: StockTransaction['transactionType'],
    reference: string,
    notes?: string
  ): Promise<InventoryItem> {
    try {
      const response = await apiClient.post<InventoryItem>(`/inventory/${inventoryId}/adjust`, {
        deltaQuantity,
        transactionType,
        reference,
        notes,
      });
      return response.data;
    } catch {
      await simulateLatency(250);
      const inventory = mockDb.getInventory();
      const transactions = mockDb.getStockTransactions();
      const index = inventory.findIndex((i) => i.inventoryId === inventoryId);
      if (index === -1) throw new Error(`Inventory item ${inventoryId} not found`);

      const item = inventory[index];
      const newQty = Math.max(0, item.quantity + deltaQuantity);
      
      let stockStatus: InventoryItem['stockStatus'] = 'IN_STOCK';
      if (newQty === 0) stockStatus = 'OUT_OF_STOCK';
      else if (newQty <= item.minStock) stockStatus = 'LOW_STOCK';

      const updatedItem: InventoryItem = {
        ...item,
        quantity: newQty,
        stockStatus,
        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      inventory[index] = updatedItem;
      mockDb.setInventory(inventory);

      // Create Stock Transaction
      const newTxn: StockTransaction = {
        transactionId: `TXN-${Date.now().toString().slice(-4)}`,
        productId: item.productId,
        productName: item.productName,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        transactionType,
        quantity: deltaQuantity,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        reference,
        notes,
      };
      mockDb.setStockTransactions([newTxn, ...transactions]);

      return updatedItem;
    }
  },

  async createInventoryItem(item: Omit<InventoryItem, 'inventoryId' | 'stockStatus' | 'lastUpdated'>): Promise<InventoryItem> {
    try {
      const response = await apiClient.post<InventoryItem>('/inventory', item);
      return response.data;
    } catch {
      await simulateLatency(250);
      const inventory = mockDb.getInventory();
      const newId = `INV${String(inventory.length + 1).padStart(3, '0')}`;
      let stockStatus: InventoryItem['stockStatus'] = 'IN_STOCK';
      if (item.quantity === 0) stockStatus = 'OUT_OF_STOCK';
      else if (item.quantity <= item.minStock) stockStatus = 'LOW_STOCK';

      const newItem: InventoryItem = {
        ...item,
        inventoryId: newId,
        stockStatus,
        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      mockDb.setInventory([newItem, ...inventory]);
      return newItem;
    }
  },
};
