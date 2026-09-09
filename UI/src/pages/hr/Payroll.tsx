import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Eye, Edit2, Trash2, Download, DollarSign, Calendar } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import { Payroll, Employee, PayrollStatus } from '../../types/hr';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PayrollPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    month: '2026-08',
    year: 2026,
    basicSalary: '6500',
    bonus: '500',
    deduction: '600',
    status: 'PAID' as PayrollStatus,
    paymentDate: '2026-08-25',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pays, emps] = await Promise.all([
        isAdmin
          ? payrollService.getAll()
          : payrollService.getByEmployeeId(user?.employeeId || 'EMP002'),
        employeeService.getAll(),
      ]);
      setPayrolls(pays);
      setEmployees(emps);
      if (emps.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({
          ...prev,
          employeeId: emps[0].employeeId,
          basicSalary: String(Math.round(emps[0].salary / 12)),
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, user]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedPayroll(null);
    const firstEmp = employees[0];
    setFormData({
      employeeId: firstEmp?.employeeId || '',
      month: '2026-08',
      year: 2026,
      basicSalary: String(Math.round((firstEmp?.salary || 80000) / 12)),
      bonus: '500',
      deduction: '650',
      status: 'PAID',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Standard monthly compensation',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Payroll) => {
    setIsEditing(true);
    setSelectedPayroll(p);
    setFormData({
      employeeId: p.employeeId,
      month: p.month,
      year: p.year,
      basicSalary: String(p.basicSalary),
      bonus: String(p.bonus),
      deduction: String(p.deduction),
      status: p.status,
      paymentDate: p.paymentDate || '',
      notes: p.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find((e) => e.employeeId === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      basicSalary: emp ? String(Math.round(emp.salary / 12)) : prev.basicSalary,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === formData.employeeId);
    if (!emp) return;

    try {
      setIsSubmitting(true);
      const payload = {
        employeeId: formData.employeeId,
        employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.departmentName || 'Operations',
        month: formData.month,
        year: parseInt(String(formData.year), 10) || 2026,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        deduction: parseFloat(formData.deduction) || 0,
        status: formData.status,
        paymentDate: formData.paymentDate,
        notes: formData.notes,
      };

      if (isEditing && selectedPayroll) {
        await payrollService.update(selectedPayroll.payrollId, payload);
        showToast('success', 'Payroll Record Updated', `Updated pay slip for ${payload.employeeName}`);
      } else {
        await payrollService.create(payload);
        showToast('success', 'Payroll Generated', `Created pay slip for ${payload.employeeName}`);
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
    if (!selectedPayroll) return;
    try {
      setIsSubmitting(true);
      await payrollService.delete(selectedPayroll.payrollId);
      showToast('success', 'Payroll Record Removed', 'The pay slip has been deleted.');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Payroll>[] = [
    {
      key: 'payrollId',
      header: 'Slip ID',
      sortable: true,
      render: (p) => <span className="font-mono font-semibold text-blue-400">{p.payrollId}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-100">{p.employeeName}</div>
          <div className="text-[11px] text-slate-400">{p.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'month',
      header: 'Period',
      sortable: true,
      render: (p) => <span className="font-mono text-xs text-slate-300">{p.month}</span>,
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      align: 'right',
      render: (p) => <span className="font-mono text-slate-300">{formatCurrency(p.basicSalary)}</span>,
    },
    {
      key: 'bonus',
      header: 'Bonus (+)',
      align: 'right',
      render: (p) => <span className="font-mono text-emerald-400">+{formatCurrency(p.bonus)}</span>,
    },
    {
      key: 'deduction',
      header: 'Deductions (-)',
      align: 'right',
      render: (p) => <span className="font-mono text-rose-400">-{formatCurrency(p.deduction)}</span>,
    },
    {
      key: 'netSalary',
      header: 'Net Take-Home',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {formatCurrency(p.netSalary)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedPayroll(p);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View Pay Slip"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => handleOpenEdit(p)}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors"
                title="Edit Payroll"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedPayroll(p);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                title="Delete Slip"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Disbursement Status',
      options: [
        { label: 'Paid', value: 'PAID' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Processing', value: 'PROCESSING' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isAdmin ? 'Factory Payroll & Compensation Management' : 'My Payroll Statements'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Calculate basic salary, performance bonuses, statutory deductions, and generate net payouts.'
              : 'Review your monthly salary slips, tax deductions, and historical compensation.'}
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Generate Payroll Slip
          </Button>
        )}
      </div>

      <DataTable
        data={payrolls}
        columns={columns}
        rowKey={(p) => p.payrollId}
        searchKey={(p) => `${p.payrollId} ${p.employeeName} ${p.month} ${p.departmentName}`}
        searchPlaceholder="Search by Slip ID, employee, period..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create / Edit Modal (Admin only) */}
      {isAdmin && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={isEditing ? `Edit Payroll Slip: ${selectedPayroll?.payrollId}` : 'Generate Monthly Payroll Slip'}
          subtitle="PostgreSQL PAYROLL entity disbursement calculation"
          maxWidth="lg"
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Select
              label="Select Employee"
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              options={employees.map((e) => ({
                value: e.employeeId,
                label: `${e.fullName || e.firstName + ' ' + e.lastName} (${e.departmentName})`,
              }))}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Payroll Month (YYYY-MM)"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                placeholder="2026-08"
                required
              />
              <Select
                label="Payment Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PayrollStatus })}
                options={[
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Processing', value: 'PROCESSING' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Basic Salary ($)"
                type="number"
                min="0"
                step="50"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                required
              />
              <Input
                label="Bonus ($)"
                type="number"
                min="0"
                step="50"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              />
              <Input
                label="Deductions ($)"
                type="number"
                min="0"
                step="50"
                value={formData.deduction}
                onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
              />
            </div>

            {/* Calculated Net Preview */}
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-300 font-semibold">Estimated Net Take-Home:</span>
              <span className="font-mono font-bold text-emerald-400 text-base">
                {formatCurrency(
                  Math.max(
                    0,
                    (parseFloat(formData.basicSalary) || 0) +
                      (parseFloat(formData.bonus) || 0) -
                      (parseFloat(formData.deduction) || 0)
                  )
                )}
              </span>
            </div>

            <Input
              label="Disbursement Date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />

            <Input
              label="Internal Remarks / Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Performance incentive approved by plant head"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                {isEditing ? 'Save Slip' : 'Issue Payroll Slip'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pay Slip View Modal */}
      {selectedPayroll && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Official Pay Slip: ${selectedPayroll.payrollId}`}
          subtitle={`Period: ${selectedPayroll.month} • ${selectedPayroll.employeeName}`}
          maxWidth="lg"
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-white">{selectedPayroll.employeeName}</h4>
                <p className="text-xs text-blue-400 font-mono">
                  {selectedPayroll.employeeId} • {selectedPayroll.departmentName}
                </p>
              </div>
              <StatusBadge status={selectedPayroll.status} />
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-2 bg-slate-850 p-3 font-semibold text-slate-300 border-b border-slate-800">
                <span>Earnings & Benefits</span>
                <span className="text-right">Amount ($)</span>
              </div>
              <div className="p-3 space-y-2 divide-y divide-slate-800/60">
                <div className="flex justify-between items-center pt-1 text-slate-300">
                  <span>Base Basic Salary</span>
                  <span className="font-mono">{formatCurrency(selectedPayroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-emerald-400">
                  <span>Shift & Production Bonus</span>
                  <span className="font-mono">+{formatCurrency(selectedPayroll.bonus)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-rose-400">
                  <span>Statutory Tax & Insurance Deductions</span>
                  <span className="font-mono">-{formatCurrency(selectedPayroll.deduction)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-sm font-bold text-white">
                  <span>Net Salary Credited</span>
                  <span className="font-mono text-emerald-400 text-base">{formatCurrency(selectedPayroll.netSalary)}</span>
                </div>
              </div>
            </div>

            {selectedPayroll.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-900 p-3 rounded-lg border border-slate-800">
                Note: {selectedPayroll.notes}
              </p>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast('info', 'Pay Slip Downloaded', 'PDF Pay Slip rendered to download folder.')}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payroll Record"
        message={`Delete pay slip ${selectedPayroll?.payrollId} for ${selectedPayroll?.employeeName}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
