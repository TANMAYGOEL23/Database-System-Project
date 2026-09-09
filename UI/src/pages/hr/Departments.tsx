import React, { useState, useEffect } from 'react';
import { Plus, Building2, Edit2, Trash2, Users, MapPin, UserCheck } from 'lucide-react';
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
      const [depts, emps] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (err: any) {
      showToast('error', 'Error Loading Departments', err.message);
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
      location: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setIsEditing(true);
    setSelectedDept(dept);
    setFormData({
      departmentName: dept.departmentName,
      managerId: dept.managerId,
      location: dept.location || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (dept: Department) => {
    setSelectedDept(dept);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentName.trim()) {
      setFormErrors({ departmentName: 'Department name is required' });
      return;
    }

    const manager = employees.find((e) => e.employeeId === formData.managerId);

    try {
      setIsSubmitting(true);
      if (isEditing && selectedDept) {
        await departmentService.update(selectedDept.departmentId, {
          departmentName: formData.departmentName,
          managerId: formData.managerId,
          managerName: manager?.fullName || manager?.firstName,
          location: formData.location,
        });
        showToast('success', 'Department Updated', `${formData.departmentName} has been saved.`);
      } else {
        await departmentService.create({
          departmentName: formData.departmentName,
          managerId: formData.managerId,
          managerName: manager?.fullName || manager?.firstName,
          location: formData.location,
        });
        showToast('success', 'Department Created', `${formData.departmentName} was established.`);
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
      showToast('success', 'Department Deleted', `${selectedDept.departmentName} was removed.`);
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
      render: (d) => <span className="font-mono font-semibold text-blue-400">{d.departmentId}</span>,
    },
    {
      key: 'departmentName',
      header: 'Department Name',
      sortable: true,
      render: (d) => <span className="font-bold text-slate-100">{d.departmentName}</span>,
    },
    {
      key: 'managerName',
      header: 'Department Manager',
      render: (d) => (
        <div className="flex items-center gap-1.5 text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{d.managerName || d.managerId || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Plant Location',
      render: (d) => (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{d.location || '—'}</span>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Staff Headcount',
      sortable: true,
      align: 'center',
      render: (d) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300">
          <Users className="w-3 h-3" /> {d.employeeCount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(d)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(d)}
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
            Manage operational divisions, assigned leadership managers, and facility floor locations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Department
        </Button>
      </div>

      <DataTable
        data={departments}
        columns={columns}
        rowKey={(d) => d.departmentId}
        searchKey={(d) => `${d.departmentId} ${d.departmentName} ${d.managerName || ''} ${d.location || ''}`}
        searchPlaceholder="Search departments..."
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Department: ${selectedDept?.departmentId}` : 'Create New Department'}
        subtitle="PostgreSQL DEPARTMENT table entity"
        maxWidth="md"
        icon={<Building2 className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={formData.departmentName}
            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
            placeholder="e.g. Precision Manufacturing"
            error={formErrors.departmentName}
            required
          />

          <Select
            label="Designated Department Manager"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            options={employees.map((e) => ({
              value: e.employeeId,
              label: `${e.fullName || e.firstName + ' ' + e.lastName} (${e.employeeId})`,
            }))}
            required
          />

          <Input
            label="Physical Plant Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Hangar 1 - Heavy Machining Floor"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete ${selectedDept?.departmentName}? Any associated personnel should be reassigned.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
