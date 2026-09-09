import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Boxes, QrCode, DollarSign } from 'lucide-react';
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

const PRODUCT_CATEGORIES = [
  'Motors & Actuators',
  'Hydraulics & Pneumatics',
  'Electronics & Sensors',
  'Mechanical Components',
  'Energy Systems',
  'Raw Materials',
  'Chemicals & Consumables',
];

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    category: PRODUCT_CATEGORIES[0],
    costPrice: '100',
    sellingPrice: '180',
    barcode: '',
    unit: 'PCS' as ProductUnit,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (e: any) {
      showToast('error', 'Failed to load products', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({
      productName: '',
      category: PRODUCT_CATEGORIES[0],
      costPrice: '100',
      sellingPrice: '180',
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      unit: 'PCS',
      description: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prd: Product) => {
    setIsEditing(true);
    setSelectedProduct(prd);
    setFormData({
      productName: prd.productName,
      category: prd.category,
      costPrice: String(prd.costPrice),
      sellingPrice: String(prd.sellingPrice),
      barcode: prd.barcode,
      unit: prd.unit,
      description: prd.description || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.productName.trim()) errors.productName = 'Product name is required';
    if (!formData.barcode.trim()) errors.barcode = 'Barcode / SKU is required';

    const cost = parseFloat(formData.costPrice);
    const sell = parseFloat(formData.sellingPrice);

    if (isNaN(cost) || cost < 0) errors.costPrice = 'Cost price must be >= 0';
    if (isNaN(sell) || sell < 0) errors.sellingPrice = 'Selling price must be >= 0';
    if (sell < cost) errors.sellingPrice = 'Selling price is typically greater than cost price';

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
        showToast('success', 'Product Updated', `${formData.productName} was updated successfully.`);
      } else {
        await productService.create(payload);
        showToast('success', 'Product Registered', `${formData.productName} added to product catalog.`);
      }

      setIsFormOpen(false);
      loadProducts();
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
      showToast('success', 'Product Deleted', `${selectedProduct.productName} removed from catalog.`);
      setIsDeleteOpen(false);
      loadProducts();
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
      header: 'Product Name',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-100">{p.productName}</div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.description || 'Industrial Standard Component'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => <span className="text-xs text-slate-300">{p.category}</span>,
    },
    {
      key: 'barcode',
      header: 'Barcode / SKU',
      render: (p) => (
        <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5 text-slate-500" />
          {p.barcode}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (p) => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{p.unit}</span>,
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      sortable: true,
      align: 'right',
      render: (p) => <span className="font-mono text-slate-300">{formatCurrency(p.costPrice)}</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-semibold text-emerald-400">
          {formatCurrency(p.sellingPrice)}
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
            onClick={() => {
              setSelectedProduct(p);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
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
      label: 'Categories',
      options: PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    {
      key: 'unit',
      label: 'Units',
      options: [
        { label: 'PCS', value: 'PCS' },
        { label: 'BOX', value: 'BOX' },
        { label: 'SET', value: 'SET' },
        { label: 'MTR', value: 'MTR' },
        { label: 'KG', value: 'KG' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Master Product Catalog</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manufactured industrial products, assemblies, components, cost structures, and barcode tagging.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Product
        </Button>
      </div>

      <DataTable
        data={products}
        columns={columns}
        rowKey={(p) => p.productId}
        searchKey={(p) => `${p.productId} ${p.productName} ${p.category} ${p.barcode}`}
        searchPlaceholder="Search products by SKU, name, category..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Product: ${selectedProduct?.productId}` : 'Define New Industrial Product'}
        subtitle="PostgreSQL PRODUCT entity configuration"
        maxWidth="xl"
        icon={<Boxes className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="e.g. High-Torque CNC Servo Motor 4.5kW"
            error={formErrors.productName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c }))}
              required
            />
            <Select
              label="Standard Unit of Measurement"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
              options={[
                { label: 'PCS (Pieces)', value: 'PCS' },
                { label: 'BOX (Boxes)', value: 'BOX' },
                { label: 'SET (Complete Sets)', value: 'SET' },
                { label: 'MTR (Meters)', value: 'MTR' },
                { label: 'KG (Kilograms)', value: 'KG' },
                { label: 'LTR (Liters)', value: 'LTR' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Unit Cost Price ($)"
              type="number"
              min="0"
              step="0.1"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              error={formErrors.costPrice}
              required
            />
            <Input
              label="Unit Selling Price ($)"
              type="number"
              min="0"
              step="0.1"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              error={formErrors.sellingPrice}
              required
            />
            <Input
              label="Barcode / EAN-13"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="8901234567890"
              error={formErrors.barcode}
              required
            />
          </div>

          <Input
            label="Product Technical Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key technical specifications, tolerances, and electrical ratings"
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Product Specifications: ${selectedProduct.productId}`}
          subtitle={selectedProduct.productName}
          maxWidth="lg"
          icon={<Boxes className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <h4 className="text-base font-bold text-white">{selectedProduct.productName}</h4>
              <p className="text-xs text-slate-300 mt-1">{selectedProduct.description || 'Standard Industrial Component'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Category</span>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedProduct.category}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Unit of Measure</span>
                <p className="font-mono font-semibold text-slate-200 mt-0.5">{selectedProduct.unit}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Barcode Tag</span>
                <p className="font-mono text-slate-200 mt-0.5">{selectedProduct.barcode}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Cost Price</span>
                <p className="font-mono font-semibold text-slate-200 mt-0.5">{formatCurrency(selectedProduct.costPrice)}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Selling Price</span>
                <p className="font-mono font-bold text-emerald-400 mt-0.5">{formatCurrency(selectedProduct.sellingPrice)}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800">
                <span className="text-slate-400">Gross Margin</span>
                <p className="font-mono font-bold text-blue-400 mt-0.5">
                  {Math.round(((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.sellingPrice) * 100)}%
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Delete ${selectedProduct?.productName} (${selectedProduct?.productId}) from the active catalog?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
