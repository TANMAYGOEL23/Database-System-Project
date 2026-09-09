export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface JournalEntryLine {
  lineId?: string;
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  entryId: string;
  date: string;
  description: string;
  reference: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  status?: 'POSTED' | 'DRAFT';
}

export interface Expense {
  expenseId: string;
  accountId: string;
  accountName: string;
  category: string;
  date: string;
  amount: number;
  description: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHEQUE';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  receiptRef?: string;
}
