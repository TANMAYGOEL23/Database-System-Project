import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Account, JournalEntry, Expense } from '../types/accounting';

function mapAccountFromDb(row: any): Account {
  return {
    accountId: row.account_id || row.accountId,
    accountNumber: row.account_number || row.accountNumber,
    accountName: row.account_name || row.accountName,
    accountType: row.account_type || row.accountType,
    balance: parseFloat(row.balance || 0),
    description: row.description,
    status: row.status,
  };
}

function mapJEFromDb(row: any, lines: any[] = []): JournalEntry {
  return {
    entryId: row.entry_id || row.entryId,
    date: row.date,
    description: row.description,
    reference: row.reference,
    totalDebit: parseFloat(row.total_debit || row.totalDebit || 0),
    totalCredit: parseFloat(row.total_credit || row.totalCredit || 0),
    status: row.status,
    lines: lines.map((l) => ({
      lineId: l.line_id || l.lineId,
      accountId: l.account_id || l.accountId,
      accountName: l.account_name || l.accountName,
      debit: parseFloat(l.debit || 0),
      credit: parseFloat(l.credit || 0),
      memo: l.memo,
    })),
  };
}

function mapExpenseFromDb(row: any): Expense {
  return {
    expenseId: row.expense_id || row.expenseId,
    accountId: row.account_id || row.accountId,
    accountName: row.account_name || row.accountName,
    category: row.category,
    date: row.date,
    amount: parseFloat(row.amount || 0),
    description: row.description,
    paymentMethod: row.payment_method || row.paymentMethod,
    status: row.status,
    receiptRef: row.receipt_ref || row.receiptRef,
  };
}

export const accountingService = {
  async getAccounts(): Promise<Account[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('accounts').select('*').order('account_number');
      if (error) throw new Error(error.message);
      return (data || []).map(mapAccountFromDb);
    }

    await delay(200);
    return mockStorage.accounts;
  },

  async createAccount(account: Omit<Account, 'accountId'>): Promise<Account> {
    if (isSupabaseConfigured()) {
      const payload = {
        account_id: `ACC-${account.accountNumber}`,
        account_number: account.accountNumber,
        account_name: account.accountName,
        account_type: account.accountType,
        balance: account.balance || 0,
        description: account.description,
        status: 'ACTIVE',
      };
      const { data, error } = await supabase.from('accounts').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapAccountFromDb(data);
    }

    await delay(250);
    const newAcc: Account = {
      ...account,
      accountId: `ACC-${account.accountNumber}`,
      status: 'ACTIVE',
    };
    mockStorage.accounts = [...mockStorage.accounts, newAcc];
    return newAcc;
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (isSupabaseConfigured()) {
      const { data: entries, error } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      const { data: allLines } = await supabase.from('journal_entry_lines').select('*');

      return (entries || []).map((e) => {
        const matching = (allLines || []).filter((l) => l.entry_id === e.entry_id);
        return mapJEFromDb(e, matching);
      });
    }

    await delay(200);
    return mockStorage.journalEntries;
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'entryId' | 'totalDebit' | 'totalCredit'>): Promise<JournalEntry> {
    const totalDebit = entry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = entry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Double-Entry balance error: Total Debits must equal Total Credits');
    }

    if (isSupabaseConfigured()) {
      const jePayload = {
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'POSTED',
      };

      const { data: createdJE, error: jeErr } = await supabase.from('journal_entries').insert([jePayload]).select().single();
      if (jeErr) throw new Error(jeErr.message);

      const linesPayload = entry.lines.map((l) => ({
        entry_id: createdJE.entry_id,
        account_id: l.accountId,
        account_name: l.accountName,
        debit: l.debit,
        credit: l.credit,
        memo: l.memo,
      }));

      const { data: createdLines, error: lErr } = await supabase.from('journal_entry_lines').insert(linesPayload).select();
      if (lErr) throw new Error(lErr.message);

      return mapJEFromDb(createdJE, createdLines || []);
    }

    await delay(350);
    const newJE: JournalEntry = {
      ...entry,
      entryId: `JE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      totalDebit,
      totalCredit,
      status: 'POSTED',
    };
    mockStorage.journalEntries = [newJE, ...mockStorage.journalEntries];
    return newJE;
  },

  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapExpenseFromDb);
    }

    await delay(200);
    return mockStorage.expenses;
  },

  async createExpense(expense: Omit<Expense, 'expenseId'>): Promise<Expense> {
    if (isSupabaseConfigured()) {
      const payload = {
        account_id: expense.accountId,
        account_name: expense.accountName,
        category: expense.category,
        date: expense.date,
        amount: expense.amount,
        description: expense.description,
        payment_method: expense.paymentMethod,
        status: expense.status || 'APPROVED',
        receipt_ref: expense.receiptRef,
      };

      const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapExpenseFromDb(data);
    }

    await delay(300);
    const newExp: Expense = {
      ...expense,
      expenseId: `EXP-${Math.floor(100 + Math.random() * 900)}`,
    };
    mockStorage.expenses = [newExp, ...mockStorage.expenses];
    return newExp;
  },
};
