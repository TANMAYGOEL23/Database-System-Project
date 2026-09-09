import { apiClient, simulateLatency } from './api';
import { Account, JournalEntry, Expense } from '../types/accounting';
import { mockDb } from './mockStorage';

export const accountingService = {
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await apiClient.get<Account[]>('/accounting/accounts');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getAccounts();
    }
  },

  async createAccount(acc: Omit<Account, 'accountId'>): Promise<Account> {
    try {
      const response = await apiClient.post<Account>('/accounting/accounts', acc);
      return response.data;
    } catch {
      await simulateLatency(200);
      const accounts = mockDb.getAccounts();
      const newId = `ACC${String(accounts.length + 101)}`;
      const newAcc: Account = {
        ...acc,
        accountId: newId,
        balance: acc.balance || 0,
        status: 'ACTIVE',
      };
      mockDb.setAccounts([...accounts, newAcc]);
      return newAcc;
    }
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const response = await apiClient.get<JournalEntry[]>('/accounting/journal-entries');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getJournalEntries();
    }
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'entryId' | 'totalDebit' | 'totalCredit'>): Promise<JournalEntry> {
    try {
      const response = await apiClient.post<JournalEntry>('/accounting/journal-entries', entry);
      return response.data;
    } catch {
      await simulateLatency(300);
      const entries = mockDb.getJournalEntries();
      const totalDebit = entry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = entry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Double-entry unbalanced: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`);
      }

      const newId = `JE-2026-${String(entries.length + 4).padStart(3, '0')}`;
      const newEntry: JournalEntry = {
        ...entry,
        entryId: newId,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        lines: entry.lines.map((l, idx) => ({
          ...l,
          lineId: `JEL-${newId}-${idx + 1}`,
        })),
      };

      mockDb.setJournalEntries([newEntry, ...entries]);
      return newEntry;
    }
  },

  async getExpenses(): Promise<Expense[]> {
    try {
      const response = await apiClient.get<Expense[]>('/accounting/expenses');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getExpenses();
    }
  },

  async createExpense(expense: Omit<Expense, 'expenseId'>): Promise<Expense> {
    try {
      const response = await apiClient.post<Expense>('/accounting/expenses', expense);
      return response.data;
    } catch {
      await simulateLatency(250);
      const expenses = mockDb.getExpenses();
      const newId = `EXP-${String(expenses.length + 104)}`;
      const newExp: Expense = {
        ...expense,
        expenseId: newId,
        status: expense.status || 'APPROVED',
      };
      mockDb.setExpenses([newExp, ...expenses]);
      return newExp;
    }
  },
};
