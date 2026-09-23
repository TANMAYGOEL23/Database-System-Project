import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Users, MapPin } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';
import { Department, Employee } from '../../types/hr';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    departmentName: '',
    managerId: '',
    location: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [deptList, empList] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setDepartments(deptList);
      setEmployees(empList);
    } catch (e: any) {
      showToast('error', 'Error Loading Departments', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedDept(null);
    setFormData({
      departmentName: '',
      managerId: employees[0]?.employeeId || '',
      location: 'Building A, Floor 1',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setIsEditing(true);
    setSelectedDept(dept);
    setFormData({
      departmentName: dept.departmentName,
      managerId: dept.managerId || '',
      location: dept.location || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.departmentName.trim()) errors.departmentName = 'Department name is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const manager = employees.find((emp) => emp.employeeId === formData.managerId);
    const managerName = manager ? manager.fullName || `${manager.firstName} ${manager.lastName}` : undefined;

    try {
      setIsSubmitting(true);
      if (isEditing && selectedDept) {
        await departmentService.update(selectedDept.departmentId, {
          departmentName: formData.departmentName,
          managerId: formData.managerId,
          managerName,
          location: formData.location,
        });
        showToast('success', 'Department Updated', `${formData.departmentName} updated successfully.`);
      } else {
        await departmentService.create({
          departmentName: formData.departmentName,
          managerId: formData.managerId,
          managerName,
          location: formData.location,
        });
        showToast('success', 'Department Created', `${formData.departmentName} added to database.`);
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
    if (!selectedDept) return;
    try {
      setIsSubmitting(true);
      await departmentService.delete(selectedDept.departmentId);
      showToast('success', 'Department Deleted', `${selectedDept.departmentName} has been removed.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Department>[] = [
    {
      key: 'departmentId',
      header: 'Dept ID',
      sortable: true,
      render: (dept) => <span className="font-mono font-semibold text-blue-400">{dept.departmentId}</span>,
    },
    {
      key: 'departmentName',
      header: 'Department Title',
      sortable: true,
      render: (dept) => (
        <div>
          <div className="font-semibold text-slate-100">{dept.departmentName}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            {dept.location}
          </div>
        </div>
      ),
    },
    {
      key: 'managerName',
      header: 'Department Head / Manager',
      sortable: true,
      render: (dept) => (
        <span className="text-slate-200 text-xs font-medium">{dept.managerName || 'Unassigned'}</span>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Staff Headcount',
      sortable: true,
      align: 'center',
      render: (dept) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          <Users className="w-3 h-3 text-blue-400" />
          {dept.employeeCount} Personnel
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (dept) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(dept)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDept(dept);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Department"
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Department Hierarchy</h2>
          <p className="text-xs text-slate-400 mt-1">
            PostgreSQL DEPARTMENT entities, operational zones, manager assignments, and workforce headcounts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      <DataTable
        data={departments}
        columns={columns}
        rowKey={(d) => d.departmentId}
        searchKey={(d) => `${d.departmentId} ${d.departmentName} ${d.managerName || ''} ${d.location || ''}`}
        searchPlaceholder="Search departments by name, ID, manager..."
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Department: ${selectedDept?.departmentId}` : 'Create New Plant Department'}
        subtitle="PostgreSQL DEPARTMENT relational schema mapping"
        maxWidth="md"
        icon={<Building2 className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={formData.departmentName}
            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
            placeholder="e.g. Precision CNC Fabrication"
            error={formErrors.departmentName}
            required
          />

          <Select
            label="Department Manager / Lead"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            options={employees.map((emp) => ({
              label: `${emp.fullName || emp.firstName + ' ' + emp.lastName} (${emp.position || 'Staff'})`,
              value: emp.employeeId,
            }))}
            required
          />

          <Input
            label="Plant Facility Location / Building"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Building B - South Fabrication Wing"
            error={formErrors.location}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Delete ${selectedDept?.departmentName}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
