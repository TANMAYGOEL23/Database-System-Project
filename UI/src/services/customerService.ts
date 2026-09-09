import { apiClient, simulateLatency } from './api';
import { Customer } from '../types/sales';
import { mockDb } from './mockStorage';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    try {
      const response = await apiClient.get<Customer[]>('/customers');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getCustomers();
    }
  },

  async create(customer: Omit<Customer, 'customerId'>): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>('/customers', customer);
      return response.data;
    } catch {
      await simulateLatency(250);
      const customers = mockDb.getCustomers();
      const newId = `CUST${String(customers.length + 1).padStart(3, '0')}`;
      const newCustomer: Customer = {
        ...customer,
        customerId: newId,
        totalPurchases: 0,
        status: customer.status || 'ACTIVE',
      };
      mockDb.setCustomers([...customers, newCustomer]);
      return newCustomer;
    }
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>(`/customers/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(200);
      const customers = mockDb.getCustomers();
      const index = customers.findIndex((c) => c.customerId === id);
      if (index === -1) throw new Error(`Customer ${id} not found`);
      customers[index] = { ...customers[index], ...updates };
      mockDb.setCustomers(customers);
      return customers[index];
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/customers/${id}`);
    } catch {
      await simulateLatency(200);
      const customers = mockDb.getCustomers();
      mockDb.setCustomers(customers.filter((c) => c.customerId !== id));
    }
  },
};
