import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import BudgetCard from '../components/BudgetCard';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  IndianRupee,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';

const BudgetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form / modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [groups, setGroups] = useState([]);

  // Fetch budget detail and its expenses
  const fetchBudgetDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/budgets/${id}`);
      if (res.data.success) {
        setBudget(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching budget details:', err);
      setError(err.response?.data?.message || 'Failed to load budget details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetExpenses = async (page = 1) => {
    try {
      setExpensesLoading(true);
      const res = await API.get(`/expenses?page=${page}&limit=10&budgetId=${id}`);
      if (res.data.success) {
        setExpenses(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching budget expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Fetch lookup lists for form modals
  const fetchLookupData = async () => {
    try {
      const budgetRes = await API.get('/budgets');
      if (budgetRes.data.success) {
        setBudgets(budgetRes.data.data);
      }
      const groupRes = await API.get('/groups');
      if (groupRes.data.success) {
        setGroups(groupRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load lookup data:', err);
    }
  };

  useEffect(() => {
    fetchBudgetDetails();
    fetchBudgetExpenses(1);
    fetchLookupData();
  }, [id]);

  const handleCloseBudget = async (budgetId) => {
    try {
      const res = await API.post(`/budgets/${budgetId}/close`);
      if (res.data.success) {
        setSuccess('Budget closed and remaining funds moved to savings!');
        fetchBudgetDetails();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close budget');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBudgetDelete = async () => {
    if (window.confirm('Are you sure you want to delete this monthly budget? Associated expenses will not be deleted, but they will be unlinked from this budget.')) {
      try {
        const res = await API.delete(`/budgets/${id}`);
        if (res.data.success) {
          navigate('/budgets');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete budget');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleExpenseSubmit = async (expenseData) => {
    try {
      let res;
      if (editingExpense && editingExpense._id) {
        res = await API.put(`/expenses/${editingExpense._id}`, expenseData);
      } else {
        res = await API.post('/expenses', expenseData);
      }

      if (res.data.success) {
        setSuccess(editingExpense?._id ? 'Expense updated successfully!' : 'Expense added successfully!');
        fetchBudgetDetails();
        fetchBudgetExpenses(pagination.page);
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to save expense',
      };
    }
  };

  const handleExpenseDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense? This will refund any budget or savings balance.')) {
      try {
        const res = await API.delete(`/expenses/${expenseId}`);
        if (res.data.success) {
          setSuccess('Expense deleted successfully!');
          fetchBudgetDetails();
          fetchBudgetExpenses(1); // Reset to page 1 as totals changed
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete expense');
      }
    }
  };

  const openAddExpenseModal = () => {
    // Pre-populate only the budgetId by passing a dummy expense object without an _id
    setEditingExpense({ budgetId: id });
    setIsFormOpen(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading budget details...</p>
        </div>
      </div>
    );
  }

  if (error && !budget) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/budgets')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to budgets list</span>
        </button>
        <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section with navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/budgets')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to budgets list</span>
        </button>

        <button
          onClick={handleBudgetDelete}
          className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Budget</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Overview card */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase">Budget Overview</h2>
          <BudgetCard
            budget={budget}
            onCloseBudget={handleCloseBudget}
          />
        </div>

        {/* Right columns: Transaction Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
              <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2.5"></span>
              Budget Transactions Ledger
            </h2>
            <button
              onClick={openAddExpenseModal}
              disabled={budget?.isClosed}
              className="btn-primary text-xs py-2 px-3.5 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="relative">
            {expensesLoading && expenses.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="mt-2">Retrieving transactions...</p>
              </div>
            ) : (
              <ExpenseTable
                expenses={expenses}
                pagination={pagination}
                onPageChange={(page) => fetchBudgetExpenses(page)}
                onEdit={openEditExpenseModal}
                onDelete={handleExpenseDelete}
                searchTerm=""
                onSearchChange={() => {}}
                loading={expensesLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <ExpenseForm
        expense={editingExpense}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleExpenseSubmit}
        budgets={budgets}
        groups={groups}
      />
    </div>
  );
};

export default BudgetDetails;
