import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { InventoryItem, StockTransaction } from '../types/inventory';

function mapInventoryFromDb(row: any): InventoryItem {
  return {
    inventoryId: row.inventory_id || row.inventoryId,
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    category: row.category,
    unit: row.unit,
    warehouseId: row.warehouse_id || row.warehouseId,
    warehouseName: row.warehouse_name || row.warehouseName,
    shelfId: row.shelf_id || row.shelfId,
    quantity: parseInt(row.quantity || 0, 10),
    minStock: parseInt(row.min_stock || row.minStock || 10, 10),
    maxStock: parseInt(row.max_stock || row.maxStock || 100, 10),
    stockStatus: row.stock_status || row.stockStatus || 'IN_STOCK',
    lastUpdated: row.last_updated || row.lastUpdated,
  };
}

function mapTxnFromDb(row: any): StockTransaction {
  return {
    transactionId: row.transaction_id || row.transactionId,
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    warehouseId: row.warehouse_id || row.warehouseId,
    warehouseName: row.warehouse_name || row.warehouseName,
    transactionType: row.transaction_type || row.transactionType,
    quantity: parseInt(row.quantity || 0, 10),
    date: row.date,
    reference: row.reference,
    notes: row.notes,
  };
}

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('inventory').select('*').order('product_name');
      if (error) throw new Error(error.message);
      return (data || []).map(mapInventoryFromDb);
    }

    await delay(200);
    return mockStorage.inventory;
  },

  async adjustStock(inventoryId: string, newQuantity: number, reason: string): Promise<InventoryItem> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isSupabaseConfigured()) {
      const { data: item } = await supabase.from('inventory').select('*').eq('inventory_id', inventoryId).single();
      if (!item) throw new Error(`Inventory item ${inventoryId} not found`);

      const oldQty = item.quantity;
      const diff = newQuantity - oldQty;
      const stockStatus = newQuantity === 0 ? 'OUT_OF_STOCK' : newQuantity <= item.min_stock ? 'LOW_STOCK' : 'IN_STOCK';

      const { data: updated, error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity, stock_status: stockStatus, last_updated: nowStr })
        .eq('inventory_id', inventoryId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Record transaction
      await supabase.from('stock_transactions').insert([
        {
          product_id: item.product_id,
          product_name: item.product_name,
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouse_name,
          transaction_type: 'ADJUSTMENT',
          quantity: diff,
          date: nowStr,
          reference: 'ADJ-MANUAL',
          notes: reason || 'Manual stock reconciliation',
        },
      ]);

      return mapInventoryFromDb(updated);
    }

    await delay(300);
    const items = mockStorage.inventory;
    const idx = items.findIndex((i) => i.inventoryId === inventoryId);
    if (idx === -1) throw new Error(`Inventory item ${inventoryId} not found`);

    const oldQty = items[idx].quantity;
    const diff = newQuantity - oldQty;
    items[idx].quantity = newQuantity;
    items[idx].stockStatus = newQuantity === 0 ? 'OUT_OF_STOCK' : newQuantity <= items[idx].minStock ? 'LOW_STOCK' : 'IN_STOCK';
    items[idx].lastUpdated = nowStr;

    mockStorage.inventory = items;

    const newTxn: StockTransaction = {
      transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: items[idx].productId,
      productName: items[idx].productName,
      warehouseId: items[idx].warehouseId,
      warehouseName: items[idx].warehouseName,
      transactionType: 'ADJUSTMENT',
      quantity: diff,
      date: items[idx].lastUpdated,
      reference: `ADJ-MANUAL`,
      notes: reason || 'Manual stock reconciliation',
    };
    mockStorage.stockTransactions = [newTxn, ...mockStorage.stockTransactions];

    return items[idx];
  },

  async getTransactions(): Promise<StockTransaction[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('stock_transactions').select('*').order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapTxnFromDb);
    }

    await delay(200);
    return mockStorage.stockTransactions;
  },
};
