import React, { useState, useEffect } from 'react';
import { Plus, Truck, Edit2, Trash2, Mail, Phone, MapPin, Award } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types/inventory';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplierName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    rating: '4.8',
    status: 'ACTIVE' as Supplier['status'],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Suppliers', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedSupplier(null);
    setFormData({
      supplierName: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: `GST-US-MI-${Math.floor(100000 + Math.random() * 900000)}`,
      rating: '4.8',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setIsEditing(true);
    setSelectedSupplier(sup);
    setFormData({
      supplierName: sup.supplierName,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      gstNumber: sup.gstNumber,
      rating: String(sup.rating || 5.0),
      status: sup.status || 'ACTIVE',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.supplierName.trim()) errors.supplierName = 'Supplier name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone contact is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.gstNumber.trim()) errors.gstNumber = 'GST / Tax ID is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        supplierName: formData.supplierName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        gstNumber: formData.gstNumber,
        rating: parseFloat(formData.rating) || 5.0,
        status: formData.status,
      };

      if (isEditing && selectedSupplier) {
        await supplierService.update(selectedSupplier.supplierId, payload);
        showToast('success', 'Supplier Updated', `${formData.supplierName} updated successfully.`);
      } else {
        await supplierService.create(payload);
        showToast('success', 'Supplier Registered', `${formData.supplierName} registered in database.`);
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
    if (!selectedSupplier) return;
    try {
      setIsSubmitting(true);
      await supplierService.delete(selectedSupplier.supplierId);
      showToast('success', 'Supplier Removed', `${selectedSupplier.supplierName} deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'supplierId',
      header: 'Supplier ID',
      sortable: true,
      render: (s) => <span className="font-mono font-semibold text-blue-400">{s.supplierId}</span>,
    },
    {
      key: 'supplierName',
      header: 'Vendor Name',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-100">{s.supplierName}</div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.address}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Contact',
      render: (s) => <span className="font-mono text-xs text-slate-300">{s.phone}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (s) => <span className="font-mono text-xs text-slate-300">{s.email}</span>,
    },
    {
      key: 'gstNumber',
      header: 'GST / Tax ID',
      render: (s) => <span className="font-mono text-xs text-slate-400">{s.gstNumber}</span>,
    },
    {
      key: 'rating',
      header: 'Vendor Rating',
      sortable: true,
      align: 'center',
      render: (s) => (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
          <Award className="w-3.5 h-3.5" /> {s.rating || 5.0} / 5.0
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Vendor"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedSupplier(s);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Vendor"
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Approved Vendor & Supplier Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain raw material suppliers, electrical component manufacturers, tax IDs, and service ratings.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Supplier
        </Button>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        rowKey={(s) => s.supplierId}
        searchKey={(s) => `${s.supplierId} ${s.supplierName} ${s.gstNumber} ${s.email}`}
        searchPlaceholder="Search suppliers by name, ID, GST..."
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Supplier: ${selectedSupplier?.supplierId}` : 'Register New Vendor Supplier'}
        subtitle="PostgreSQL SUPPLIER relational schema configuration"
        maxWidth="lg"
        icon={<Truck className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Supplier Company Name"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            placeholder="e.g. Apex Precision Metallurgy Corp"
            error={formErrors.supplierName}
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
              label="Order Dispatch Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@vendor.com"
              error={formErrors.email}
              required
            />
          </div>

          <Input
            label="Vendor Headquarters Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address, City, State"
            error={formErrors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GST / Tax Identification Number"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              placeholder="GST-US-XX-000000"
              error={formErrors.gstNumber}
              required
            />
            <Input
              label="Quality & Reliability Rating (0.0 - 5.0)"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Supplier' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Delete vendor record ${selectedSupplier?.supplierName} (${selectedSupplier?.supplierId})?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
