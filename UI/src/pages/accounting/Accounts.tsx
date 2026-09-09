import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, DollarSign, Layers, CheckCircle2 } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { Account, AccountType } from '../../types/accounting';
import { formatCurrency } from '../../utils/formatters';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountNumber: '1050',
    accountName: '',
    accountType: 'ASSET' as AccountType,
    balance: '0',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await accountingService.getAccounts();
      setAccounts(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Accounts', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName.trim()) return;

    try {
      setIsSubmitting(true);
      await accountingService.createAccount({
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        accountType: formData.accountType,
        balance: parseFloat(formData.balance) || 0,
        description: formData.description,
      });

      showToast('success', 'Ledger Account Created', `${formData.accountName} (${formData.accountNumber}) added to chart of accounts.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountTypeBadgeClass = (type: AccountType) => {
    switch (type) {
      case 'ASSET':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'LIABILITY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'EQUITY':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'REVENUE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'EXPENSE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const columns: Column<Account>[] = [
    {
      key: 'accountNumber',
      header: 'GL Code',
      sortable: true,
      render: (a) => <span className="font-mono font-bold text-blue-400">{a.accountNumber}</span>,
    },
    {
      key: 'accountName',
      header: 'Ledger Account Name',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-100">{a.accountName}</div>
          <div className="text-[11px] text-slate-400">{a.description || 'Standard GL Account'}</div>
        </div>
      ),
    },
    {
      key: 'accountType',
      header: 'Account Category',
      sortable: true,
      render: (a) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${getAccountTypeBadgeClass(a.accountType)}`}>
          {a.accountType}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Ledger Balance ($)',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span className="font-mono font-bold text-sm text-slate-100">
          {formatCurrency(a.balance)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status || 'ACTIVE'} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'accountType',
      label: 'Account Types',
      options: [
        { label: 'Asset Accounts', value: 'ASSET' },
        { label: 'Liability Accounts', value: 'LIABILITY' },
        { label: 'Equity Accounts', value: 'EQUITY' },
        { label: 'Revenue Accounts', value: 'REVENUE' },
        { label: 'Expense Accounts', value: 'EXPENSE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Chart of Accounts (General Ledger)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard double-entry accounting hierarchy: Assets, Liabilities, Equities, Revenues, and Factory Expenses.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Account
        </Button>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        rowKey={(a) => a.accountId}
        searchKey={(a) => `${a.accountNumber} ${a.accountName} ${a.accountType}`}
        searchPlaceholder="Search accounts by GL code, title, type..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Create Account Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Define General Ledger Account"
        subtitle="PostgreSQL ACCOUNT relational schema entity"
        maxWidth="md"
        icon={<BookOpen className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GL Account Code"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="e.g. 1050"
              required
            />
            <Select
              label="Account Classification"
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
              options={[
                { label: 'ASSET (Cash, AR, Inventory)', value: 'ASSET' },
                { label: 'LIABILITY (AP, Accrued Payroll)', value: 'LIABILITY' },
                { label: 'EQUITY (Owner Capital, Retained)', value: 'EQUITY' },
                { label: 'REVENUE (Sales, Invoicing)', value: 'REVENUE' },
                { label: 'EXPENSE (COGS, Power, Repair)', value: 'EXPENSE' },
              ]}
              required
            />
          </div>

          <Input
            label="Account Title"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            placeholder="e.g. Spindle Tooling Spare Parts Reserve"
            required
          />

          <Input
            label="Opening Balance ($)"
            type="number"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            required
          />

          <Input
            label="Description / Purpose"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Financial accounting memo"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
