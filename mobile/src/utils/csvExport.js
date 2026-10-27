import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const REPORT_HEADERS = [
  'Report Type',
  'Report Name',
  'Month',
  'Year',
  'Start Date',
  'End Date',
  'Status',
  'Budget Limit',
  'Total Spent',
  'Remaining Balance',
  'Savings Generated',
  'Transaction Count',
  'Expense ID',
  'Expense Date',
  'Expense Title',
  'Category',
  'Original Amount',
  'Refunded Amount',
  'Net Amount',
  'Payment Method',
  'Seller',
  'Notes',
  'Paid From Savings',
  'Related Budget',
  'Related Expense Group',
  'Refund Details',
  'Created At',
];

const toIsoDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const getReferenceTitle = (reference) => {
  if (!reference) return '';
  if (typeof reference === 'object') return reference.title || reference.name || reference._id || '';
  return reference;
};

const formatRefunds = (refunds = []) => refunds
  .map((refund) => {
    const date = toIsoDate(refund.refundDate || refund.createdAt);
    const amount = Number.isFinite(Number(refund.amount)) ? Number(refund.amount) : '';
    const notes = refund.notes ? ` (${refund.notes})` : '';
    return `${date}: ${amount}${notes}`;
  })
  .join(' | ');

const protectSpreadsheetFormula = (value) => {
  const text = String(value);
  return /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '';

  const text = typeof value === 'number'
    ? String(value)
    : protectSpreadsheetFormula(value);

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const buildCsv = (rows) => [REPORT_HEADERS, ...rows]
  .map((row) => row.map(escapeCsvCell).join(','))
  .join('\r\n');

const expenseCells = (expense) => {
  if (!expense) return Array(15).fill('');

  const refundedAmount = Number(expense.refundedAmount || 0);
  const netAmount = Number(expense.amount || 0);
  const originalAmount = expense.originalAmount ?? netAmount + refundedAmount;

  return [
    expense._id || '',
    toIsoDate(expense.expenseDate),
    expense.title || '',
    expense.category || 'Uncategorized',
    Number(originalAmount),
    refundedAmount,
    netAmount,
    expense.paymentMethod || '',
    expense.seller || '',
    expense.notes || '',
    expense.isSpentFromSavings ? 'Yes' : 'No',
    getReferenceTitle(expense.budgetId),
    getReferenceTitle(expense.groupId),
    formatRefunds(expense.refunds),
    toIsoDate(expense.createdAt),
  ];
};

const createReportCsv = (summary, expenses = []) => {
  const reportExpenses = expenses.length > 0 ? expenses : [null];
  const summaryCells = [
    summary.type,
    summary.name,
    summary.month || '',
    summary.year || '',
    toIsoDate(summary.startDate),
    toIsoDate(summary.endDate),
    summary.status,
    summary.budgetLimit ?? '',
    summary.totalSpent ?? 0,
    summary.remainingBalance ?? '',
    summary.savingsGenerated ?? '',
    expenses.length,
  ];

  return buildCsv(reportExpenses.map((expense) => [
    ...summaryCells,
    ...expenseCells(expense),
  ]));
};

const safeFilenamePart = (value, fallback) => {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return normalized || fallback;
};

const saveCsv = async (csv, filename) => {
  const contents = `\uFEFF${csv}`;

  if (Platform.OS === 'web') {
    const blob = new globalThis.Blob([contents], { type: 'text/csv;charset=utf-8' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    globalThis.document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 0);
    return filename;
  }

  if (!FileSystem.cacheDirectory) throw new Error('A writable export directory is unavailable.');

  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!await Sharing.isAvailableAsync()) {
    throw new Error('Saving and sharing files is unavailable on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: `Save ${filename}`,
    UTI: 'public.comma-separated-values-text',
  });

  return filename;
};

export const createBudgetCsv = (budget, expenses = []) => createReportCsv({
  type: 'Monthly Budget',
  name: budget.title,
  month: budget.month,
  year: budget.year,
  startDate: budget.startDate,
  endDate: budget.endDate,
  status: budget.isClosed ? 'Closed' : 'Active',
  budgetLimit: budget.budgetAmount,
  totalSpent: budget.totalExpenses,
  remainingBalance: budget.remainingAmount,
  savingsGenerated: budget.savingsGenerated,
}, expenses);

export const createGroupCsv = (group, expenses = []) => {
  const hasBudget = group.isBudgetEnabled
    && group.budgetLimit !== null
    && group.budgetLimit !== undefined;

  return createReportCsv({
    type: 'Expense Group',
    name: group.title,
    startDate: group.startDate,
    endDate: group.endDate,
    status: group.status,
    budgetLimit: hasBudget ? group.budgetLimit : '',
    totalSpent: group.totalSpent,
    remainingBalance: hasBudget ? group.budgetLimit - group.totalSpent : '',
  }, expenses);
};

export const downloadBudgetCsv = (budget, expenses = []) => {
  const period = budget.month && budget.year ? `${budget.year}-${String(budget.month).padStart(2, '0')}` : 'report';
  const filename = `monthly-budget-${period}-${safeFilenamePart(budget.title, 'budget')}.csv`;
  return saveCsv(createBudgetCsv(budget, expenses), filename);
};

export const downloadGroupCsv = (group, expenses = []) => {
  const filename = `expense-group-${safeFilenamePart(group.title, 'group')}.csv`;
  return saveCsv(createGroupCsv(group, expenses), filename);
};
