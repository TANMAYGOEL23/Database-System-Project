import { apiClient, simulateLatency } from './api';
import { Product } from '../types/inventory';
import { mockDb } from './mockStorage';

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getProducts();
    }
  },

  async getById(id: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const products = mockDb.getProducts();
      const prd = products.find((p) => p.productId === id);
      if (!prd) throw new Error(`Product ${id} not found`);
      return prd;
    }
  },

  async create(product: Omit<Product, 'productId'>): Promise<Product> {
    try {
      const response = await apiClient.post<Product>('/products', product);
      return response.data;
    } catch {
      await simulateLatency(250);
      const products = mockDb.getProducts();
      const newId = `PRD${String(products.length + 1).padStart(3, '0')}`;
      const newProduct: Product = {
        ...product,
        productId: newId,
        totalStock: product.totalStock || 0,
      };
      mockDb.setProducts([newProduct, ...products]);
      return newProduct;
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(200);
      const products = mockDb.getProducts();
      const index = products.findIndex((p) => p.productId === id);
      if (index === -1) throw new Error(`Product ${id} not found`);
      products[index] = { ...products[index], ...updates };
      mockDb.setProducts(products);
      return products[index];
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      await simulateLatency(200);
      const products = mockDb.getProducts();
      mockDb.setProducts(products.filter((p) => p.productId !== id));
    }
  },
};
