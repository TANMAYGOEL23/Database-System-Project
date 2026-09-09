import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Users, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { Employee, Department, EmployeeGender, EmployeeStatus } from '../../types/hr';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Employee
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE' as EmployeeGender,
    phone: '',
    email: '',
    address: '',
    departmentId: '',
    salary: '75000',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as EmployeeStatus,
    position: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [emps, depts] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      if (depts.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: depts[0].departmentId }));
      }
    } catch (err: any) {
      showToast('error', 'Data Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedEmp(null);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      phone: '',
      email: '',
      address: '',
      departmentId: departments[0]?.departmentId || '',
      salary: '75000',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      position: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsEditing(true);
    setSelectedEmp(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      gender: emp.gender,
      phone: emp.phone,
      email: emp.email,
      address: emp.address,
      departmentId: emp.departmentId,
      salary: String(emp.salary),
      joiningDate: emp.joiningDate,
      status: emp.status,
      position: emp.position || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsDeleteOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';

    const salaryNum = parseFloat(formData.salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      errors.salary = 'Salary must be a positive numeric value';
    }

    if (!formData.joiningDate) errors.joiningDate = 'Joining date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dept = departments.find((d) => d.departmentId === formData.departmentId);

    try {
      setIsSubmitting(true);
      if (isEditing && selectedEmp) {
        await employeeService.update(selectedEmp.employeeId, {
          ...formData,
          salary: parseFloat(formData.salary),
          departmentName: dept?.departmentName,
        });
        showToast('success', 'Employee Updated', `${formData.firstName} ${formData.lastName} was successfully updated.`);
      } else {
        await employeeService.create({
          ...formData,
          salary: parseFloat(formData.salary),
          departmentName: dept?.departmentName,
        });
        showToast('success', 'Employee Created', `${formData.firstName} ${formData.lastName} has been registered.`);
      }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.message || 'Unable to save employee details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmp) return;
    try {
      setIsSubmitting(true);
      await employeeService.delete(selectedEmp.employeeId);
      showToast('success', 'Employee Removed', `Record for ${selectedEmp.fullName || selectedEmp.employeeId} was deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      sortable: true,
      render: (emp) => <span className="font-mono font-semibold text-blue-400">{emp.employeeId}</span>,
    },
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      render: (emp) => (
        <div>
          <div className="font-semibold text-slate-100">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</div>
          <div className="text-[11px] text-slate-400">{emp.position || 'Staff Specialist'}</div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (emp) => <span className="text-slate-300">{emp.departmentName || '—'}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (emp) => <span className="font-mono text-xs text-slate-300">{emp.email}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (emp) => <span className="font-mono text-xs text-slate-400">{emp.phone}</span>,
    },
    {
      key: 'salary',
      header: 'Annual Salary',
      sortable: true,
      align: 'right',
      render: (emp) => <span className="font-mono font-semibold text-emerald-400">{formatCurrency(emp.salary)}</span>,
    },
    {
      key: 'joiningDate',
      header: 'Joined',
      sortable: true,
      render: (emp) => <span className="text-xs text-slate-400">{formatDate(emp.joiningDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDetail(emp)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(emp)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(emp)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Delete Employee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'departmentId',
      label: 'Departments',
      options: departments.map((d) => ({ label: d.departmentName, value: d.departmentId })),
    },
    {
      key: 'status',
      label: 'Statuses',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'On Leave', value: 'ON_LEAVE' },
        { label: 'Terminated', value: 'TERMINATED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Employee Directory & Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain plant personnel, compensation structures, department affiliations, and status records.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Employee
        </Button>
      </div>

      {/* Employees Table */}
      <DataTable
        data={employees}
        columns={columns}
        rowKey={(emp) => emp.employeeId}
        searchKey={(emp) => `${emp.employeeId} ${emp.fullName || ''} ${emp.firstName} ${emp.lastName} ${emp.email}`}
        searchPlaceholder="Search by ID, name, email..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Employee: ${selectedEmp?.employeeId}` : 'Register New Employee'}
        subtitle="PostgreSQL EMPLOYEE relational schema entity form"
        maxWidth="2xl"
        icon={<Users className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={formErrors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={formErrors.lastName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as EmployeeGender })}
              options={[
                { label: 'Male', value: 'MALE' },
                { label: 'Female', value: 'FEMALE' },
                { label: 'Other', value: 'OTHER' },
              ]}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              error={formErrors.phone}
              required
            />
            <Input
              label="Corporate Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@smartfactory.internal"
              error={formErrors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={departments.map((d) => ({
                label: `${d.departmentName}`,
                value: d.departmentId,
              }))}
              error={formErrors.departmentId}
              required
            />
            <Input
              label="Job Position / Role"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. Lead CNC Specialist"
            />
          </div>

          <Input
            label="Residential Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address, City, State"
            error={formErrors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Annual Base Salary ($)"
              type="number"
              min="0"
              step="500"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              error={formErrors.salary}
              required
            />
            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              error={formErrors.joiningDate}
              required
            />
            <Select
              label="Employment Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'On Leave', value: 'ON_LEAVE' },
                { label: 'Terminated', value: 'TERMINATED' },
              ]}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Register Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail Modal */}
      {selectedEmp && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Employee Record: ${selectedEmp.fullName || selectedEmp.employeeId}`}
          subtitle={`ID: ${selectedEmp.employeeId} • ${selectedEmp.departmentName}`}
          maxWidth="lg"
          icon={<Users className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">{selectedEmp.fullName || `${selectedEmp.firstName} ${selectedEmp.lastName}`}</h4>
                <p className="text-xs text-blue-400 font-mono">{selectedEmp.position || 'Staff Specialist'}</p>
              </div>
              <StatusBadge status={selectedEmp.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Department</span>
                <p className="font-semibold text-slate-200">{selectedEmp.departmentName}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Annual Compensation</span>
                <p className="font-mono font-semibold text-emerald-400 text-sm">{formatCurrency(selectedEmp.salary)}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Email Address</span>
                <p className="font-mono text-slate-200">{selectedEmp.email}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Phone Contact</span>
                <p className="font-mono text-slate-200">{selectedEmp.phone}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Joining Date</span>
                <p className="text-slate-200">{formatDate(selectedEmp.joiningDate)}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Gender</span>
                <p className="text-slate-200">{selectedEmp.gender}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-850/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Address</span>
              <p className="text-slate-200 mt-0.5">{selectedEmp.address}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message={`Are you sure you want to permanently delete employee ${selectedEmp?.fullName || selectedEmp?.employeeId}? This will remove all associated user login credentials and archive attendance history.`}
        confirmText="Delete Record"
        isLoading={isSubmitting}
      />
    </div>
  );
};
