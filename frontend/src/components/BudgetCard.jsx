import React from 'react';
import { Calendar, IndianRupee, Landmark, Lock, ArrowUpRight } from 'lucide-react';

const BudgetCard = ({ budget, onCloseBudget, onSelectBudget }) => {
  if (!budget) return null;

  const {
    _id,
    title,
    month,
    year,
    budgetAmount,
    remainingAmount,
    totalExpenses,
    isClosed,
    startDate,
    endDate,
    savingsGenerated
  } = budget;

  // Calculate percentage spent
  const spentPercent = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

  // Get color class for progress bar
  const getProgressColor = (percent) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Get color class for background highlights
  const getProgressBgColor = (percent) => {
    if (percent < 50) return 'from-emerald-500/5 to-teal-500/5 border-emerald-500/10';
    if (percent < 85) return 'from-amber-500/5 to-orange-500/5 border-amber-500/10';
    return 'from-rose-500/5 to-red-500/5 border-rose-500/10';
  };

  // Get month name
  const getMonthName = (m) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[m - 1] || '';
  };

  const formatDate = (dStr) => {
    return new Date(dStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`glass-card rounded-2xl p-6 border ${
        isClosed
          ? 'from-slate-800/10 to-slate-900/10 border-white/5 opacity-80'
          : getProgressBgColor(spentPercent)
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={onSelectBudget ? "cursor-pointer group" : ""}
          onClick={() => onSelectBudget && onSelectBudget(_id)}
        >
          <span className={`text-xs font-semibold text-indigo-400 uppercase tracking-wider block ${onSelectBudget ? "group-hover:text-indigo-300 transition-colors" : ""}`}>
            {getMonthName(month)} {year}
          </span>
          <h3 className={`text-lg font-bold text-white mt-0.5 ${onSelectBudget ? "group-hover:text-slate-200 transition-colors" : ""}`}>
            {title}
          </h3>
        </div>
        <div>
          {isClosed ? (
            <span className="flex items-center space-x-1 bg-slate-800/80 text-slate-400 border border-white/5 px-2.5 py-1 rounded-full text-xs font-medium">
              <Lock className="h-3 w-3" />
              <span>Closed</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              <span>Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-5">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {formatDate(startDate)} – {formatDate(endDate)}
        </span>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-white/5 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block mb-0.5">Budget</span>
          <div className="flex items-center justify-center text-sm font-semibold text-slate-100">
            <IndianRupee className="h-3 w-3 mr-0.5" />
            <span>{budgetAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block mb-0.5">Spent</span>
          <div className="flex items-center justify-center text-sm font-semibold text-slate-100">
            <IndianRupee className="h-3 w-3 mr-0.5" />
            <span>{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block mb-0.5">
            {isClosed ? 'Savings' : 'Remaining'}
          </span>
          <div
            className={`flex items-center justify-center text-sm font-bold ${
              isClosed
                ? 'text-emerald-400'
                : remainingAmount > 0
                ? 'text-indigo-300'
                : 'text-rose-400'
            }`}
          >
            <IndianRupee className="h-3 w-3 mr-0.5" />
            <span>
              {isClosed
                ? savingsGenerated.toLocaleString('en-IN')
                : remainingAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar (Only show if not closed) */}
      {!isClosed && (
        <div className="space-y-1 mb-5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress</span>
            <span>{Math.round(spentPercent)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${getProgressColor(spentPercent)}`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {onSelectBudget && (
          <button
            onClick={() => onSelectBudget(_id)}
            className="flex-1 btn-secondary text-xs py-2 px-3 rounded-lg flex items-center justify-center"
          >
            <span>View Expenses</span>
            <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
          </button>
        )}
        {!isClosed && onCloseBudget && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to close this month budget? The remaining amount will be transferred to your Overall Savings.')) {
                onCloseBudget(_id);
              }
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center transition-colors shadow-md shadow-emerald-600/10"
          >
            <Landmark className="h-3.5 w-3.5 mr-1.5" />
            <span>Close & Save</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;
