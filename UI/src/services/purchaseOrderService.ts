import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { PurchaseOrder, PurchaseOrderStatus, StockTransaction } from '../types/inventory';

function mapPOFromDb(row: any, items: any[] = []): PurchaseOrder {
  return {
    poId: row.po_id || row.poId,
    supplierId: row.supplier_id || row.supplierId,
    supplierName: row.supplier_name || row.supplierName,
    orderDate: row.order_date || row.orderDate,
    expectedDeliveryDate: row.expected_delivery_date || row.expectedDeliveryDate,
    status: row.status,
    subtotal: parseFloat(row.subtotal || 0),
    tax: parseFloat(row.tax || 0),
    totalAmount: parseFloat(row.total_amount || row.totalAmount || 0),
    notes: row.notes,
    items: items.map((itm) => ({
      poItemId: itm.po_item_id || itm.poItemId,
      productId: itm.product_id || itm.productId,
      productName: itm.product_name || itm.productName,
      quantity: parseInt(itm.quantity || 1, 10),
      unitPrice: parseFloat(itm.unit_price || itm.unitPrice || 0),
      subtotal: parseFloat(itm.subtotal || 0),
      tax: parseFloat(itm.tax || 0),
    })),
  };
}

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    if (isSupabaseConfigured()) {
      const { data: pos, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      const { data: allItems } = await supabase.from('purchase_order_items').select('*');

      return (pos || []).map((po) => {
        const matchingItems = (allItems || []).filter((i) => i.po_id === po.po_id);
        return mapPOFromDb(po, matchingItems);
      });
    }

    await delay(250);
    return mockStorage.purchaseOrders;
  },

  async create(po: Omit<PurchaseOrder, 'poId' | 'totalAmount' | 'subtotal' | 'tax'>): Promise<PurchaseOrder> {
    const subtotal = po.items.reduce((sum, itm) => sum + itm.subtotal, 0);
    const tax = subtotal * 0.18;
    const totalAmount = subtotal + tax;

    if (isSupabaseConfigured()) {
      const poPayload = {
        supplier_id: po.supplierId,
        supplier_name: po.supplierName,
        order_date: po.orderDate,
        expected_delivery_date: po.expectedDeliveryDate,
        status: po.status || 'PENDING',
        subtotal,
        tax,
        total_amount: totalAmount,
        notes: po.notes,
      };

      const { data: createdPO, error: poErr } = await supabase.from('purchase_orders').insert([poPayload]).select().single();
      if (poErr) throw new Error(poErr.message);

      const itemsPayload = po.items.map((itm) => ({
        po_id: createdPO.po_id,
        product_id: itm.productId,
        product_name: itm.productName,
        quantity: itm.quantity,
        unit_price: itm.unitPrice,
        subtotal: itm.subtotal,
        tax: itm.tax || itm.subtotal * 0.18,
      }));

      const { data: createdItems, error: itmErr } = await supabase.from('purchase_order_items').insert(itemsPayload).select();
      if (itmErr) throw new Error(itmErr.message);

      return mapPOFromDb(createdPO, createdItems || []);
    }

    await delay(350);
    const newPO: PurchaseOrder = {
      ...po,
      poId: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal,
      tax,
      totalAmount,
    };
    mockStorage.purchaseOrders = [newPO, ...mockStorage.purchaseOrders];
    return newPO;
  },

  async updateStatus(poId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    if (isSupabaseConfigured()) {
      const { data: updatedPO, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('po_id', poId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { data: items } = await supabase.from('purchase_order_items').select('*').eq('po_id', poId);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      if (status === 'RECEIVED' && items) {
        for (const item of items) {
          const { data: invItem } = await supabase.from('inventory').select('*').eq('product_id', item.product_id).single();
          if (invItem) {
            const newQty = invItem.quantity + item.quantity;
            await supabase.from('inventory').update({ quantity: newQty, stock_status: 'IN_STOCK', last_updated: nowStr }).eq('inventory_id', invItem.inventory_id);

            await supabase.from('stock_transactions').insert([
              {
                product_id: item.product_id,
                product_name: item.product_name,
                warehouse_id: invItem.warehouse_id,
                warehouse_name: invItem.warehouse_name,
                transaction_type: 'PURCHASE',
                quantity: item.quantity,
                date: nowStr,
                reference: poId,
                notes: `Goods Receipt from ${updatedPO.supplier_name}`,
              },
            ]);
          }
        }
      }

      return mapPOFromDb(updatedPO, items || []);
    }

    await delay(300);
    const orders = mockStorage.purchaseOrders;
    const idx = orders.findIndex((o) => o.poId === poId);
    if (idx === -1) throw new Error(`PO ${poId} not found`);

    orders[idx].status = status;

    if (status === 'RECEIVED') {
      const inventory = mockStorage.inventory;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      orders[idx].items.forEach((item) => {
        const invIdx = inventory.findIndex((inv) => inv.productId === item.productId);
        if (invIdx !== -1) {
          inventory[invIdx].quantity += item.quantity;
          inventory[invIdx].stockStatus = 'IN_STOCK';
          inventory[invIdx].lastUpdated = nowStr;

          const newTxn: StockTransaction = {
            transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            productId: item.productId,
            productName: item.productName,
            warehouseId: inventory[invIdx].warehouseId,
            warehouseName: inventory[invIdx].warehouseName,
            transactionType: 'PURCHASE',
            quantity: item.quantity,
            date: nowStr,
            reference: poId,
            notes: `Goods Receipt from ${orders[idx].supplierName}`,
          };
          mockStorage.stockTransactions = [newTxn, ...mockStorage.stockTransactions];
        }
      });
      mockStorage.inventory = inventory;
    }

    mockStorage.purchaseOrders = orders;
    return orders[idx];
  },
};
