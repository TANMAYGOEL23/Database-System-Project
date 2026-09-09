import React, { useState, useEffect } from 'react';
import { Plus, Receipt, DollarSign, Calendar, CreditCard, PieChart } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { Expense, Account } from '../../types/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';

const EXPENSE_CATEGORIES = [
  'Utilities',
  'Equipment Maintenance',
  'Automation Spares',
  'Raw Materials Freight',
  'Facility Rent & Security',
  'Software & IT Licenses',
];

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    amount: '1200',
    description: '',
    paymentMethod: 'BANK_TRANSFER' as Expense['paymentMethod'],
    receiptRef: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [exps, accs] = await Promise.all([
        accountingService.getExpenses(),
        accountingService.getAccounts(),
      ]);
      setExpenses(exps);
      setAccounts(accs);
      if (accs.length > 0 && !formData.accountId) {
        const expAcc = accs.find((a) => a.accountType === 'EXPENSE') || accs[0];
        setFormData((prev) => ({ ...prev, accountId: expAcc.accountId }));
      }
    } catch (e: any) {
      showToast('error', 'Error Loading Expenses', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    const acc = accounts.find((a) => a.accountId === formData.accountId);

    try {
      setIsSubmitting(true);
      const newExp = await accountingService.createExpense({
        accountId: formData.accountId,
        accountName: acc?.accountName || 'Operational Expense',
        category: formData.category,
        date: formData.date,
        amount: parseFloat(formData.amount) || 0,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        status: 'APPROVED',
        receiptRef: formData.receiptRef,
      });

      showToast('success', 'Expense Recorded', `Expense of ${formatCurrency(newExp.amount)} posted to ${newExp.accountName}.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Recording Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Expense>[] = [
    {
      key: 'expenseId',
      header: 'Expense ID',
      sortable: true,
      render: (e) => <span className="font-mono font-semibold text-rose-400">{e.expenseId}</span>,
    },
    {
      key: 'description',
      header: 'Expenditure Memo',
      sortable: true,
      render: (e) => (
        <div>
          <div className="font-semibold text-slate-100">{e.description}</div>
          <div className="text-[11px] font-mono text-slate-400">{e.accountName} {e.receiptRef ? `• Ref: ${e.receiptRef}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (e) => <span className="text-xs text-slate-300">{e.category}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Disbursement Method',
      render: (e) => <span className="text-xs text-slate-400 font-mono">{e.paymentMethod.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'date',
      header: 'Date Incurred',
      sortable: true,
      render: (e) => <span className="font-mono text-xs text-slate-400">{formatDate(e.date)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount ($)',
      sortable: true,
      align: 'right',
      render: (e) => (
        <span className="font-mono font-bold text-rose-400 text-sm">
          {formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Approval',
      sortable: true,
      render: (e) => <StatusBadge status={e.status} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Expense Categories',
      options: EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Methods',
      options: [
        { label: 'Bank Wire Transfer', value: 'BANK_TRANSFER' },
        { label: 'Corporate Card', value: 'CREDIT_CARD' },
        { label: 'Petty Cash', value: 'CASH' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Plant Operational Expenses (OPEX)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track utility bills, tooling replacements, AMR robot spare parts, and general plant overheads.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Expense
        </Button>
      </div>

      <DataTable
        data={expenses}
        columns={columns}
        rowKey={(e) => e.expenseId}
        searchKey={(e) => `${e.expenseId} ${e.description} ${e.category} ${e.accountName}`}
        searchPlaceholder="Search expenses by memo, category..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Operational Expenditure"
        subtitle="PostgreSQL EXPENSE entity tracking"
        maxWidth="lg"
        icon={<Receipt className="w-5 h-5 text-rose-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Expense Narrative / Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. DTE 3-Phase Industrial Electricity Bill"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Ledger Account"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              options={accounts.map((a) => ({
                label: `${a.accountNumber} - ${a.accountName}`,
                value: a.accountId,
              }))}
              required
            />
            <Select
              label="Expense Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input
              label="Date Incurred"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              options={[
                { label: 'Bank Wire Transfer', value: 'BANK_TRANSFER' },
                { label: 'Corporate Credit Card', value: 'CREDIT_CARD' },
                { label: 'Petty Cash', value: 'CASH' },
                { label: 'Cheque / Draft', value: 'CHEQUE' },
              ]}
              required
            />
          </div>

          <Input
            label="Vendor Receipt / Invoice Reference"
            value={formData.receiptRef}
            onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
            placeholder="e.g. REC-DTE-88129"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
