import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import BudgetCard from '../components/BudgetCard';
import { CalendarDays, Plus, HelpCircle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MonthlyBudget = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await API.get('/budgets');
      if (res.data.success) {
        setBudgets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();

    // Default dates populate helper
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().substring(0, 10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().substring(0, 10);

    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  // Sync dates when month or year changes
  useEffect(() => {
    const firstDay = new Date(year, month - 1, 1).toISOString().substring(0, 10);
    const lastDay = new Date(year, month, 0).toISOString().substring(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
    
    // Auto-update title e.g. "June 2026 Budget"
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    setTitle(`${months[month - 1]} ${year} Budget`);
  }, [month, year]);

  const handleCloseBudget = async (id) => {
    try {
      const res = await API.post(`/budgets/${id}/close`);
      if (res.data.success) {
        setSuccess('Budget closed and funds moved to savings!');
        fetchBudgets();
        await refreshUser();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close budget');
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseFloat(budgetAmount);

    if (!title.trim()) {
      setError('Budget title is required');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a budget amount greater than 0');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and End date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/budgets', {
        title: title.trim(),
        month: parseInt(month),
        year: parseInt(year),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budgetAmount: amount,
      });

      if (res.data.success) {
        setSuccess('Monthly budget created successfully!');
        setBudgetAmount('');
        fetchBudgets();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget. A budget might already exist for this month.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBudgets = budgets.filter((b) => !b.isClosed);
  const closedBudgets = budgets.filter((b) => b.isClosed);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column: Budget List */}
      <div className="flex-1 space-y-6">
        {error && (
          <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Active Budgets Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
            <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2.5 animate-pulse"></span>
            Active Budgets
          </h2>

          {loading && budgets.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
              <p className="mt-2">Loading budgets...</p>
            </div>
          ) : activeBudgets.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border border-white/5 text-center text-slate-400 text-xs">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <span>No active budgets found. Set one up on the right!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBudgets.map((budget) => (
                <BudgetCard
                  key={budget._id}
                  budget={budget}
                  onCloseBudget={handleCloseBudget}
                  onSelectBudget={(id) => navigate(`/budgets/${id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Closed Budgets Section */}
        {closedBudgets.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-slate-400 tracking-tight flex items-center">
              <span className="h-2 w-2 rounded-full bg-slate-600 mr-2.5"></span>
              Budget Archive (Closed Months)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedBudgets.map((budget) => (
                <BudgetCard 
                  key={budget._id} 
                  budget={budget} 
                  onSelectBudget={(id) => navigate(`/budgets/${id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Create Form */}
      <div className="w-full lg:w-96 shrink-0">
        <div className="glass-card rounded-2xl p-6 border border-white/5 sticky top-24 space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Create Monthly Budget</h3>
          </div>

          <form onSubmit={handleCreateBudget} className="space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Title</label>
              <input
                type="text"
                placeholder="e.g. June 2026 Budget"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input w-full text-xs"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Month & Year Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Budget Limit (Amount) */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Budget Amount (₹)</label>
              <input
                type="number"
                placeholder="50000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="glass-input w-full text-xs"
                disabled={isSubmitting}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Initialize Budget</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Tip Alert */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 space-y-1.5">
            <span className="text-xs uppercase font-bold text-indigo-400 block flex items-center">
              <HelpCircle className="h-3.5 w-3.5 mr-1" /> How ending a month works
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a month ends, click **Close & Save**. FinFlow will lock the budget, calculate what remains, and add it directly to your **Overall Savings**!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBudget;
