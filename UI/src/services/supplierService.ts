import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Supplier } from '../types/inventory';

function mapSupplierFromDb(row: any): Supplier {
  return {
    supplierId: row.supplier_id || row.supplierId,
    supplierName: row.supplier_name || row.supplierName,
    phone: row.phone,
    email: row.email,
    address: row.address,
    gstNumber: row.gst_number || row.gstNumber,
    rating: parseFloat(row.rating || 5.0),
    status: row.status,
  };
}

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapSupplierFromDb);
    }

    await delay(200);
    return mockStorage.suppliers;
  },

  async create(supplier: Omit<Supplier, 'supplierId'>): Promise<Supplier> {
    if (isSupabaseConfigured()) {
      const payload = {
        supplier_name: supplier.supplierName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        gst_number: supplier.gstNumber,
        rating: supplier.rating || 5.0,
        status: supplier.status || 'ACTIVE',
      };
      const { data, error } = await supabase.from('suppliers').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapSupplierFromDb(data);
    }

    await delay(300);
    const list = mockStorage.suppliers;
    const newSup: Supplier = {
      ...supplier,
      supplierId: `SUP${String(list.length + 1).padStart(3, '0')}`,
    };
    mockStorage.suppliers = [newSup, ...list];
    return newSup;
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (supplier.supplierName) payload.supplier_name = supplier.supplierName;
      if (supplier.phone) payload.phone = supplier.phone;
      if (supplier.email) payload.email = supplier.email;
      if (supplier.address) payload.address = supplier.address;
      if (supplier.gstNumber) payload.gst_number = supplier.gstNumber;
      if (supplier.rating !== undefined) payload.rating = supplier.rating;
      if (supplier.status) payload.status = supplier.status;

      const { data, error } = await supabase.from('suppliers').update(payload).eq('supplier_id', id).select().single();
      if (error) throw new Error(error.message);
      return mapSupplierFromDb(data);
    }

    await delay(250);
    const list = mockStorage.suppliers;
    const idx = list.findIndex((s) => s.supplierId === id);
    if (idx === -1) throw new Error(`Supplier ${id} not found`);
    list[idx] = { ...list[idx], ...supplier };
    mockStorage.suppliers = list;
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('suppliers').delete().eq('supplier_id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await delay(250);
    mockStorage.suppliers = mockStorage.suppliers.filter((s) => s.supplierId !== id);
  },
};
