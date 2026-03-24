import React from 'react';
import { Edit2, Trash2, Calendar, ShoppingBag, CreditCard, Tag, ArrowLeft, ArrowRight, Search, PiggyBank } from 'lucide-react';

const ExpenseTable = ({
  expenses,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  loading
}) => {
  const { page = 1, pages = 1, total = 0 } = pagination || {};

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Cash': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'UPI': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Credit Card': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Debit Card': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Net Banking': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Wallet': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-slate-700/50 text-slate-400 border-white/5';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Search & Utility Bar */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-base font-bold text-white self-start sm:self-center">Recent Transactions</h3>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by title or seller..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="glass-input !pl-9 !pr-4 !py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase font-bold text-slate-400 tracking-wider">
              <th className="px-6 py-4">Expense Details</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category / Group</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                  <p className="mt-2 text-xs">Loading expenses...</p>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <span>No expenses recorded yet.</span>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const {
                  _id,
                  title,
                  amount,
                  paymentMethod,
                  seller,
                  notes,
                  expenseDate,
                  budgetId,
                  groupId,
                  isSpentFromSavings,
                } = expense;

                return (
                  <tr
                    key={_id}
                    className="hover:bg-white/2 cursor-pointer transition-colors"
                    onClick={() => onEdit && onEdit(expense)}
                  >
                    {/* Title / Seller */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{title}</div>
                      {seller && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          <span>{seller}</span>
                        </div>
                      )}
                      {notes && (
                        <div className="text-xs text-slate-500 mt-0.5 italic max-w-xs truncate">
                          "{notes}"
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(expenseDate)}</span>
                      </div>
                    </td>

                    {/* Category (Budget/Group) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSpentFromSavings ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-medium">
                          <PiggyBank className="h-3 w-3" />
                          <span>Savings</span>
                        </span>
                      ) : groupId ? (
                        <span className="inline-flex items-center space-x-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded text-xs font-medium">
                          <Tag className="h-3 w-3" />
                          <span>{groupId.title}</span>
                        </span>
                      ) : budgetId ? (
                        <span className="inline-flex items-center space-x-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-xs font-medium">
                          <Calendar className="h-3 w-3" />
                          <span>{budgetId.title}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Unassigned</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center border px-2 py-0.5 rounded text-xs font-semibold ${getPaymentMethodColor(paymentMethod)}`}>
                        <CreditCard className="h-3 w-3 mr-1" />
                        <span>{paymentMethod}</span>
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-white text-sm">
                      <span className="text-xs font-normal text-slate-400 mr-0.5">₹</span>
                      <span>{amount.toLocaleString('en-IN')}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(expense);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this expense?')) {
                              onDelete(_id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Showing Page <span className="font-semibold text-white">{page}</span> of{' '}
            <span className="font-semibold text-white">{pages}</span> ({total} expenses)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 rounded-lg text-xs flex items-center space-x-1 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === pages}
              className="btn-secondary py-1.5 px-3 rounded-lg text-xs flex items-center space-x-1 disabled:opacity-40"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;
