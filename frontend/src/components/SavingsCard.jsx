import React, { useState } from 'react';
import { IndianRupee, TrendingUp, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const SavingsCard = ({ overallSavings, onSpendSavings }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const spendAmount = parseFloat(amount);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (isNaN(spendAmount) || spendAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (overallSavings < spendAmount) {
      setError(`Insufficient savings balance. You only have ₹${overallSavings.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSpendSavings({
        title: title.trim(),
        amount: spendAmount,
        purpose: purpose.trim(),
        transactionDate: new Date(),
      });

      if (result.success) {
        setSuccess('Transaction recorded successfully!');
        setTitle('');
        setAmount('');
        setPurpose('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to record transaction');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-emerald-500/10 from-slate-900/40 to-slate-950/40 flex flex-col md:flex-row gap-6">
      {/* Visual Balance Card */}
      <div className="flex-1 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl shadow-emerald-700/10 min-h-[180px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider">Accumulated Balance</span>
            <h3 className="text-lg font-bold text-emerald-50">Savings Account</h3>
          </div>
          <div className="bg-white/10 p-2 rounded-xl text-white">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline text-white">
            <IndianRupee className="h-8 w-8 mr-1 font-bold" />
            <span className="text-4xl font-extrabold tracking-tight">
              {overallSavings?.toLocaleString('en-IN') || 0}
            </span>
          </div>
          <p className="text-xs text-emerald-100/60 mt-1">
            Transferred automatically from remaining monthly budgets or manual entries
          </p>
        </div>
      </div>

      {/* Spend Form */}
      <div className="flex-1 flex flex-col justify-center">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2"></span>
          Spend from Accumulated Savings
        </h4>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="What are you buying? (e.g. Headphones)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input text-xs w-full"
              disabled={isSubmitting}
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input text-xs w-full"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Purpose / Description (optional)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="glass-input text-xs flex-1"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  <span>Spend</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavingsCard;
