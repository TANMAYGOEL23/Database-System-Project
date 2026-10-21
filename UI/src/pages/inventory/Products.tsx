import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, QrCode, Tag, IndianRupee, Layers } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { productService } from '../../services/productService';
import { Product, ProductUnit } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = ['Hydraulics', 'Tooling', 'Electrical', 'Structural', 'Electronics', 'Consumables'];
const UNITS: ProductUnit[] = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'TON', 'SET'];

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    category: CATEGORIES[0],
    costPrice: '100',
    sellingPrice: '180',
    barcode: '',
    unit: 'PCS' as ProductUnit,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Products', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({
      productName: '',
      category: CATEGORIES[0],
      costPrice: '120',
      sellingPrice: '220',
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      unit: 'PCS',
      description: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setFormData({
      productName: prod.productName,
      category: prod.category,
      costPrice: String(prod.costPrice),
      sellingPrice: String(prod.sellingPrice),
      barcode: prod.barcode,
      unit: prod.unit,
      description: prod.description || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.productName.trim()) errors.productName = 'Product name is required';
    if (!formData.barcode.trim()) errors.barcode = 'SKU / Barcode is required';
    const cp = parseFloat(formData.costPrice);
    const sp = parseFloat(formData.sellingPrice);
    if (isNaN(cp) || cp < 0) errors.costPrice = 'Valid cost price required';
    if (isNaN(sp) || sp < cp) errors.sellingPrice = 'Selling price should be greater than cost price';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        productName: formData.productName,
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        barcode: formData.barcode,
        unit: formData.unit,
        description: formData.description,
      };

      if (isEditing && selectedProduct) {
        await productService.update(selectedProduct.productId, payload);
        showToast('success', 'Product Updated', `${formData.productName} updated.`);
      } else {
        await productService.create(payload);
        showToast('success', 'Product Created', `${formData.productName} added to catalog.`);
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
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await productService.delete(selectedProduct.productId);
      showToast('success', 'Product Deleted', `${selectedProduct.productName} deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'productId',
      header: 'Product ID',
      sortable: true,
      render: (p) => <span className="font-mono font-semibold text-blue-400">{p.productId}</span>,
    },
    {
      key: 'productName',
      header: 'Product Name & Description',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-100">{p.productName}</div>
          <div className="text-[11px] text-slate-400 line-clamp-1">{p.description || 'No description provided'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {p.category}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'UoM',
      render: (p) => <span className="font-mono text-xs text-slate-400">{p.unit}</span>,
    },
    {
      key: 'costPrice',
      header: 'Cost Price (₹)',
      sortable: true,
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-slate-300">{formatCurrency(p.costPrice)}</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price (₹)',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(p.sellingPrice)}
        </span>
      ),
    },
    {
      key: 'barcode',
      header: 'Barcode / SKU',
      render: (p) => (
        <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
          <QrCode className="w-3 h-3 text-slate-500" />
          {p.barcode}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(p)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(p);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: CATEGORIES.map((c) => ({ label: c, value: c })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Master Product & Component Catalog</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain manufactured parts, raw materials, supplier SKUs, and commercial price margins.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      </div>

      <DataTable
        data={products}
        columns={columns}
        rowKey={(p) => p.productId}
        searchKey={(p) => `${p.productId} ${p.productName} ${p.category} ${p.barcode}`}
        searchPlaceholder="Search products by title, SKU, barcode..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Product Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Product: ${selectedProduct?.productId}` : 'Define Master Product SKU'}
        subtitle="PostgreSQL PRODUCT relational schema definition"
        maxWidth="lg"
        icon={<Package className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="e.g. High-Pressure Hydraulic Actuator 250BAR"
            error={formErrors.productName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Industrial Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
              required
            />
            <Select
              label="Unit of Measure (UoM)"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
              options={UNITS.map((u) => ({ label: u, value: u }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Cost Price (₹)"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              error={formErrors.costPrice}
              required
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              error={formErrors.sellingPrice}
              required
            />
            <Input
              label="Barcode / SKU"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="8900000000000"
              error={formErrors.barcode}
              required
            />
          </div>

          <Input
            label="Engineering Description / Specifications"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Dual-action cylinder for 500T hydraulic presses"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Product' : 'Register Product'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product SKU"
        message={`Delete ${selectedProduct?.productName}? This will impact related inventory levels.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
