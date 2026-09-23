import React, { useState, useEffect } from 'react';
import { Plus, Receipt, CheckCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Invoice, Customer, InvoiceStatus } from '../../types/sales';
import { Product } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line Item selector
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState('5');

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invs, custs, prods] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
        productService.getAll(),
      ]);
      setInvoices(invs);
      setCustomers(custs);
      setProducts(prods);
      if (custs.length > 0 && !selectedCustId) setSelectedCustId(custs[0].customerId);
      if (prods.length > 0 && !selectedProdId) setSelectedProdId(prods[0].productId);
    } catch (e: any) {
      showToast('error', 'Failed to load invoices', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    const prod = products.find((p) => p.productId === selectedProdId);
    if (!prod) return;
    const qty = parseInt(itemQty, 10) || 1;
    const price = prod.sellingPrice || 180;
    const total = qty * price;

    setItems([...items, {
      productId: prod.productId,
      productName: prod.productName,
      quantity: qty,
      unitPrice: price,
      total,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setItems([]);
    setNotes('');
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('error', 'Line Items Required', 'Please add at least one line item to generate invoice.');
      return;
    }

    const cust = customers.find((c) => c.customerId === selectedCustId);
    if (!cust) return;

    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      await invoiceService.create({
        customerId: cust.customerId,
        customerName: cust.customerName,
        invoiceDate: today,
        dueDate,
        status: 'UNPAID',
        taxRate: parseFloat(taxRate) || 18,
        items,
        notes,
      });

      showToast('success', 'Commercial Invoice Generated', `Invoice billed to ${cust.customerName}. Warehouse stock deducted.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Invoice Creation Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      await invoiceService.updateStatus(invoiceId, status);
      showToast('success', 'Invoice Updated', `Invoice status changed to ${status}.`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Status Update Failed', e.message);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceId',
      header: 'Invoice Code',
      sortable: true,
      render: (i) => <span className="font-mono text-xs font-semibold text-blue-400">{i.invoiceId}</span>,
    },
    {
      key: 'customerName',
      header: 'Billed Enterprise Client',
      sortable: true,
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-100">{i.customerName}</div>
          <div className="text-[11px] font-mono text-slate-400">Account: {i.customerId}</div>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Issue / Due Date',
      sortable: true,
      render: (i) => (
        <div className="font-mono text-xs text-slate-300">
          <div>Billed: {formatDate(i.invoiceDate)}</div>
          <div className="text-[11px] text-slate-400">Due: {formatDate(i.dueDate)}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Billed Line Items',
      render: (i) => (
        <div className="text-xs text-slate-300">
          <span className="font-semibold">{i.items.length} Products</span>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            {i.items.map((itm) => `${itm.productName} (${itm.quantity})`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Invoice Amount ($)',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          {formatCurrency(i.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      sortable: true,
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'Commercial Actions',
      align: 'right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          {i.status !== 'PAID' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(i.invoiceId, 'PAID')}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Payment Status',
      options: [
        { label: 'Unpaid / Pending', value: 'UNPAID' },
        { label: 'Paid & Cleared', value: 'PAID' },
        { label: 'Overdue SLA', value: 'OVERDUE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Accounts Receivable & Commercial Invoices</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sales billing cycles, automatic stock decrement on dispatch, tax calculations, and revenue collections.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Generate Invoice
        </Button>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        rowKey={(i) => i.invoiceId}
        searchKey={(i) => `${i.invoiceId} ${i.customerName} ${i.customerId} ${i.status}`}
        searchPlaceholder="Search invoices by code or client enterprise..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Invoice Generation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Draft Commercial Sales Invoice"
        subtitle="INVOICE & INVOICE_ITEMS ledger transaction"
        maxWidth="lg"
        icon={<Receipt className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Enterprise Client"
              value={selectedCustId}
              onChange={(e) => setSelectedCustId(e.target.value)}
              options={customers.map((c) => ({ label: `${c.customerName} (${c.customerId})`, value: c.customerId }))}
              required
            />
            <Input
              label="Payment Due Date (Net 30)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Line Item Adder */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Add Line Items</h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <Select
                  label="Product SKU"
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  options={products.map((p) => ({ label: `${p.productName} [${formatCurrency(p.sellingPrice)}]`, value: p.productId }))}
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={handleAddItem} className="w-full">
                  Add
                </Button>
              </div>
            </div>

            {/* Item List */}
            {items.length > 0 && (
              <div className="mt-3 border-t border-slate-800 pt-3 space-y-2 max-h-40 overflow-y-auto">
                {items.map((itm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/40 p-2 rounded">
                    <div>
                      <span className="font-semibold text-white">{itm.productName}</span>
                      <span className="text-slate-400 ml-2 font-mono">Qty: {itm.quantity} × {formatCurrency(itm.unitPrice)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(itm.total)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standard Tax Rate (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              required
            />
            <Input
              label="Customer Reference / PO No."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client PO # CAT-99120"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Issue Commercial Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
