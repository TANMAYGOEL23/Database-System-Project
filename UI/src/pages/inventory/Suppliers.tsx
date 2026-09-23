import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin, Award } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
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

  // Form
  const [formData, setFormData] = useState({
    supplierName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    rating: '5.0',
    status: 'ACTIVE' as const,
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
      gstNumber: `GSTIN${Math.floor(1000000000 + Math.random() * 9000000000)}Z1`,
      rating: '4.8',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setIsEditing(true);
    setSelectedSupplier(s);
    setFormData({
      supplierName: s.supplierName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      gstNumber: s.gstNumber,
      rating: String(s.rating || 5.0),
      status: (s.status as any) || 'ACTIVE',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.supplierName.trim()) errors.supplierName = 'Supplier vendor name is required';
    if (!formData.phone.trim()) errors.phone = 'Contact phone is required';
    if (!formData.email.trim()) errors.email = 'Valid corporate email is required';
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
        showToast('success', 'Supplier Registered', `${formData.supplierName} enrolled into procurement.`);
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
      showToast('success', 'Supplier Removed', `${selectedSupplier.supplierName} was removed.`);
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
      header: 'Vendor ID',
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold text-blue-400">{s.supplierId}</span>,
    },
    {
      key: 'supplierName',
      header: 'Supplier / Enterprise',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            {s.supplierName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">GST: {s.gstNumber}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (s) => (
        <div className="space-y-0.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{s.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>{s.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Facility Address',
      render: (s) => (
        <span className="text-xs text-slate-300 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {s.address}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'SLA Rating',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-amber-400 flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          {s.rating?.toFixed(1) || '5.0'} / 5.0
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
            title="Edit Supplier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedSupplier(s);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Supplier"
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Approved Vendor Directory & Suppliers</h2>
          <p className="text-xs text-slate-400 mt-1">
            Certified industrial suppliers, raw material fabricators, and procurement vendor profiles.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Register Vendor
        </Button>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        rowKey={(s) => s.supplierId}
        searchKey={(s) => `${s.supplierId} ${s.supplierName} ${s.gstNumber} ${s.email} ${s.phone}`}
        searchPlaceholder="Search vendor directory by name, tax ID, email..."
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Vendor: ${selectedSupplier?.supplierId}` : 'Register Procurement Vendor'}
        subtitle="SUPPLIER relational entity registration"
        maxWidth="lg"
        icon={<Truck className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Supplier Legal / Enterprise Name"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            placeholder="e.g. Apex Industrial Hydraulics Ltd."
            error={formErrors.supplierName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-019-2834"
              error={formErrors.phone}
              required
            />
            <Input
              label="Business Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sales@apexvalves.com"
              error={formErrors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tax ID / GST Number"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              required
            />
            <Input
              label="Quality & SLA Rating (0 - 5.0)"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            />
          </div>

          <Input
            label="Manufacturing Headquarters / Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Industrial Complex 4, Sector 12"
          />

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
        title="Remove Vendor"
        message={`Delete ${selectedSupplier?.supplierName}? Existing historical PO records will remain logged.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
