import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, Edit2, Trash2, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/sales';
import { formatCurrency } from '../../utils/formatters';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Customers', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedCustomer(null);
    setFormData({
      customerName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstNumber: `GST-US-TX-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setIsEditing(true);
    setSelectedCustomer(cust);
    setFormData({
      customerName: cust.customerName,
      phone: cust.phone,
      email: cust.email,
      address: cust.address,
      city: cust.city || '',
      state: cust.state || '',
      gstNumber: cust.gstNumber || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.address.trim()) errors.address = 'Billing address is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (isEditing && selectedCustomer) {
        await customerService.update(selectedCustomer.customerId, formData);
        showToast('success', 'Customer Updated', `${formData.customerName} saved successfully.`);
      } else {
        await customerService.create(formData);
        showToast('success', 'Customer Registered', `${formData.customerName} registered in directory.`);
      }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    try {
      setIsSubmitting(true);
      await customerService.delete(selectedCustomer.customerId);
      showToast('success', 'Customer Removed', `${selectedCustomer.customerName} was deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'customerId',
      header: 'Customer ID',
      sortable: true,
      render: (c) => <span className="font-mono font-semibold text-blue-400">{c.customerId}</span>,
    },
    {
      key: 'customerName',
      header: 'Client Company Name',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-100">{c.customerName}</div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (c) => <span className="font-mono text-xs text-slate-300">{c.phone}</span>,
    },
    {
      key: 'email',
      header: 'Billing Email',
      render: (c) => <span className="font-mono text-xs text-slate-300">{c.email}</span>,
    },
    {
      key: 'gstNumber',
      header: 'Tax ID',
      render: (c) => <span className="font-mono text-xs text-slate-400">{c.gstNumber || '—'}</span>,
    },
    {
      key: 'totalPurchases',
      header: 'Lifetime Order Value',
      sortable: true,
      align: 'right',
      render: (c) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCurrency(c.totalPurchases || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Client"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(c);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise Client & Customer Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain OEM clients, billing contacts, tax identification numbers, and order history.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        rowKey={(c) => c.customerId}
        searchKey={(c) => `${c.customerId} ${c.customerName} ${c.email} ${c.phone}`}
        searchPlaceholder="Search customers by name, ID, email..."
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Customer: ${selectedCustomer?.customerId}` : 'Register New Client'}
        subtitle="PostgreSQL CUSTOMER relational table entity"
        maxWidth="lg"
        icon={<UserCheck className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Company / Client Name"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Tesla Gigafactory Tier 2 Systems"
            error={formErrors.customerName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              error={formErrors.phone}
              required
            />
            <Input
              label="Billing Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="procurement@client.com"
              error={formErrors.email}
              required
            />
          </div>

          <Input
            label="Corporate Billing Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address"
            error={formErrors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Austin"
            />
            <Input
              label="State / Region"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="TX"
            />
            <Input
              label="Tax / GST ID"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              placeholder="GST-US-TX-000000"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.customerName}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
