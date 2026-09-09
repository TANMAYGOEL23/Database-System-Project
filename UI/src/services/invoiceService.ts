import { apiClient, simulateLatency } from './api';
import { Invoice } from '../types/sales';
import { StockTransaction } from '../types/inventory';
import { mockDb } from './mockStorage';

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    try {
      const response = await apiClient.get<Invoice[]>('/invoices');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getInvoices();
    }
  },

  async create(invoice: Omit<Invoice, 'invoiceId' | 'subtotal' | 'tax' | 'totalAmount'>): Promise<Invoice> {
    try {
      const response = await apiClient.post<Invoice>('/invoices', invoice);
      return response.data;
    } catch {
      await simulateLatency(300);
      const invoices = mockDb.getInvoices();
      const inventory = mockDb.getInventory();
      const txns = mockDb.getStockTransactions();

      const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxRate = invoice.taxRate || 18;
      const tax = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + tax;

      const newId = `INV-2026-${String(invoices.length + 44).padStart(3, '0')}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newInvoice: Invoice = {
        ...invoice,
        invoiceId: newId,
        taxRate,
        subtotal,
        tax,
        totalAmount,
        items: invoice.items.map((item, idx) => ({
          ...item,
          invoiceItemId: `INI-${newId}-${idx + 1}`,
          total: item.quantity * item.unitPrice,
        })),
      };

      // Create SALE transactions & deduct inventory
      invoice.items.forEach((item) => {
        const invIdx = inventory.findIndex((i) => i.productId === item.productId);
        if (invIdx !== -1) {
          inventory[invIdx].quantity = Math.max(0, inventory[invIdx].quantity - item.quantity);
          if (inventory[invIdx].quantity === 0) inventory[invIdx].stockStatus = 'OUT_OF_STOCK';
          else if (inventory[invIdx].quantity <= inventory[invIdx].minStock) inventory[invIdx].stockStatus = 'LOW_STOCK';
          inventory[invIdx].lastUpdated = nowStr;

          const saleTxn: StockTransaction = {
            transactionId: `TXN-${Date.now().toString().slice(-4)}`,
            productId: item.productId,
            productName: item.productName,
            warehouseId: inventory[invIdx].warehouseId,
            warehouseName: inventory[invIdx].warehouseName,
            transactionType: 'SALE',
            quantity: -item.quantity,
            date: nowStr,
            reference: newId,
            notes: `Dispatched to ${invoice.customerName}`,
          };
          txns.unshift(saleTxn);
        }
      });

      mockDb.setInventory(inventory);
      mockDb.setStockTransactions(txns);
      mockDb.setInvoices([newInvoice, ...invoices]);
      return newInvoice;
    }
  },

  async updateStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    try {
      const response = await apiClient.patch<Invoice>(`/invoices/${id}/status`, { status });
      return response.data;
    } catch {
      await simulateLatency(150);
      const invoices = mockDb.getInvoices();
      const idx = invoices.findIndex((i) => i.invoiceId === id);
      if (idx === -1) throw new Error(`Invoice ${id} not found`);
      invoices[idx].status = status;
      if (status === 'PAID') {
        invoices[idx].paidAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
      mockDb.setInvoices(invoices);
      return invoices[idx];
    }
  },
};
