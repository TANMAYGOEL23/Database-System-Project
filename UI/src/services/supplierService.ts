import { apiClient, simulateLatency } from './api';
import { Supplier } from '../types/inventory';
import { mockDb } from './mockStorage';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    try {
      const response = await apiClient.get<Supplier[]>('/suppliers');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getSuppliers();
    }
  },

  async create(supplier: Omit<Supplier, 'supplierId'>): Promise<Supplier> {
    try {
      const response = await apiClient.post<Supplier>('/suppliers', supplier);
      return response.data;
    } catch {
      await simulateLatency(250);
      const suppliers = mockDb.getSuppliers();
      const newId = `SUP${String(suppliers.length + 1).padStart(3, '0')}`;
      const newSupplier: Supplier = {
        ...supplier,
        supplierId: newId,
        rating: supplier.rating || 5.0,
        status: supplier.status || 'ACTIVE',
      };
      mockDb.setSuppliers([...suppliers, newSupplier]);
      return newSupplier;
    }
  },

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await apiClient.put<Supplier>(`/suppliers/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(200);
      const suppliers = mockDb.getSuppliers();
      const index = suppliers.findIndex((s) => s.supplierId === id);
      if (index === -1) throw new Error(`Supplier ${id} not found`);
      suppliers[index] = { ...suppliers[index], ...updates };
      mockDb.setSuppliers(suppliers);
      return suppliers[index];
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/suppliers/${id}`);
    } catch {
      await simulateLatency(200);
      const suppliers = mockDb.getSuppliers();
      mockDb.setSuppliers(suppliers.filter((s) => s.supplierId !== id));
    }
  },
};
