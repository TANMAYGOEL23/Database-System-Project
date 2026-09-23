import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
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
      showToast('error', 'Error Loading Clients', e.message);
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
      city: 'Chicago',
      state: 'IL',
      gstNumber: `US-EIN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEditing(true);
    setSelectedCustomer(c);
    setFormData({
      customerName: c.customerName,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city || '',
      state: c.state || '',
      gstNumber: c.gstNumber || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.customerName.trim()) errors.customerName = 'Customer client name is required';
    if (!formData.email.trim()) errors.email = 'Valid corporate email is required';
    if (!formData.phone.trim()) errors.phone = 'Contact phone is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        gstNumber: formData.gstNumber,
        status: 'ACTIVE' as const,
      };

      if (isEditing && selectedCustomer) {
        await customerService.update(selectedCustomer.customerId, payload);
        showToast('success', 'Customer Updated', `${formData.customerName} records modified.`);
      } else {
        await customerService.create(payload);
        showToast('success', 'Client Onboarded', `${formData.customerName} registered into commercial CRM.`);
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
      showToast('success', 'Customer Deleted', `${selectedCustomer.customerName} removed.`);
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
      header: 'Client ID',
      sortable: true,
      render: (c) => <span className="font-mono text-xs font-semibold text-blue-400">{c.customerId}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer Enterprise',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {c.customerName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">Tax ID: {c.gstNumber || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Communication',
      render: (c) => (
        <div className="space-y-0.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{c.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Billing Address',
      render: (c) => (
        <span className="text-xs text-slate-300 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {c.address}, {c.city} {c.state}
        </span>
      ),
    },
    {
      key: 'totalPurchases',
      header: 'Cumulative Billing ($)',
      sortable: true,
      align: 'right',
      render: (c) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise Client & Customer Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Commercial account directory, order history volume, billing tax IDs, and corporate shipping endpoints.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Register Client
        </Button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        rowKey={(c) => c.customerId}
        searchKey={(c) => `${c.customerId} ${c.customerName} ${c.email} ${c.city}`}
        searchPlaceholder="Search client database by name, city, email..."
        isLoading={isLoading}
      />

      {/* Client Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Client: ${selectedCustomer?.customerId}` : 'Onboard Commercial Client'}
        subtitle="CUSTOMER relational schema account record"
        maxWidth="lg"
        icon={<Users className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Corporate / Enterprise Name"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Caterpillar Heavy Machinery Corp."
            error={formErrors.customerName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-800-445-9201"
              error={formErrors.phone}
              required
            />
            <Input
              label="Billing Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ap@caterpillar.com"
              error={formErrors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Tax ID / VAT / GST"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State / Province"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <Input
            label="Billing & Delivery Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="100 Caterpillar Way, Suite 400"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Client' : 'Onboard Client'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Customer Account"
        message={`Delete client account for ${selectedCustomer?.customerName}? Invoicing history will remain archived.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
