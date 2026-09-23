import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, DollarSign, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { Account, AccountType } from '../../types/accounting';
import { formatCurrency } from '../../utils/formatters';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('ASSET');
  const [balance, setBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await accountingService.getAccounts();
      setAccounts(data);
    } catch (e: any) {
      showToast('error', 'Error Loading Chart of Accounts', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setAccountNumber(String(Math.floor(1000 + Math.random() * 8999)));
    setAccountName('');
    setAccountType('ASSET');
    setBalance('0');
    setDescription('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !accountNumber.trim()) {
      showToast('error', 'Missing Information', 'Account number and title are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await accountingService.createAccount({
        accountNumber,
        accountName,
        accountType,
        balance: parseFloat(balance) || 0,
        description,
      });

      showToast('success', 'Account Added', `GL Account ${accountNumber} (${accountName}) registered.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Account Creation Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountTypeBadge = (type: AccountType) => {
    const map: Record<AccountType, { bg: string; text: string; border: string }> = {
      ASSET: { bg: 'bg-emerald-950', text: 'text-emerald-300', border: 'border-emerald-800' },
      LIABILITY: { bg: 'bg-rose-950', text: 'text-rose-300', border: 'border-rose-800' },
      EQUITY: { bg: 'bg-indigo-950', text: 'text-indigo-300', border: 'border-indigo-800' },
      REVENUE: { bg: 'bg-blue-950', text: 'text-blue-300', border: 'border-blue-800' },
      EXPENSE: { bg: 'bg-amber-950', text: 'text-amber-300', border: 'border-amber-800' },
    };
    const c = map[type] || map.ASSET;
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${c.bg} ${c.text} border ${c.border}`}>
        {type}
      </span>
    );
  };

  const columns: Column<Account>[] = [
    {
      key: 'accountNumber',
      header: 'GL Code',
      sortable: true,
      render: (a) => <span className="font-mono text-xs font-semibold text-blue-400">{a.accountNumber}</span>,
    },
    {
      key: 'accountName',
      header: 'Account Name & Description',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            {a.accountName}
          </div>
          <div className="text-[11px] text-slate-400">{a.description || 'General Ledger Account'}</div>
        </div>
      ),
    },
    {
      key: 'accountType',
      header: 'Financial Category',
      sortable: true,
      render: (a) => getAccountTypeBadge(a.accountType),
    },
    {
      key: 'balance',
      header: 'General Ledger Balance ($)',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span
          className={`font-mono font-bold text-xs ${
            a.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatCurrency(a.balance)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Ledger State',
      render: (a) => <StatusBadge status={a.status || 'ACTIVE'} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'accountType',
      label: 'Account Classification',
      options: [
        { label: 'Assets', value: 'ASSET' },
        { label: 'Liabilities', value: 'LIABILITY' },
        { label: 'Equity', value: 'EQUITY' },
        { label: 'Revenue', value: 'REVENUE' },
        { label: 'Expenses', value: 'EXPENSE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Chart of Accounts & General Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise double-entry ledger accounts, asset valuations, operating reserves, and revenue classifications.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Add Ledger Account
        </Button>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        rowKey={(a) => a.accountId}
        searchKey={(a) => `${a.accountNumber} ${a.accountName} ${a.accountType}`}
        searchPlaceholder="Filter accounts by GL code or title..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Account Creation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add General Ledger Account"
        subtitle="ACCOUNTS relational chart schema"
        maxWidth="md"
        icon={<BookOpen className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GL Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 1010"
              required
            />
            <Select
              label="Account Classification"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              options={[
                { label: 'Asset (Cash, Inventory, Equipment)', value: 'ASSET' },
                { label: 'Liability (Payables, Loans)', value: 'LIABILITY' },
                { label: 'Equity (Capital, Retained Earnings)', value: 'EQUITY' },
                { label: 'Revenue (Sales, Contracts)', value: 'REVENUE' },
                { label: 'Expense (OPEX, Maintenance)', value: 'EXPENSE' },
              ]}
              required
            />
          </div>

          <Input
            label="Account Title"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Direct Material Inventory Asset"
            required
          />

          <Input
            label="Initial Starting Balance ($)"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          <Input
            label="Description / Reporting Subgroup"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Current asset valuation for raw metals"
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
