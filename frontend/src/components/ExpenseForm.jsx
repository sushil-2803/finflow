import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, ShoppingBag, CreditCard, FileText, Bookmark, FolderOpen, PiggyBank } from 'lucide-react';

const ExpenseForm = ({
  expense,
  isOpen,
  onClose,
  onSubmit,
  budgets = [],
  groups = []
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [seller, setSeller] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSpentFromSavings, setIsSpentFromSavings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    'Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'
  ];

  // Populate form if editing an existing expense
  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setAmount(expense.amount || '');
      setPaymentMethod(expense.paymentMethod || 'UPI');
      setSeller(expense.seller || '');
      setNotes(expense.notes || '');
      setExpenseDate(expense.expenseDate ? expense.expenseDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
      setBudgetId(expense.budgetId ? (expense.budgetId._id || expense.budgetId) : '');
      setGroupId(expense.groupId ? (expense.groupId._id || expense.groupId) : '');
      setIsSpentFromSavings(!!expense.isSpentFromSavings);
    } else {
      // Default values for new expense
      setTitle('');
      setAmount('');
      setPaymentMethod('UPI');
      setSeller('');
      setNotes('');
      setExpenseDate(new Date().toISOString().substring(0, 10));
      setBudgetId('');
      setGroupId('');
      setIsSpentFromSavings(false);
    }
    setError('');
  }, [expense, isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const expAmount = parseFloat(amount);
    if (isNaN(expAmount) || expAmount <= 0) {
      setError('Amount must be a valid number greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        title: title.trim(),
        amount: expAmount,
        paymentMethod,
        seller: seller.trim(),
        notes: notes.trim(),
        expenseDate: new Date(expenseDate),
        budgetId: isSpentFromSavings ? null : (budgetId || null),
        groupId: groupId || null,
        isSpentFromSavings,
      };

      const result = await onSubmit(data);
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to save expense');
      }
    } catch (err) {
      setError('An error occurred while saving the expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 flex-shrink-0">
          <h3 className="text-base font-bold text-white">
            {expense?._id ? 'Edit Transaction' : 'Record New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Title *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Bookmark className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Weekly Groceries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Expense Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Payment Method
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full appearance-none !pr-8"
                  disabled={isSubmitting}
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seller / Platform & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Seller / Platform
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Amazon, Local Store"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Notes
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Office desk, grocery list"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input !pl-10 text-sm w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Funding source */}
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 cursor-pointer hover:bg-emerald-500/10 transition-colors">
              <input
                type="checkbox"
                checked={isSpentFromSavings}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsSpentFromSavings(checked);
                  if (checked) {
                    setBudgetId('');
                  }
                }}
                className="mt-1 h-4 w-4 accent-emerald-500"
                disabled={isSubmitting}
              />
              <span className="min-w-0">
                <span className="flex items-center text-xs font-bold text-emerald-300">
                  <PiggyBank className="h-4 w-4 mr-1.5" />
                  Pay this expense from savings
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  Deducts the amount from Overall Savings and records it in the savings ledger.
                </span>
              </span>
            </label>
          </div>

          {/* Linking: Monthly Budget & Expense Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-indigo-400 block tracking-wider flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Monthly Budget
              </label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="glass-input text-xs w-full"
                disabled={isSubmitting || isSpentFromSavings}
              >
                <option value="" className="bg-slate-900 text-white">
                  {isSpentFromSavings ? 'Paid from savings' : 'Unassigned (Not linked to month)'}
                </option>
                {budgets
                  .filter((b) => !b.isClosed) // Only display active budgets
                  .map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900 text-white">
                      {b.title} ({b.month}/{b.year})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-violet-400 block tracking-wider flex items-center">
                <FolderOpen className="h-3 w-3 mr-1" />
                Special Expense Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="glass-input text-xs w-full"
                disabled={isSubmitting}
              >
                <option value="" className="bg-slate-900 text-white">Unassigned (Normal expense)</option>
                {groups
                  .filter((g) => g.status === 'active') // Only show active groups
                  .map((g) => (
                    <option key={g._id} value={g._id} className="bg-slate-900 text-white">
                      {g.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-slate-950/20 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
              ) : expense?._id ? (
                'Save Changes'
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
