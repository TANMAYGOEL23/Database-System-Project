import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Customer } from '../types/sales';

function mapCustomerFromDb(row: any): Customer {
  return {
    customerId: row.customer_id || row.customerId,
    customerName: row.customer_name || row.customerName,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    gstNumber: row.gst_number || row.gstNumber,
    totalPurchases: parseFloat(row.total_purchases || row.totalPurchases || 0),
    status: row.status,
  };
}

export const customerService = {
  async getAll(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapCustomerFromDb);
    }

    await delay(200);
    return mockStorage.customers;
  },

  async create(customer: Omit<Customer, 'customerId' | 'totalPurchases'>): Promise<Customer> {
    if (isSupabaseConfigured()) {
      const payload = {
        customer_name: customer.customerName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        gst_number: customer.gstNumber,
        total_purchases: 0,
        status: customer.status || 'ACTIVE',
      };
      const { data, error } = await supabase.from('customers').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapCustomerFromDb(data);
    }

    await delay(300);
    const list = mockStorage.customers;
    const newCust: Customer = {
      ...customer,
      customerId: `CUST-${String(list.length + 1).padStart(3, '0')}`,
      totalPurchases: 0,
    };
    mockStorage.customers = [newCust, ...list];
    return newCust;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (customer.customerName) payload.customer_name = customer.customerName;
      if (customer.phone) payload.phone = customer.phone;
      if (customer.email) payload.email = customer.email;
      if (customer.address) payload.address = customer.address;
      if (customer.city !== undefined) payload.city = customer.city;
      if (customer.state !== undefined) payload.state = customer.state;
      if (customer.gstNumber !== undefined) payload.gst_number = customer.gstNumber;
      if (customer.status) payload.status = customer.status;

      const { data, error } = await supabase.from('customers').update(payload).eq('customer_id', id).select().single();
      if (error) throw new Error(error.message);
      return mapCustomerFromDb(data);
    }

    await delay(250);
    const list = mockStorage.customers;
    const idx = list.findIndex((c) => c.customerId === id);
    if (idx === -1) throw new Error(`Customer ${id} not found`);
    list[idx] = { ...list[idx], ...customer };
    mockStorage.customers = list;
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('customers').delete().eq('customer_id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await delay(250);
    mockStorage.customers = mockStorage.customers.filter((c) => c.customerId !== id);
  },
};
