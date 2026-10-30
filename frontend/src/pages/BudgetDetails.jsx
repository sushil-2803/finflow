import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import BudgetCard from '../components/BudgetCard';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';
import { downloadBudgetCsv } from '../utils/csvExport';

const BudgetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Form / modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [paymentMethodTotals, setPaymentMethodTotals] = useState([]);

  // Fetch budget detail and its expenses
  const fetchBudgetDetails = async () => {
    try {
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
      let url = `/expenses?page=${page}&limit=10&budgetId=${id}`;
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedPaymentMethod) {
        url += `&paymentMethod=${encodeURIComponent(selectedPaymentMethod)}`;
      }
      const res = await API.get(url);
      if (res.data.success) {
        setExpenses(res.data.data);
        setPagination(res.data.pagination);
        setCategoryTotals(res.data.categoryTotals || []);
        setPaymentMethodTotals(res.data.paymentMethodTotals || []);
      }
    } catch (err) {
      console.error('Error fetching budget expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    API.get(`/budgets/${id}`)
      .then((res) => {
        if (!cancelled && res.data.success) {
          setBudget(res.data.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error fetching budget details:', err);
          setError(err.response?.data?.message || 'Failed to load budget details');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    Promise.all([
      API.get('/budgets'),
      API.get('/groups'),
      API.get('/categories'),
    ])
      .then(([budgetRes, groupRes, categoryRes]) => {
        if (cancelled) return;
        if (budgetRes.data.success) setBudgets(budgetRes.data.data);
        if (groupRes.data.success) setGroups(groupRes.data.data);
        if (categoryRes.data.success) setCategories(categoryRes.data.data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load lookup data:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    API.get('/expenses', {
      params: {
        page: 1,
        limit: 10,
        budgetId: id,
        category: selectedCategory || undefined,
        paymentMethod: selectedPaymentMethod || undefined,
      },
    })
      .then((res) => {
        if (!cancelled && res.data.success) {
          setExpenses(res.data.data);
          setPagination(res.data.pagination);
          setCategoryTotals(res.data.categoryTotals || []);
          setPaymentMethodTotals(res.data.paymentMethodTotals || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error fetching budget expenses:', err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setExpensesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, selectedCategory, selectedPaymentMethod]);

  const handleCategoryChange = (category) => {
    setExpensesLoading(true);
    setSelectedCategory(category);
  };

  const handlePaymentMethodChange = (paymentMethod) => {
    setExpensesLoading(true);
    setSelectedPaymentMethod(paymentMethod);
  };

  const handleCloseBudget = async (budgetId) => {
    try {
      const res = await API.post(`/budgets/${budgetId}/close`);
      if (res.data.success) {
        setSuccess('Budget closed successfully!');
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

  const handleExportBudget = async () => {
    if (!budget) return;

    setIsExporting(true);
    setError('');

    try {
      const res = await API.get('/expenses', {
        params: { budgetId: budget._id, limit: 0 },
      });

      if (!res.data.success) throw new Error('Failed to load budget expenses');

      const filename = downloadBudgetCsv(budget, res.data.data);
      setSuccess(`Downloaded ${filename}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export budget CSV');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsExporting(false);
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
        setExpensesLoading(true);
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
          setExpensesLoading(true);
          fetchBudgetExpenses(1); // Reset to page 1 as totals changed
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete expense');
      }
    }
  };

  const handleExpenseRefund = async (expense) => {
    const value = window.prompt(`Refund amount (remaining ₹${(expense.amount || 0).toLocaleString('en-IN')}):`, '');
    if (value === null) return;
    const amount = parseFloat(value);
    if (!Number.isFinite(amount) || amount <= 0) return alert('Enter a valid refund amount.');
    const notes = window.prompt('Reason or product name for this refund:', '');
    if (notes === null || !notes.trim()) return alert('Enter a refund reason or product name.');
    try {
      await API.post(`/expenses/${expense._id}/refunds`, { amount, notes });
      fetchBudgetDetails();
      setExpensesLoading(true);
      fetchBudgetExpenses(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record refund');
    }
  };

  const handleCreateCategory = async (name) => {
    const res = await API.post('/categories', { name });
    if (res.data.success) {
      const categoryName = res.data.data;
      setCategories((prev) => [...new Set([...prev, categoryName])].sort((a, b) => a.localeCompare(b)));
      return categoryName;
    }
    return null;
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={handleExportBudget}
            disabled={isExporting}
            className="flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/15 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isExporting ? (
              <span className="h-4 w-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleBudgetDelete}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Budget</span>
          </button>
        </div>
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
                onPageChange={(page) => {
                  setExpensesLoading(true);
                  fetchBudgetExpenses(page);
                }}
                onEdit={openEditExpenseModal}
                onDelete={handleExpenseDelete}
                onRefund={handleExpenseRefund}
                searchTerm=""
                onSearchChange={() => {}}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                categoryTotals={categoryTotals}
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                paymentMethodTotals={paymentMethodTotals}
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
        categories={categories}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
};

export default BudgetDetails;
