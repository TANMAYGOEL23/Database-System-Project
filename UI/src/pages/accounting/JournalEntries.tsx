import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Eye, CheckCircle2, AlertTriangle, X, BookOpen, Scale } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { accountingService } from '../../services/accountingService';
import { JournalEntry, JournalEntryLine, Account } from '../../types/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const JournalEntries: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('JE-MANUAL-01');
  const [lines, setLines] = useState<JournalEntryLine[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jes, accs] = await Promise.all([
        accountingService.getJournalEntries(),
        accountingService.getAccounts(),
      ]);
      setEntries(jes);
      setAccounts(accs);
    } catch (e: any) {
      showToast('error', 'Error Loading Journal Entries', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEntryDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReference(`JE-REF-${Math.floor(1000 + Math.random() * 9000)}`);
    if (accounts.length >= 2) {
      setLines([
        { accountId: accounts[0].accountId, accountName: accounts[0].accountName, debit: 5000, credit: 0, memo: 'Debit line' },
        { accountId: accounts[1].accountId, accountName: accounts[1].accountName, debit: 0, credit: 5000, memo: 'Credit line' },
      ]);
    } else {
      setLines([]);
    }
    setIsCreateOpen(true);
  };

  const handleAddLine = () => {
    if (accounts.length === 0) return;
    const defaultAcc = accounts[0];
    setLines([
      ...lines,
      {
        accountId: defaultAcc.accountId,
        accountName: defaultAcc.accountName,
        debit: 0,
        credit: 0,
        memo: '',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'accountId' | 'debit' | 'credit' | 'memo', value: any) => {
    const updated = [...lines];
    const target = { ...updated[idx] };

    if (field === 'accountId') {
      const acc = accounts.find((a) => a.accountId === value);
      target.accountId = value;
      target.accountName = acc ? acc.accountName : value;
    } else if (field === 'debit') {
      target.debit = Math.max(0, parseFloat(value) || 0);
      if (target.debit > 0) target.credit = 0; // standard single side per line
    } else if (field === 'credit') {
      target.credit = Math.max(0, parseFloat(value) || 0);
      if (target.credit > 0) target.debit = 0;
    } else if (field === 'memo') {
      target.memo = value;
    }

    updated[idx] = target;
    setLines(updated);
  };

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('error', 'Validation Error', 'Description memo is required');
      return;
    }

    if (!isBalanced) {
      showToast(
        'error',
        'Double-Entry Unbalanced',
        `Debits ($${totalDebit.toFixed(2)}) must exactly equal Credits ($${totalCredit.toFixed(2)})`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const newEntry = await accountingService.createJournalEntry({
        date: entryDate,
        description,
        reference,
        lines,
      });

      showToast('success', 'Journal Entry Posted', `JE ${newEntry.entryId} posted to ledger.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Posting Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<JournalEntry>[] = [
    {
      key: 'entryId',
      header: 'Entry ID',
      sortable: true,
      render: (e) => <span className="font-mono font-semibold text-blue-400">{e.entryId}</span>,
    },
    {
      key: 'description',
      header: 'Transaction Narrative',
      sortable: true,
      render: (e) => (
        <div>
          <div className="font-semibold text-slate-100">{e.description}</div>
          <div className="text-[11px] font-mono text-slate-400">Ref: {e.reference}</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Posting Date',
      sortable: true,
      render: (e) => <span className="font-mono text-xs text-slate-300">{formatDate(e.date)}</span>,
    },
    {
      key: 'totalDebit',
      header: 'Total Debit ($)',
      sortable: true,
      align: 'right',
      render: (e) => <span className="font-mono font-bold text-slate-200">{formatCurrency(e.totalDebit)}</span>,
    },
    {
      key: 'totalCredit',
      header: 'Total Credit ($)',
      sortable: true,
      align: 'right',
      render: (e) => <span className="font-mono font-bold text-slate-200">{formatCurrency(e.totalCredit)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status || 'POSTED'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedEntry(e);
            setIsDetailOpen(true);
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View Ledger Lines
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Double-Entry Journal Entries</h2>
          <p className="text-xs text-slate-400 mt-1">
            General ledger postings requiring balanced debits and credits across chart of accounts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Journal Entry
        </Button>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        rowKey={(e) => e.entryId}
        searchKey={(e) => `${e.entryId} ${e.description} ${e.reference}`}
        searchPlaceholder="Search journal entries..."
        isLoading={isLoading}
      />

      {/* Create Modal with Double-Entry Validator */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post New Double-Entry Journal Transaction"
        subtitle="PostgreSQL JOURNAL_ENTRY & JOURNAL_ENTRY_LINE schema validation"
        maxWidth="3xl"
        icon={<Scale className="w-5 h-5 text-blue-400" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction Narrative / Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Accrue monthly industrial electricity expense"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Posting Date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
              <Input
                label="Reference Document"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="REF-001"
                required
              />
            </div>
          </div>

          {/* Dynamic Lines */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Double-Entry Ledger Lines ({lines.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddLine}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Line
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Account</label>
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-slate-200 focus:outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.accountId} value={acc.accountId}>
                          {acc.accountNumber} - {acc.accountName} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Debit ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.debit || ''}
                      onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-emerald-400 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Credit ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.credit || ''}
                      onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded bg-slate-950 border border-slate-700 text-xs py-1.5 px-2 text-blue-400 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance Indicator Bar */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Balanced: Debits Equal Credits
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Unbalanced: Difference ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span>
                  Total Debit: <strong className="text-emerald-400 font-bold">{formatCurrency(totalDebit)}</strong>
                </span>
                <span>
                  Total Credit: <strong className="text-blue-400 font-bold">{formatCurrency(totalCredit)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={!isBalanced}>
              Post to General Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Journal Entry: ${selectedEntry.entryId}`}
          subtitle={`${selectedEntry.description} • Date: ${formatDate(selectedEntry.date)}`}
          maxWidth="2xl"
          icon={<BookOpen className="w-5 h-5 text-blue-400" />}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">{selectedEntry.description}</h4>
                <p className="text-xs text-slate-400 font-mono">Reference: {selectedEntry.reference}</p>
              </div>
              <StatusBadge status={selectedEntry.status || 'POSTED'} />
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-850 text-slate-400 font-semibold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">GL Account</th>
                    <th className="p-3 text-right">Debit ($)</th>
                    <th className="p-3 text-right">Credit ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedEntry.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-200">
                        {line.accountName || line.accountId}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                        {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-blue-400">
                        {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Total Balanced Ledger Postings:</span>
              <span className="font-bold text-slate-100 text-sm">{formatCurrency(selectedEntry.totalDebit)}</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
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
