import React from 'react';
import { FolderKanban, IndianRupee, Calendar, ArrowRight, Plus, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupCard = ({ group, onAddExpense, onExport, isExporting = false }) => {
  if (!group) return null;

  const {
    _id,
    title,
    description,
    startDate,
    endDate,
    budgetLimit,
    totalSpent,
    isBudgetEnabled,
    status
  } = group;

  // Calculate remaining & percentage spent
  const hasBudget = isBudgetEnabled && budgetLimit !== null && budgetLimit !== undefined;
  const remaining = hasBudget ? budgetLimit - totalSpent : 0;
  const spentPercent = hasBudget && budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  // Progress Bar styling
  const getProgressColor = (percent) => {
    if (percent < 70) return 'bg-indigo-500';
    if (percent <= 100) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'completed':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'archived':
      default:
        return 'bg-slate-800 text-slate-400 border-white/5';
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 border flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded-full border ${getStatusStyle(status)}`}>
            {status}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        )}

        {/* Dates */}
        <div className="flex items-center space-x-1 text-xs text-slate-500 mb-5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(startDate)} {endDate ? `– ${formatDate(endDate)}` : '(Ongoing)'}
          </span>
        </div>
      </div>

      <div>
        {/* Budget info */}
        {hasBudget ? (
          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white/5 rounded-xl p-2">
                <span className="text-xs text-slate-400 block mb-0.5">Budget Limit</span>
                <div className="flex items-center justify-center font-semibold text-slate-200">
                  <IndianRupee className="h-3 w-3 mr-0.5" />
                  <span>{budgetLimit.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <span className="text-xs text-slate-400 block mb-0.5">Total Spent</span>
                <div className="flex items-center justify-center font-semibold text-slate-200">
                  <IndianRupee className="h-3 w-3 mr-0.5" />
                  <span>{totalSpent.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span className={remaining >= 0 ? 'text-slate-400' : 'text-rose-400 font-medium'}>
                  {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} left` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                </span>
                <span>{Math.round(spentPercent)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getProgressColor(spentPercent)}`}
                  style={{ width: `${Math.min(spentPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-3 text-center mb-5">
            <span className="text-xs text-slate-400 block mb-0.5">Total Spent (No Limit)</span>
            <div className="flex items-center justify-center font-bold text-white text-sm">
              <IndianRupee className="h-3.5 w-3.5 mr-0.5 text-indigo-400" />
              <span>{totalSpent.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === 'active' && onAddExpense ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddExpense(_id);
              }}
              className={`${onExport ? 'flex-1' : 'w-full'} bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center transition-colors shadow-md shadow-emerald-600/10 cursor-pointer`}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add Expense</span>
            </button>
          ) : (
            <Link
              to={`/groups`}
              state={{ selectedGroupId: _id }}
              className={`btn-secondary ${onExport ? 'flex-1' : 'w-full'} text-xs py-2.5 px-3 rounded-lg flex items-center justify-center`}
            >
              <span>Manage Group Expenses</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          )}
          {onExport && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExport(group);
              }}
              disabled={isExporting}
              className="btn-secondary text-xs py-2.5 px-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
              title="Download all expenses in this group as CSV"
            >
              {isExporting ? (
                <span className="h-3.5 w-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">{isExporting ? 'Exporting CSV' : 'Export CSV'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
