export interface Customer {
  customerId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  totalPurchases?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface InvoiceItem {
  invoiceItemId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number; // 18% standard industrial GST
  taxRate: number;
  totalAmount: number;
  items: InvoiceItem[];
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
}
