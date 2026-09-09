import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Eye,
  CheckCircle2,
  DollarSign,
  Calendar,
  X,
  Printer,
  Download,
  Building,
} from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Invoice, InvoiceItem, Customer, InvoiceStatus } from '../../types/sales';
import { Product } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custs[0].customerId);
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Invoices', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCustomerId(customers[0]?.customerId || '');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setNotes('');
    if (products.length > 0) {
      setItems([
        {
          productId: products[0].productId,
          productName: products[0].productName,
          quantity: 5,
          unitPrice: products[0].sellingPrice,
          total: 5 * products[0].sellingPrice,
        },
      ]);
    } else {
      setItems([]);
    }
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const defaultPrd = products[0];
    setItems([
      ...items,
      {
        productId: defaultPrd.productId,
        productName: defaultPrd.productName,
        quantity: 2,
        unitPrice: defaultPrd.sellingPrice,
        total: 2 * defaultPrd.sellingPrice,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'unitPrice', value: any) => {
    const updated = [...items];
    const targetItem = { ...updated[index] };

    if (field === 'productId') {
      const prd = products.find((p) => p.productId === value);
      targetItem.productId = value;
      targetItem.productName = prd ? prd.productName : value;
      targetItem.unitPrice = prd ? prd.sellingPrice : targetItem.unitPrice;
    } else if (field === 'quantity') {
      targetItem.quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === 'unitPrice') {
      targetItem.unitPrice = Math.max(0, parseFloat(value) || 0);
    }

    targetItem.total = targetItem.quantity * targetItem.unitPrice;
    updated[index] = targetItem;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18;
  const totalAmount = subtotal + tax;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('error', 'Validation Error', 'Invoice must have at least one product item');
      return;
    }

    const cust = customers.find((c) => c.customerId === selectedCustomerId);
    if (!cust) return;

    try {
      setIsSubmitting(true);
      const newInv = await invoiceService.create({
        customerId: cust.customerId,
        customerName: cust.customerName,
        invoiceDate,
        dueDate,
        status: 'UNPAID',
        taxRate: 18,
        items,
        notes,
      });

      showToast(
        'success',
        'Sales Invoice Generated',
        `Invoice ${newInv.invoiceId} billed to ${cust.customerName} (Total: ${formatCurrency(newInv.totalAmount)}). Stock inventory updated!`
      );
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Invoice Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const updated = await invoiceService.updateStatus(invoiceId, newStatus);
      showToast('success', 'Payment Status Updated', `Invoice ${invoiceId} marked as ${newStatus}.`);
      loadData();
      if (selectedInvoice && selectedInvoice.invoiceId === invoiceId) {
        setSelectedInvoice(updated);
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceId',
      header: 'Invoice ID',
      sortable: true,
      render: (i) => <span className="font-mono font-semibold text-blue-400">{i.invoiceId}</span>,
    },
    {
      key: 'customerName',
      header: 'Client Customer',
      sortable: true,
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-100">{i.customerName}</div>
          <div className="text-[11px] font-mono text-slate-400">{i.customerId}</div>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Date',
      sortable: true,
      render: (i) => <span className="font-mono text-xs text-slate-300">{formatDate(i.invoiceDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (i) => <span className="font-mono text-xs text-slate-400">{formatDate(i.dueDate)}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Gross ($)',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">
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
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedInvoice(i);
              setIsDetailOpen(true);
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            View Bill
          </Button>

          {i.status !== 'PAID' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleUpdateStatus(i.invoiceId, 'PAID')}
              className="text-xs"
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
        { label: 'Paid', value: 'PAID' },
        { label: 'Unpaid Pending', value: 'UNPAID' },
        { label: 'Overdue Notice', value: 'OVERDUE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sales & Customer Invoices</h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate multi-item commercial tax invoices, track Accounts Receivable (AR), and trigger stock sales dispatch.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Sales Invoice
        </Button>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        rowKey={(i) => i.invoiceId}
        searchKey={(i) => `${i.invoiceId} ${i.customerName} ${i.customerId}`}
        searchPlaceholder="Search invoices by ID, client..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Multi-Item Invoice Creation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Commercial Tax Invoice"
        subtitle="PostgreSQL INVOICE & INVOICE_ITEM entity structure"
        maxWidth="3xl"
        icon={<FileText className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Billed Client Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={customers.map((c) => ({
                label: `${c.customerName} (${c.customerId})`,
                value: c.customerId,
              }))}
              required
            />
            <Input
              label="Invoice Date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Item Lines */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Invoice Products & Quantity ({items.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddItemRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Item Line
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.productName} ({formatCurrency(p.sellingPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 text-right">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Line Total</label>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {formatCurrency(item.total)}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-800 pt-3 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-60 text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-60 text-slate-400">
                <span>Tax (18% Standard GST):</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between w-60 text-sm font-bold text-white pt-1 border-t border-slate-800">
                <span>Total Invoiced Amount:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Input
            label="Payment Memo / Terms"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Net 30 wire transfer terms"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Generate & Dispatch Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail / Printable View Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Tax Invoice: ${selectedInvoice.invoiceId}`}
          subtitle={`Client: ${selectedInvoice.customerName} • Date: ${formatDate(selectedInvoice.invoiceDate)}`}
          maxWidth="2xl"
          icon={<FileText className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">{selectedInvoice.customerName}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Due: {formatDate(selectedInvoice.dueDate)} {selectedInvoice.paidAt ? `• Paid on: ${formatDate(selectedInvoice.paidAt)}` : ''}
                </p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-850 text-slate-400 font-semibold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Product Item</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-200">{item.productName}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-100">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST ({selectedInvoice.taxRate || 18}%):</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-slate-800">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('info', 'Print Invoice', 'Invoice rendered to print spooler.')}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Invoice
                </Button>
                {selectedInvoice.status !== 'PAID' && (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedInvoice.invoiceId, 'PAID')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Mark as Settled
                  </Button>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
