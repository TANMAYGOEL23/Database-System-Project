import React, { useState, useEffect } from 'react';
import { Plus, Receipt, IndianRupee, Calendar, Eye, Printer, CheckCircle2 } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import { Payroll, Employee } from '../../types/hr';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    month: 'September',
    year: '2026',
    bonus: '500',
    deduction: '250',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [payList, empList] = await Promise.all([
        payrollService.getAll(),
        employeeService.getAll(),
      ]);
      setPayrolls(payList);
      setEmployees(empList);
      if (empList.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: empList[0].employeeId }));
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Payroll', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenGenerate = () => {
    setFormData({
      employeeId: employees[0]?.employeeId || '',
      month: 'September',
      year: '2026',
      bonus: '500',
      deduction: '250',
    });
    setIsGenerateOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return;

    try {
      setIsSubmitting(true);
      const newPay = await payrollService.generatePayroll(
        formData.employeeId,
        formData.month,
        parseInt(formData.year, 10) || 2026,
        parseFloat(formData.bonus) || 0,
        parseFloat(formData.deduction) || 0
      );

      showToast('success', 'Pay Slip Generated', `Generated for ${newPay.employeeName} (${formatCurrency(newPay.netSalary)})`);
      setIsGenerateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Generation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Payroll>[] = [
    {
      key: 'payrollId',
      header: 'Pay Slip ID',
      sortable: true,
      render: (p) => <span className="font-mono font-semibold text-blue-400">{p.payrollId}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee Staff',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-100">{p.employeeName}</div>
          <div className="text-[11px] font-mono text-slate-400">{p.employeeId} • {p.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Pay Period',
      render: (p) => <span className="font-mono text-xs text-slate-300">{p.month} {p.year}</span>,
    },
    {
      key: 'basicSalary',
      header: 'Basic Monthly (₹)',
      sortable: true,
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-slate-300">{formatCurrency(p.basicSalary)}</span>,
    },
    {
      key: 'netSalary',
      header: 'Net Take-Home (₹)',
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
      header: 'Disbursement',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: 'Pay Slip',
      align: 'right',
      render: (p) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedPayroll(p);
            setIsDetailOpen(true);
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View Slip
        </Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Paid', value: 'PAID' },
        { label: 'Pending Processing', value: 'PENDING' },
      ],
    },
    {
      key: 'month',
      label: 'Month',
      options: [
        { label: 'September', value: 'September' },
        { label: 'August', value: 'August' },
        { label: 'July', value: 'July' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Workforce Payroll & Compensation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate statutory withholdings, performance bonuses, net disbursements, and generate pay slips.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenGenerate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Generate Pay Slip
        </Button>
      </div>

      <DataTable
        data={payrolls}
        columns={columns}
        rowKey={(p) => p.payrollId}
        searchKey={(p) => `${p.payrollId} ${p.employeeName} ${p.employeeId} ${p.departmentName}`}
        searchPlaceholder="Search payroll records..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Monthly Pay Slip"
        subtitle="PostgreSQL PAYROLL relational calculation"
        maxWidth="md"
        icon={<Receipt className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <Select
            label="Target Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            options={employees.map((emp) => ({
              label: `${emp.fullName || emp.firstName + ' ' + emp.lastName} (${formatCurrency(emp.salary)} / yr)`,
              value: emp.employeeId,
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Pay Month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              options={[
                { label: 'September', value: 'September' },
                { label: 'August', value: 'August' },
                { label: 'July', value: 'July' },
                { label: 'June', value: 'June' },
              ]}
              required
            />
            <Input
              label="Fiscal Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Performance Bonus (₹)"
              type="number"
              value={formData.bonus}
              onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              required
            />
            <Input
              label="Statutory Deductions (₹)"
              type="number"
              value={formData.deduction}
              onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsGenerateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Disburse & Post
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Slip View Modal */}
      {selectedPayroll && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Pay Slip: ${selectedPayroll.payrollId}`}
          subtitle={`${selectedPayroll.employeeName} • ${selectedPayroll.month} ${selectedPayroll.year}`}
          maxWidth="lg"
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white">{selectedPayroll.employeeName}</h4>
                <p className="text-xs text-slate-400 font-mono">{selectedPayroll.employeeId} • {selectedPayroll.departmentName}</p>
              </div>
              <StatusBadge status={selectedPayroll.status} />
            </div>

            <div className="space-y-2 border border-slate-800 rounded-xl p-4 bg-slate-950/40 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-slate-300">
                <span>Basic Monthly Salary:</span>
                <span className="font-bold text-slate-100">{formatCurrency(selectedPayroll.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-emerald-400">
                <span>Production / Shift Bonus:</span>
                <span>+{formatCurrency(selectedPayroll.bonus)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-rose-400">
                <span>Tax & Healthcare Deductions:</span>
                <span>-{formatCurrency(selectedPayroll.deduction)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-white pt-2">
                <span>Net Transferred Take-Home:</span>
                <span className="text-emerald-400 text-base">{formatCurrency(selectedPayroll.netSalary)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast('info', 'Print Spooler', 'Pay slip dispatched to secure printer.')}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
