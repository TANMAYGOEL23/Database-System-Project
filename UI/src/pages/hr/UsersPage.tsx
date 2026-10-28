import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Users,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  UserPlus,
  ArrowLeftRight,
  Mail,
  Building2,
  Briefcase,
  KeyRound,
  CheckCircle2,
  Shield,
  Search,
} from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { User, UserRole, UserStatus } from '../../types/auth';
import { Employee, Department } from '../../types/hr';
import { cn } from '../../utils/cn';

interface UserFormData {
  email: string;
  fullName: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  departmentName: string;
  position: string;
  employeeId: string;
}

const INITIAL_FORM_STATE: UserFormData = {
  email: '',
  fullName: '',
  username: '',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  departmentName: '',
  position: '',
  employeeId: '',
};

export const UsersPage: React.FC = () => {
  const { user: currentAuthUser, isAdmin } = useAuth();
  const { showToast } = useNotification();

  // If not admin, redirect immediately
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Switching role loading state
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userList, empList, deptList] = await Promise.all([
        userService.getAll(),
        employeeService.getAll(),
        departmentService.getAll(),
      ]);
      setUsers(userList);
      setEmployees(empList);
      setDepartments(deptList);
    } catch (e: any) {
      showToast('error', 'Error Loading Users', e.message || 'Failed to fetch user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      departmentName: departments[0]?.departmentName || 'Operations',
      position: 'Staff',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      status: user.status,
      departmentName: user.departmentName || '',
      position: user.position || '',
      employeeId: user.employeeId || '',
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleEmailChange = (newEmail: string) => {
    setFormData((prev) => {
      const updates: Partial<UserFormData> = { email: newEmail };
      // Auto-suggest username if blank or was previously generated
      if (!prev.username || prev.username === prev.email.split('@')[0]) {
        const cleanPrefix = newEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
        updates.username = cleanPrefix;
      }
      return { ...prev, ...updates };
    });
  };

  const handleEmployeeLinkChange = (empId: string) => {
    const matched = employees.find((e) => e.employeeId === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      // If full name was empty, auto-populate from employee
      fullName: prev.fullName.trim() ? prev.fullName : (matched?.fullName || `${matched?.firstName || ''} ${matched?.lastName || ''}`.trim()),
      departmentName: matched?.departmentName || prev.departmentName,
      position: matched?.position || prev.position,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailClean = formData.email.trim();

    if (!emailClean) {
      errors.email = 'Login Email / Google Mail is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'System Username is required';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username.trim())) {
      errors.username = 'Username may only contain letters, numbers, dots, and hyphens';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const created = await userService.create({
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        departmentName: formData.departmentName.trim() || 'Operations',
        position: formData.position.trim() || 'Staff',
        employeeId: formData.employeeId || '',
      });

      showToast(
        'success',
        'User Account Authorized',
        `${created.fullName} (${created.email}) has been authorized with role ${created.role}.`
      );
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message || 'Could not create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !validateForm()) return;

    try {
      setIsSubmitting(true);
      await userService.update(selectedUser.userId, {
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        departmentName: formData.departmentName.trim(),
        position: formData.position.trim(),
        employeeId: formData.employeeId || '',
      });

      showToast('success', 'User Account Updated', `Changes to ${formData.fullName} have been saved.`);
      setIsEditOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const newRole: UserRole = targetUser.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN';
    const roleLabel = newRole === 'ADMIN' ? 'Administrator (Full Access)' : 'Employee (Portal Only)';

    try {
      setSwitchingUserId(targetUser.userId);
      await userService.update(targetUser.userId, { role: newRole });
      showToast(
        'success',
        'Role Updated',
        `${targetUser.fullName || targetUser.email} switched to ${newRole === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'}.`
      );
      await loadData();
    } catch (err: any) {
      showToast('error', 'Role Switch Failed', err.message || 'Could not update role in database');
    } finally {
      setSwitchingUserId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await userService.delete(selectedUser.userId);
      showToast('success', 'User Revoked', `Account ${selectedUser.email} has been revoked.`);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Revoke Failed', err.message || 'Could not delete user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE').length;
    const employeesCount = users.filter((u) => u.role === 'EMPLOYEE' && u.status === 'ACTIVE').length;
    const linked = users.filter((u) => Boolean(u.employeeId && u.employeeId.trim().length > 0)).length;
    return { total, admins, employeesCount, linked };
  }, [users]);

  const columns: Column<User>[] = [
    {
      key: 'userId',
      header: 'User ID',
      sortable: true,
      render: (u) => <span className="font-mono font-semibold text-blue-400">{u.userId}</span>,
    },
    {
      key: 'user',
      header: 'User & Google Account',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          {u.avatarUrl ? (
            <img
              src={u.avatarUrl}
              alt={u.fullName}
              className="w-8 h-8 rounded-full ring-1 ring-slate-700 object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {u.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-slate-100 truncate">{u.fullName}</div>
            <div className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>{u.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'System Username',
      sortable: true,
      render: (u) => (
        <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          @{u.username}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Security Role & Switcher',
      sortable: true,
      render: (u) => {
        const isTargetAdmin = u.role === 'ADMIN';
        const isSwitching = switchingUserId === u.userId;

        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold border',
                isTargetAdmin
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              )}
            >
              {isTargetAdmin ? (
                <ShieldCheck className="w-3 h-3 text-blue-400" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-400" />
              )}
              <span>{u.role}</span>
            </span>

            <Button
              variant={isTargetAdmin ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => handleToggleRole(u)}
              disabled={isSwitching}
              isLoading={isSwitching}
              leftIcon={<ArrowLeftRight className="w-3 h-3" />}
              className={cn(
                'text-[11px] h-7 px-2 py-0 font-medium whitespace-nowrap',
                !isTargetAdmin && 'hover:bg-blue-600/20 hover:text-blue-300 hover:border-blue-500/40 text-blue-400'
              )}
              title={isTargetAdmin ? 'Switch role to Employee' : 'Switch role to Admin'}
            >
              {isTargetAdmin ? '⇄ Make EMP' : '⇄ Make ADMIN'}
            </Button>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'departmentName',
      header: 'Department & Position',
      sortable: true,
      render: (u) => (
        <div className="text-xs">
          <div className="text-slate-200">{u.departmentName || 'Operations'}</div>
          <div className="text-[11px] text-slate-400">{u.position || 'Staff'}</div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Linked HR Personnel',
      sortable: true,
      render: (u) => {
        if (!u.employeeId) {
          return (
            <span className="text-xs text-slate-500 italic">
              Unlinked (System Only)
            </span>
          );
        }
        const matched = employees.find((e) => e.employeeId === u.employeeId);
        return (
          <div className="text-xs">
            <span className="font-mono font-semibold text-blue-400">{u.employeeId}</span>
            {matched && (
              <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {matched.fullName || `${matched.firstName} ${matched.lastName}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(u)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
            title="Edit User Details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(u);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Revoke / Delete User Account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'role',
      label: 'Security Role',
      options: [
        { label: 'Admin (Full Access)', value: 'ADMIN' },
        { label: 'Employee (Portal Only)', value: 'EMPLOYEE' },
      ],
    },
    {
      key: 'status',
      label: 'Account Status',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
      ],
    },
    {
      key: 'departmentName',
      label: 'Department',
      options: departments.map((d) => ({ label: d.departmentName, value: d.departmentName })),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">System Users & Access Management</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authorize Google OAuth accounts, switch security roles (ADMIN / EMPLOYEE), and associate logins with HR personnel records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add New User / Authorize Account
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total User Accounts"
          value={stats.total}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          subtitle="Registered Google OAuth identities"
          badge="Directory"
          badgeColor="blue"
        />
        <StatCard
          title="Active Administrators"
          value={stats.admins}
          icon={<ShieldCheck className="w-5 h-5 text-indigo-400" />}
          subtitle="Full factory operations & management"
          badge="Elevated"
          badgeColor="blue"
        />
        <StatCard
          title="Active Employees"
          value={stats.employeesCount}
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
          subtitle="Self-service portal attendance & payroll"
          badge="Self-Service"
          badgeColor="emerald"
        />
        <StatCard
          title="Linked to HR Records"
          value={stats.linked}
          icon={<Building2 className="w-5 h-5 text-cyan-400" />}
          subtitle="Personnel staff profiles linked"
          badge="Associated"
          badgeColor="blue"
        />
      </div>

      {/* Users Data Table */}
      <DataTable
        data={users}
        columns={columns}
        rowKey={(u) => u.userId}
        searchKey={(u) => `${u.userId} ${u.fullName} ${u.username} ${u.email} ${u.departmentName} ${u.position} ${u.employeeId}`}
        searchPlaceholder="Search users by name, email, username, department, or HR ID..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create / Authorize Account Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Authorize New Google Account / User"
        subtitle="Provision workspace access for an employee or administrator Google account."
        maxWidth="lg"
        icon={<UserPlus className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Login Email / Google Mail"
            type="email"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="e.g. operator@gmail.com or name@megafactory.internal"
            error={formErrors.email}
            required
            helperText="The user will sign in with this Google OAuth email address."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Elena Rostova"
              error={formErrors.fullName}
              required
            />
            <Input
              label="System Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. erostova"
              error={formErrors.username}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Security Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { label: 'ADMIN (Full System Access)', value: 'ADMIN' },
                { label: 'EMPLOYEE (Employee Portal Self-Service)', value: 'EMPLOYEE' },
              ]}
              required
            />
            <Select
              label="Account Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Department"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              options={[
                { label: 'Executive Operations', value: 'Executive Operations' },
                { label: 'Machining & Assembly', value: 'Machining & Assembly' },
                { label: 'Warehouse & Logistics', value: 'Warehouse & Logistics' },
                { label: 'Quality & Testing', value: 'Quality & Testing' },
                { label: 'Robotics & Automation', value: 'Robotics & Automation' },
                ...departments
                  .filter((d) => !['Executive Operations', 'Machining & Assembly', 'Warehouse & Logistics', 'Quality & Testing', 'Robotics & Automation'].includes(d.departmentName))
                  .map((d) => ({ label: d.departmentName, value: d.departmentName })),
              ]}
            />
            <Input
              label="Position Title"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. Lead CNC Mill Machinist"
            />
          </div>

          {/* Optional Link to HR Personnel Record */}
          <Select
            label="Optional Link to HR Staff Directory"
            value={formData.employeeId}
            onChange={(e) => handleEmployeeLinkChange(e.target.value)}
            options={[
              { label: '-- None (System Only Account) --', value: '' },
              ...employees.map((emp) => ({
                label: `${emp.fullName || `${emp.firstName} ${emp.lastName}`} (${emp.employeeId} • ${emp.departmentName})`,
                value: emp.employeeId,
              })),
            ]}
            helperText="Associates this login with their personal attendance punch logs and payroll slips."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Authorize & Save Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User Account"
        subtitle={`Modify system credentials for ${selectedUser?.fullName} (${selectedUser?.userId})`}
        maxWidth="lg"
        icon={<Edit2 className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Login Email / Google Mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@gmail.com"
            error={formErrors.email}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={formErrors.fullName}
              required
            />
            <Input
              label="System Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={formErrors.username}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Security Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { label: 'ADMIN (Full System Access)', value: 'ADMIN' },
                { label: 'EMPLOYEE (Employee Portal Self-Service)', value: 'EMPLOYEE' },
              ]}
              required
            />
            <Select
              label="Account Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assigned Department"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
            />
            <Input
              label="Position Title"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <Select
            label="Optional Link to HR Staff Directory"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            options={[
              { label: '-- None (System Only Account) --', value: '' },
              ...employees.map((emp) => ({
                label: `${emp.fullName || `${emp.firstName} ${emp.lastName}`} (${emp.employeeId} • ${emp.departmentName})`,
                value: emp.employeeId,
              })),
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Revoke Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Revoke System Access?"
        message={`Are you sure you want to delete and revoke system access for ${selectedUser?.fullName} (${selectedUser?.email})? They will no longer be able to log in to the ERP platform.`}
        confirmText="Revoke & Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
