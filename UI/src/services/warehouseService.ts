import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Warehouse, Shelf } from '../types/inventory';

function mapWarehouseFromDb(row: any): Warehouse {
  return {
    warehouseId: row.warehouse_id || row.warehouseId,
    warehouseName: row.warehouse_name || row.warehouseName,
    location: row.location,
    capacity: parseInt(row.capacity || 1000, 10),
    currentOccupancy: parseInt(row.current_occupancy || row.currentOccupancy || 0, 10),
    numberOfShelves: parseInt(row.number_of_shelves || row.numberOfShelves || 12, 10),
    inventoryValue: parseFloat(row.inventory_value || row.inventoryValue || 0),
    status: row.status,
  };
}

function mapShelfFromDb(row: any): Shelf {
  return {
    shelfId: row.shelf_id || row.shelfId,
    warehouseId: row.warehouse_id || row.warehouseId,
    warehouseName: row.warehouse_name || row.warehouseName,
    row: row.shelf_row || row.row,
    column: row.shelf_column || row.column || row.col,
    rfidTag: row.rfid_tag || row.rfidTag,
    capacity: parseInt(row.capacity || 50, 10),
    occupied: parseInt(row.occupied || 0, 10),
  };
}

export const warehouseService = {
  async getAllWarehouses(): Promise<Warehouse[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('warehouses').select('*').order('warehouse_id');
      if (error) throw new Error(error.message);
      return (data || []).map(mapWarehouseFromDb);
    }

    await delay(200);
    return mockStorage.warehouses;
  },

  async getAllShelves(): Promise<Shelf[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('shelves').select('*').order('shelf_id');
      if (error) throw new Error(error.message);
      return (data || []).map(mapShelfFromDb);
    }

    await delay(200);
    return mockStorage.shelves;
  },
};
