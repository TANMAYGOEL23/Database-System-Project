import { apiClient, simulateLatency } from './api';
import { Warehouse, Shelf } from '../types/inventory';
import { mockDb } from './mockStorage';

export const warehouseService = {
  async getAllWarehouses(): Promise<Warehouse[]> {
    try {
      const response = await apiClient.get<Warehouse[]>('/warehouses');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getWarehouses();
    }
  },

  async getShelves(): Promise<Shelf[]> {
    try {
      const response = await apiClient.get<Shelf[]>('/warehouses/shelves');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getShelves();
    }
  },

  async createWarehouse(warehouse: Omit<Warehouse, 'warehouseId' | 'currentOccupancy'>): Promise<Warehouse> {
    try {
      const response = await apiClient.post<Warehouse>('/warehouses', warehouse);
      return response.data;
    } catch {
      await simulateLatency(250);
      const warehouses = mockDb.getWarehouses();
      const newId = `WAR${String(warehouses.length + 1).padStart(3, '0')}`;
      const newWh: Warehouse = {
        ...warehouse,
        warehouseId: newId,
        currentOccupancy: 0,
      };
      mockDb.setWarehouses([...warehouses, newWh]);
      return newWh;
    }
  },

  async createShelf(shelf: Omit<Shelf, 'shelfId'>): Promise<Shelf> {
    try {
      const response = await apiClient.post<Shelf>('/warehouses/shelves', shelf);
      return response.data;
    } catch {
      await simulateLatency(200);
      const shelves = mockDb.getShelves();
      const newId = `SHF${String(shelves.length + 1).padStart(3, '0')}`;
      const newShelf: Shelf = {
        ...shelf,
        shelfId: newId,
        rfidTag: shelf.rfidTag || `RFID-SHELF-${shelf.row}${shelf.column}`,
      };
      mockDb.setShelves([...shelves, newShelf]);
      return newShelf;
    }
  },

  async deleteShelf(shelfId: string): Promise<void> {
    try {
      await apiClient.delete(`/warehouses/shelves/${shelfId}`);
    } catch {
      await simulateLatency(150);
      const shelves = mockDb.getShelves();
      mockDb.setShelves(shelves.filter((s) => s.shelfId !== shelfId));
    }
  },
};
