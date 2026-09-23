import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, CheckCircle, Scale, RefreshCw } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { JournalEntry, Account } from '../../types/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const JournalEntries: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<{ accountId: string; accountName: string; debit: number; credit: number; memo?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line adder
  const [lineAccountId, setLineAccountId] = useState('');
  const [lineDebit, setLineDebit] = useState('0');
  const [lineCredit, setLineCredit] = useState('0');
  const [lineMemo, setLineMemo] = useState('');

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jeList, accList] = await Promise.all([
        accountingService.getJournalEntries(),
        accountingService.getAccounts(),
      ]);
      setEntries(jeList);
      setAccounts(accList);
      if (accList.length > 0 && !lineAccountId) setLineAccountId(accList[0].accountId);
    } catch (e: any) {
      showToast('error', 'Error Loading Journal Entries', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    const acc = accounts.find((a) => a.accountId === lineAccountId);
    if (!acc) return;
    const d = parseFloat(lineDebit) || 0;
    const c = parseFloat(lineCredit) || 0;

    if (d === 0 && c === 0) {
      showToast('error', 'Invalid Line', 'Please enter a non-zero Debit or Credit amount.');
      return;
    }

    setLines([
      ...lines,
      {
        accountId: acc.accountId,
        accountName: acc.accountName,
        debit: d,
        credit: c,
        memo: lineMemo,
      },
    ]);
    setLineDebit('0');
    setLineCredit('0');
    setLineMemo('');
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleOpenCreate = () => {
    setLines([]);
    setDescription('');
    setReference(`JE-REF-${Math.floor(1000 + Math.random() * 9000)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setIsCreateOpen(true);
  };

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = lines.length >= 2 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast('error', 'Unbalanced Journal Entry', 'Total Debits must exactly equal Total Credits (Double-Entry Bookkeeping).');
      return;
    }

    try {
      setIsSubmitting(true);
      await accountingService.createJournalEntry({
        date,
        description,
        reference,
        lines,
      });

      showToast('success', 'Journal Entry Posted', `Transaction reference ${reference} posted.`);
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) {
      showToast('error', 'Posting Failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<JournalEntry>[] = [
    {
      key: 'entryId',
      header: 'Entry Voucher',
      sortable: true,
      render: (j) => <span className="font-mono text-xs font-semibold text-blue-400">{j.entryId}</span>,
    },
    {
      key: 'description',
      header: 'Memo / Journal Purpose',
      sortable: true,
      render: (j) => (
        <div>
          <div className="font-semibold text-slate-100">{j.description}</div>
          <div className="text-[11px] font-mono text-slate-400">Ref: {j.reference}</div>
        </div>
      ),
    },
    {
      key: 'lines',
      header: 'Ledger Lines (Debit / Credit)',
      render: (j) => (
        <div className="text-xs space-y-0.5">
          {j.lines.map((l, idx) => (
            <div key={idx} className="font-mono text-[11px] flex items-center justify-between text-slate-300">
              <span>{l.accountName || l.accountId}:</span>
              <span className={l.debit > 0 ? 'text-emerald-400 font-semibold' : 'text-blue-400'}>
                {l.debit > 0 ? `DR: ${formatCurrency(l.debit)}` : `CR: ${formatCurrency(l.credit)}`}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'totalDebit',
      header: 'Total Value ($)',
      sortable: true,
      align: 'right',
      render: (j) => (
        <span className="font-mono font-bold text-xs text-white">
          {formatCurrency(j.totalDebit)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Posting Date',
      sortable: true,
      render: (j) => <span className="font-mono text-xs text-slate-400">{formatDate(j.date)}</span>,
    },
    {
      key: 'status',
      header: 'Audit Status',
      render: (j) => <StatusBadge status={j.status || 'POSTED'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Double-Entry General Journal Entries</h2>
          <p className="text-xs text-slate-400 mt-1">
            Formal double-entry balancing vouchers with audit references and automated ledger verification.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Post Journal Voucher
        </Button>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        rowKey={(j) => j.entryId}
        searchKey={(j) => `${j.entryId} ${j.description} ${j.reference}`}
        searchPlaceholder="Filter journal vouchers by voucher ID or memo..."
        isLoading={isLoading}
      />

      {/* Journal Entry Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post Double-Entry Journal Voucher"
        subtitle="JOURNAL_ENTRIES & LINES relational transaction"
        maxWidth="lg"
        icon={<Scale className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Audit Document Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
            />
          </div>

          <Input
            label="Transaction Description / Memo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly Machinery Depreciation & Amortization"
            required
          />

          {/* Line adder */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Debit / Credit Line Items</h4>
              <div className="text-xs font-mono">
                DR: <span className="text-emerald-400 font-bold">{formatCurrency(totalDebit)}</span> | CR: <span className="text-blue-400 font-bold">{formatCurrency(totalCredit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <Select
                  label="Target Ledger Account"
                  value={lineAccountId}
                  onChange={(e) => setLineAccountId(e.target.value)}
                  options={accounts.map((a) => ({ label: `${a.accountNumber} - ${a.accountName}`, value: a.accountId }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Debit ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lineDebit}
                  onChange={(e) => setLineDebit(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Credit ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lineCredit}
                  onChange={(e) => setLineCredit(e.target.value)}
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="button" variant="secondary" onClick={handleAddLine} className="w-full">
                  Add Line
                </Button>
              </div>
            </div>

            {/* Rendered Lines */}
            {lines.length > 0 && (
              <div className="mt-3 border-t border-slate-800 pt-3 space-y-2 max-h-40 overflow-y-auto">
                {lines.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/40 p-2 rounded">
                    <div>
                      <span className="font-semibold text-white">{l.accountName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {l.debit > 0 && <span className="font-mono text-emerald-400 font-bold">DR: {formatCurrency(l.debit)}</span>}
                      {l.credit > 0 && <span className="font-mono text-blue-400 font-bold">CR: {formatCurrency(l.credit)}</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={!isBalanced}>
              {isBalanced ? 'Post Voucher to General Ledger' : 'Entry Unbalanced (DR ≠ CR)'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
