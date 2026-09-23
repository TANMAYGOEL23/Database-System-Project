import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Invoice, InvoiceStatus } from '../types/sales';
import { StockTransaction } from '../types/inventory';

function mapInvoiceFromDb(row: any, items: any[] = []): Invoice {
  return {
    invoiceId: row.invoice_id || row.invoiceId,
    customerId: row.customer_id || row.customerId,
    customerName: row.customer_name || row.customerName,
    invoiceDate: row.invoice_date || row.invoiceDate,
    dueDate: row.due_date || row.dueDate,
    status: row.status,
    subtotal: parseFloat(row.subtotal || 0),
    tax: parseFloat(row.tax || 0),
    taxRate: parseFloat(row.tax_rate || row.taxRate || 18),
    totalAmount: parseFloat(row.total_amount || row.totalAmount || 0),
    paidAt: row.paid_at || row.paidAt,
    notes: row.notes,
    items: items.map((itm) => ({
      invoiceItemId: itm.invoice_item_id || itm.invoiceItemId,
      productId: itm.product_id || itm.productId,
      productName: itm.product_name || itm.productName,
      quantity: parseInt(itm.quantity || 1, 10),
      unitPrice: parseFloat(itm.unit_price || itm.unitPrice || 0),
      total: parseFloat(itm.total || 0),
    })),
  };
}

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    if (isSupabaseConfigured()) {
      const { data: invs, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      const { data: allItems } = await supabase.from('invoice_items').select('*');

      return (invs || []).map((inv) => {
        const matching = (allItems || []).filter((i) => i.invoice_id === inv.invoice_id);
        return mapInvoiceFromDb(inv, matching);
      });
    }

    await delay(250);
    return mockStorage.invoices;
  },

  async create(invoice: Omit<Invoice, 'invoiceId' | 'totalAmount' | 'subtotal' | 'tax'>): Promise<Invoice> {
    const subtotal = invoice.items.reduce((s, itm) => s + itm.total, 0);
    const taxRate = invoice.taxRate || 18;
    const tax = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + tax;

    if (isSupabaseConfigured()) {
      const invPayload = {
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate,
        status: invoice.status || 'UNPAID',
        subtotal,
        tax,
        tax_rate: taxRate,
        total_amount: totalAmount,
        notes: invoice.notes,
      };

      const { data: createdInv, error: invErr } = await supabase.from('invoices').insert([invPayload]).select().single();
      if (invErr) throw new Error(invErr.message);

      const itemsPayload = invoice.items.map((itm) => ({
        invoice_id: createdInv.invoice_id,
        product_id: itm.productId,
        product_name: itm.productName,
        quantity: itm.quantity,
        unit_price: itm.unitPrice,
        total: itm.total,
      }));

      const { data: createdItems, error: itmErr } = await supabase.from('invoice_items').insert(itemsPayload).select();
      if (itmErr) throw new Error(itmErr.message);

      // Deduct stock
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      for (const item of invoice.items) {
        const { data: invItem } = await supabase.from('inventory').select('*').eq('product_id', item.productId).single();
        if (invItem) {
          const newQty = Math.max(0, invItem.quantity - item.quantity);
          const stockStatus = newQty === 0 ? 'OUT_OF_STOCK' : newQty <= invItem.min_stock ? 'LOW_STOCK' : 'IN_STOCK';
          await supabase.from('inventory').update({ quantity: newQty, stock_status: stockStatus, last_updated: nowStr }).eq('inventory_id', invItem.inventory_id);

          await supabase.from('stock_transactions').insert([
            {
              product_id: item.productId,
              product_name: item.productName,
              warehouse_id: invItem.warehouse_id,
              warehouse_name: invItem.warehouse_name,
              transaction_type: 'SALE',
              quantity: -item.quantity,
              date: nowStr,
              reference: createdInv.invoice_id,
              notes: `Dispatched to ${invoice.customerName}`,
            },
          ]);
        }
      }

      return mapInvoiceFromDb(createdInv, createdItems || []);
    }

    await delay(350);
    const newInv: Invoice = {
      ...invoice,
      invoiceId: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      subtotal,
      tax,
      taxRate,
      totalAmount,
    };
    mockStorage.invoices = [newInv, ...mockStorage.invoices];
    return newInv;
  },

  async updateStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const paidAt = status === 'PAID' ? new Date().toISOString().split('T')[0] : null;

    if (isSupabaseConfigured()) {
      const { data: updated, error } = await supabase
        .from('invoices')
        .update({ status, paid_at: paidAt })
        .eq('invoice_id', invoiceId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
      return mapInvoiceFromDb(updated, items || []);
    }

    await delay(250);
    const invoices = mockStorage.invoices;
    const idx = invoices.findIndex((i) => i.invoiceId === invoiceId);
    if (idx === -1) throw new Error(`Invoice ${invoiceId} not found`);

    invoices[idx].status = status;
    if (status === 'PAID') invoices[idx].paidAt = new Date().toISOString().split('T')[0];
    mockStorage.invoices = invoices;
    return invoices[idx];
  },
};
