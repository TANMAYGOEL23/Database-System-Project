import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Product } from '../types/inventory';

function mapProductFromDb(row: any): Product {
  return {
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    category: row.category,
    costPrice: parseFloat(row.cost_price || row.costPrice || 0),
    sellingPrice: parseFloat(row.selling_price || row.sellingPrice || 0),
    barcode: row.barcode,
    unit: row.unit,
    description: row.description,
    totalStock: parseInt(row.total_stock || row.totalStock || 0, 10),
  };
}

export const productService = {
  async getAll(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapProductFromDb);
    }

    await delay(200);
    return mockStorage.products;
  },

  async create(prod: Omit<Product, 'productId' | 'totalStock'>): Promise<Product> {
    const generatedId = `PRD-${prod.category.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    if (isSupabaseConfigured()) {
      const payload = {
        product_id: generatedId,
        product_name: prod.productName,
        category: prod.category,
        cost_price: prod.costPrice,
        selling_price: prod.sellingPrice,
        barcode: prod.barcode,
        unit: prod.unit,
        description: prod.description,
        total_stock: 0,
      };
      const { data, error } = await supabase.from('products').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapProductFromDb(data);
    }

    await delay(300);
    const list = mockStorage.products;
    const newProd: Product = {
      ...prod,
      productId: generatedId,
      totalStock: 0,
    };
    mockStorage.products = [newProd, ...list];
    return newProd;
  },

  async update(id: string, prod: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (prod.productName) payload.product_name = prod.productName;
      if (prod.category) payload.category = prod.category;
      if (prod.costPrice !== undefined) payload.cost_price = prod.costPrice;
      if (prod.sellingPrice !== undefined) payload.selling_price = prod.sellingPrice;
      if (prod.barcode) payload.barcode = prod.barcode;
      if (prod.unit) payload.unit = prod.unit;
      if (prod.description !== undefined) payload.description = prod.description;

      const { data, error } = await supabase.from('products').update(payload).eq('product_id', id).select().single();
      if (error) throw new Error(error.message);
      return mapProductFromDb(data);
    }

    await delay(250);
    const list = mockStorage.products;
    const idx = list.findIndex((p) => p.productId === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);
    list[idx] = { ...list[idx], ...prod };
    mockStorage.products = list;
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('products').delete().eq('product_id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await delay(250);
    mockStorage.products = mockStorage.products.filter((p) => p.productId !== id);
  },
};
