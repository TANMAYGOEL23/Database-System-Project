import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, IndianRupee, Tag, Calendar, FileText, CheckCircle } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { Expense, Account } from '../../types/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CATEGORIES = ['Utilities & Power', 'Maintenance & Spares', 'Factory Supplies', 'Logistics & Freight', 'IT & Software', 'Administrative'];

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('250.00');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [receiptRef, setReceiptRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expList, accList] = await Promise.all([
        accountingService.getExpenses(),
        accountingService.getAccounts(),
      ]);
      setExpenses(expList);
      setAccounts(accList);
      if (accList.length > 0 && !selectedAccountId) {
        const expAcc = accList.find((a) => a.accountType === 'EXPENSE') || accList[0];
        setSelectedAccountId(expAcc.accountId);
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

  const handleOpenCreate = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReceiptRef(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
    setAmount('350.00');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find((a) => a.accountId === selectedAccountId);
    if (!acc) return;

    try {
      setIsSubmitting(true);
      await accountingService.createExpense({
        accountId: acc.accountId,
        accountName: acc.accountName,
        category,
        date,
        amount: parseFloat(amount) || 0,
        description,
        paymentMethod,
        status: 'APPROVED',
        receiptRef,
      });

      showToast('success', 'Expense Recorded', `Disbursed ${formatCurrency(parseFloat(amount))} from ${acc.accountName}.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Failed to Log Expense', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Expense>[] = [
    {
      key: 'expenseId',
      header: 'Voucher Ref',
      sortable: true,
      render: (e) => <span className="font-mono text-xs font-semibold text-blue-400">{e.expenseId}</span>,
    },
    {
      key: 'description',
      header: 'Expense Item & Description',
      sortable: true,
      render: (e) => (
        <div>
          <div className="font-semibold text-slate-100">{e.description}</div>
          <div className="text-[11px] font-mono text-slate-400">Account: {e.accountName} • Ref: {e.receiptRef}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'OPEX Category',
      sortable: true,
      render: (e) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {e.category}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (e) => (
        <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          {e.paymentMethod}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid (₹)',
      sortable: true,
      align: 'right',
      render: (e) => (
        <span className="font-mono font-bold text-xs text-rose-400">
          {formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Disbursement Date',
      sortable: true,
      render: (e) => <span className="font-mono text-xs text-slate-400">{formatDate(e.date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Expense Type',
      options: CATEGORIES.map((c) => ({ label: c, value: c })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Operating Expenses (OPEX) & Disbursements</h2>
          <p className="text-xs text-slate-400 mt-1">
            Factory overhead vouchers, power grid billing, preventive maintenance tooling costs, and vendor settlements.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Log Expense Voucher
        </Button>
      </div>

      <DataTable
        data={expenses}
        columns={columns}
        rowKey={(e) => e.expenseId}
        searchKey={(e) => `${e.expenseId} ${e.description} ${e.accountName} ${e.category}`}
        searchPlaceholder="Filter expenses by description, receipt ref, or category..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Expense Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Operating Expense Disbursement"
        subtitle="EXPENSES relational schema voucher"
        maxWidth="lg"
        icon={<CreditCard className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Expense Description / Memo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. High-Voltage Substation Monthly Transformer Service"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="OPEX Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
              required
            />
            <Select
              label="Debit General Ledger Account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              options={accounts.map((a) => ({ label: `${a.accountNumber} - ${a.accountName}`, value: a.accountId }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Amount Paid (₹)"
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label="Payment Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { label: 'Bank Transfer / ACH', value: 'BANK_TRANSFER' },
                { label: 'Corporate Credit Card', value: 'CREDIT_CARD' },
                { label: 'Company Cheque', value: 'CHEQUE' },
                { label: 'Petty Cash', value: 'CASH' },
              ]}
              required
            />
          </div>

          <Input
            label="Receipt / Invoice Reference No."
            value={receiptRef}
            onChange={(e) => setReceiptRef(e.target.value)}
            placeholder="e.g. VEND-INV-8839"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Post Expense Disbursement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
