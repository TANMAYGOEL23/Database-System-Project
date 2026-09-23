export type ProductUnit = 'PCS' | 'KG' | 'LTR' | 'MTR' | 'BOX' | 'TON' | 'SET';

export interface Product {
  productId: string;
  productName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  barcode: string;
  unit: ProductUnit;
  description?: string;
  totalStock?: number;
}

export interface Warehouse {
  warehouseId: string;
  warehouseName: string;
  location: string;
  capacity: number;
  currentOccupancy?: number;
  numberOfShelves: number;
  inventoryValue: number;
  status: 'ACTIVE' | 'FULL' | 'MAINTENANCE';
}

export interface Shelf {
  shelfId: string;
  warehouseId: string;
  warehouseName?: string;
  row: string;
  column: string;
  rfidTag: string;
  capacity?: number;
  occupied?: number;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  inventoryId: string;
  productId: string;
  productName: string;
  category: string;
  unit: ProductUnit;
  warehouseId: string;
  warehouseName: string;
  shelfId?: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  stockStatus: StockStatus;
  lastUpdated?: string;
}

export interface Supplier {
  supplierId: string;
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  rating?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type PurchaseOrderStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  poItemId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax?: number;
}

export interface PurchaseOrder {
  poId: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
  notes?: string;
}

export type StockTransactionType = 'PURCHASE' | 'PRODUCTION' | 'SALE' | 'ROBOT_MOVEMENT' | 'ADJUSTMENT';

export interface StockTransaction {
  transactionId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  transactionType: StockTransactionType;
  quantity: number;
  date: string;
  reference: string;
  notes?: string;
}
