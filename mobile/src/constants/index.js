export const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'];
export const GROUP_STATUSES = ['active', 'completed', 'archived'];
export const MONTHS = Array.from({ length: 12 }, (_, index) => ({ label: new Date(2020, index, 1).toLocaleString('en-IN', { month: 'long' }), value: index + 1 }));
