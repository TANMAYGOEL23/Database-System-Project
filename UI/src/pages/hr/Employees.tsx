import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, ShieldCheck } from 'lucide-react';
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
import { employeeAccessService, EmployeeAccountAccess } from '../../services/employeeAccessService';
import { useAuth } from '../../context/AuthContext';
import { Employee, Department, EmployeeGender, EmployeeStatus } from '../../types/hr';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<EmployeeAccountAccess[]>([]);
  const [accessError, setAccessError] = useState(false);
  const [promotionTarget, setPromotionTarget] = useState<Employee | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const { isAdmin } = useAuth();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
      const [empList, deptList] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      if (isAdmin) {
        try {
          setAccounts(await employeeAccessService.getAccounts());
          setAccessError(false);
        } catch (error: any) {
          setAccessError(true);
          showToast('error', 'Access Details Unavailable', error.message);
        }
      }
      if (deptList.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptList[0].departmentId }));
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Data', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
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
      position: 'Plant Technician',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsEditing(true);
    setSelectedEmployee(emp);
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';
    const sal = parseFloat(formData.salary);
    if (isNaN(sal) || sal <= 0) errors.salary = 'Salary must be greater than 0';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dept = departments.find((d) => d.departmentId === formData.departmentId);
    const departmentName = dept ? dept.departmentName : 'Operations';

    try {
      setIsSubmitting(true);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        departmentId: formData.departmentId,
        departmentName,
        salary: parseFloat(formData.salary),
        joiningDate: formData.joiningDate,
        status: formData.status,
        position: formData.position,
      };

      if (isEditing && selectedEmployee) {
        await employeeService.update(selectedEmployee.employeeId, payload);
        showToast('success', 'Employee Updated', `${formData.firstName} ${formData.lastName} saved.`);
      } else {
        await employeeService.create(payload);
        showToast('success', 'Employee Created', `${formData.firstName} ${formData.lastName} added to database.`);
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
    if (!selectedEmployee) return;
    try {
      setIsSubmitting(true);
      await employeeService.delete(selectedEmployee.employeeId);
      showToast('success', 'Employee Deleted', `${selectedEmployee.fullName} has been removed.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAccounts = (employeeId: string) => accounts.filter(
    (account) => account.employeeId === employeeId && account.status === 'ACTIVE'
  );

  const handleMakeAdmin = async () => {
    if (!isAdmin || !promotionTarget || isPromoting) return;
    try {
      setIsPromoting(true);
      const promoted = await employeeAccessService.makeAdmin(promotionTarget.employeeId);
      setAccounts((previous) => [
        ...previous.filter((account) => !promoted.some((updated) => updated.userId === account.userId)),
        ...promoted,
      ]);
      showToast('success', 'Admin Access Granted', `${promotionTarget.fullName || promotionTarget.firstName} now has full workspace access. Their new role applies when they next sign in or reload.`);
      setPromotionTarget(null);
    } catch (error: any) {
      showToast('error', 'Could Not Grant Admin Access', error.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employeeId',
      header: 'Staff ID',
      sortable: true,
      render: (emp) => <span className="font-mono font-semibold text-blue-400">{emp.employeeId}</span>,
    },
    {
      key: 'fullName',
      header: 'Full Name & Position',
      sortable: true,
      render: (emp) => (
        <div>
          <div className="font-semibold text-slate-100">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</div>
          <div className="text-[11px] text-slate-400">{emp.position || 'Plant Technician'}</div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (emp) => <span className="text-slate-300 text-xs">{emp.departmentName}</span>,
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (emp) => (
        <div className="text-[11px] space-y-0.5">
          <div className="text-slate-300">{emp.email}</div>
          <div className="text-slate-400 font-mono">{emp.phone}</div>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Annual Salary ($)',
      sortable: true,
      align: 'right',
      render: (emp) => (
        <span className="font-mono font-bold text-slate-200 text-xs">
          {formatCurrency(emp.salary)}
        </span>
      ),
    },
    {
      key: 'joiningDate',
      header: 'Joined Date',
      sortable: true,
      render: (emp) => <span className="font-mono text-xs text-slate-400">{formatDate(emp.joiningDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: 'workspaceRole',
      header: 'Workspace Access',
      render: (emp) => {
        if (accessError) return <span className="text-xs text-amber-400">Access unavailable</span>;
        const linked = activeAccounts(emp.employeeId);
        if (linked.some((account) => account.role === 'ADMIN')) {
          return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300"><ShieldCheck className="w-4 h-4" />Admin</span>;
        }
        if (linked.length) return (
          <div className="space-y-2">
            <span className="text-xs text-slate-300">Employee</span>
            {isAdmin && emp.status !== 'TERMINATED' && (
              <Button
                variant="secondary"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setPromotionTarget(emp)}
                disabled={isPromoting}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                aria-label={`Make ${emp.fullName || emp.firstName} an admin`}
              >
                Make admin
              </Button>
            )}
          </div>
        );
        return <span className="text-xs text-slate-500">No active sign-in account</span>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(emp)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedEmployee(emp);
              setIsDeleteOpen(true);
            }}
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
      label: 'Department',
      options: departments.map((d) => ({ label: d.departmentName, value: d.departmentId })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'On Leave', value: 'ON_LEAVE' },
        { label: 'Terminated', value: 'TERMINATED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Workforce Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain employee records, department allocations, shift classifications, and compensation.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Employee
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={employees}
        columns={columns}
        rowKey={(emp) => emp.employeeId}
        searchKey={(emp) => `${emp.employeeId} ${emp.firstName} ${emp.lastName} ${emp.email} ${emp.phone} ${emp.position || ''}`}
        searchPlaceholder="Search employees by name, ID, position..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? `Edit Employee: ${selectedEmployee?.employeeId}` : 'Add New Plant Employee'}
        subtitle="PostgreSQL EMPLOYEE relational table schema mapping"
        maxWidth="2xl"
        icon={<Users className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Elena"
              error={formErrors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Rostova"
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
              label="Position / Role Title"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. CNC Mill Machinist"
            />
            <Select
              label="Assigned Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={departments.map((d) => ({
                label: d.departmentName,
                value: d.departmentId,
              }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Contact"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              error={formErrors.phone}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="operator@megafactory.internal"
              error={formErrors.email}
              required
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
              label="Annual Salary ($)"
              type="number"
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!promotionTarget}
        onClose={() => { if (!isPromoting) setPromotionTarget(null); }}
        onConfirm={handleMakeAdmin}
        title="Grant admin access?"
        message={`${promotionTarget?.fullName || promotionTarget?.firstName} will get full access to employee records, payroll, inventory, reports, and the ability to promote other employees. Linked accounts: ${promotionTarget ? activeAccounts(promotionTarget.employeeId).map((account) => account.email).join(', ') : ''}.`}
        confirmText="Make admin"
        variant="primary"
        isLoading={isPromoting}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message={`Are you sure you want to delete ${selectedEmployee?.fullName || selectedEmployee?.firstName}? This will remove associated attendance and payroll records.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
