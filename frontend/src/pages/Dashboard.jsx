import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import BudgetCard from '../components/BudgetCard';
import GroupCard from '../components/GroupCard';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import {
  IndianRupee,
  TrendingUp,
  Plus,
  CalendarDays,
  FolderKanban,
  CreditCard,
  Percent,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeBudget, setActiveBudget] = useState(null);
  const [activeGroups, setActiveGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState(location.state?.filterBudgetId || null);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setTableLoading(true);

      // 1. Fetch budgets
      const budgetRes = await API.get('/budgets');
      if (budgetRes.data.success) {
        setBudgets(budgetRes.data.data);

        // Find active budget for current month and year
        const today = new Date();
        const curMonth = today.getMonth() + 1;
        const curYear = today.getFullYear();

        const active = budgetRes.data.data.find(
          (b) => b.month === curMonth && b.year === curYear && !b.isClosed
        );
        setActiveBudget(active || budgetRes.data.data.find((b) => !b.isClosed) || null);
      }

      // 2. Fetch groups
      const groupRes = await API.get('/groups');
      if (groupRes.data.success) {
        setGroups(groupRes.data.data);
        setActiveGroups(groupRes.data.data.filter((g) => g.status === 'active'));
      }

      // 3. Fetch recent expenses
      let url = `/expenses?page=1&limit=10&search=${searchTerm}`;
      if (selectedBudgetId) {
        url += `&budgetId=${selectedBudgetId}`;
      }
      const expenseRes = await API.get(url);
      if (expenseRes.data.success) {
        setRecentExpenses(expenseRes.data.data);
        setPagination(expenseRes.data.pagination);
      }

      // 4. Refresh user profile (for savings balance)
      await refreshUser();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchTerm, selectedBudgetId]);

  // Handle closing active budget
  const handleCloseBudget = async (id) => {
    try {
      const res = await API.post(`/budgets/${id}/close`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close budget');
    }
  };

  // Handle adding or editing expense
  const handleExpenseSubmit = async (expenseData) => {
    try {
      let res;
      if (editingExpense) {
        res = await API.put(`/expenses/${editingExpense._id}`, expenseData);
      } else {
        res = await API.post('/expenses', expenseData);
      }

      if (res.data.success) {
        fetchDashboardData();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to save expense',
      };
    }
  };

  // Handle deleting expense
  const handleExpenseDelete = async (id) => {
    try {
      const res = await API.delete(`/expenses/${id}`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // Prepare chart data (split of payment methods)
  const getChartData = () => {
    const methods = {};
    recentExpenses.forEach((exp) => {
      methods[exp.paymentMethod] = (methods[exp.paymentMethod] || 0) + exp.amount;
    });

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

    return Object.keys(methods).map((name, idx) => ({
      name,
      value: methods[name],
      color: COLORS[idx % COLORS.length],
    }));
  };

  const chartData = getChartData();

  return (
    <div className="space-y-8">
      {/* Top Banner Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Savings Card */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/10 from-emerald-950/10 to-teal-950/10 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Overall Savings</span>
            <div className="flex items-center text-white">
              <IndianRupee className="h-6 w-6 mr-0.5 text-emerald-400 font-bold" />
              <span className="text-3xl font-extrabold tracking-tight">
                {user?.overallSavings?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <p className="text-xs text-slate-500">Transferred from closed budgets or goals</p>
          </div>
          <div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Current Month Budget Tracker */}
        <div className="glass-card rounded-2xl p-6 border border-indigo-500/10 from-indigo-950/10 to-violet-950/10 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Month Remaining</span>
            <div className="flex items-center text-white">
              <IndianRupee className="h-6 w-6 mr-0.5 text-indigo-400 font-bold" />
              <span className="text-3xl font-extrabold tracking-tight">
                {activeBudget ? activeBudget.remainingAmount.toLocaleString('en-IN') : 0}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeBudget
                ? `Out of ₹${activeBudget.budgetAmount.toLocaleString('en-IN')} Budget`
                : 'No active budget set'}
            </p>
          </div>
          <div className="bg-indigo-500/10 p-3.5 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <CalendarDays className="h-6 w-6" />
          </div>
        </div>

        {/* Action / Event Summary Card */}
        <div className="glass-card rounded-2xl p-6 border border-violet-500/10 from-violet-950/10 to-pink-950/10 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider block">Special Campaigns</span>
            <div className="flex items-center text-white">
              <span className="text-3xl font-extrabold tracking-tight">{activeGroups.length}</span>
              <span className="text-sm font-medium text-slate-400 ml-2">Active Trackers</span>
            </div>
            <p className="text-xs text-slate-500">Events, trips, or customized budgets</p>
          </div>
          <div className="bg-violet-500/10 p-3.5 rounded-2xl text-violet-400 border border-violet-500/20">
            <FolderKanban className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Budget & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Child 1: Current Month Tracker (spans 2 cols, row 1 on desktop) */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-1">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
              <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2.5"></span>
              Current Month Tracker
            </h2>
            <button
              onClick={openAddModal}
              className="btn-primary text-xs py-2 px-3.5 flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>

          {activeBudget ? (
            <BudgetCard
              budget={activeBudget}
              onCloseBudget={handleCloseBudget}
              onSelectBudget={(id) => navigate(`/budgets/${id}`)}
            />
          ) : (
            <div className="glass-card rounded-2xl p-8 border border-white/5 text-center space-y-4">
              <CalendarDays className="h-10 w-10 text-slate-500 mx-auto" />
              <div>
                <h4 className="text-base font-bold text-white">No active budget for this month</h4>
                <p className="text-slate-400 text-xs mt-1">Create a budget to begin tracking your monthly expenses and generating savings.</p>
              </div>
              <button
                onClick={() => navigate('/budgets')}
                className="btn-secondary text-xs inline-block"
              >
                Go to Budgets Page
              </button>
            </div>
          )}
        </div>

        {/* Child 2: Payment Breakdown (spans 1 col, rows 1 & 2 on desktop) */}
        <div className="lg:col-span-1 space-y-6 order-3 lg:order-2 lg:row-span-2">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
            <span className="h-2 w-2 rounded-full bg-violet-500 mr-2.5"></span>
            Payment Breakdown
          </h2>

          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-[360px]">
            {chartData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                <CreditCard className="h-10 w-10 text-slate-500 mb-2" />
                <span>Add expenses to view payment mode distributions.</span>
              </div>
            ) : (
              <>
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 text-xs uppercase font-semibold">Total Spent</span>
                    <span className="text-white text-lg font-extrabold">
                      ₹{recentExpenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Legends */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-white/5 pt-4">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="truncate">{entry.name}: ₹{entry.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Child 3: Active Expense Groups (spans 2 cols, row 2 on desktop) */}
        <div className="lg:col-span-2 space-y-4 order-4 lg:order-3">
          <h3 className="text-sm font-bold text-slate-300 tracking-wider uppercase">Active Expense Groups</h3>
          {activeGroups.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 border border-white/5 text-center text-slate-400 text-xs">
              No active event trackers.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGroups.slice(0, 2).map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Child 4: Transaction Ledger (spans 3 cols, row 3 on desktop) */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2.5"></span>
              Transaction Ledger
            </h2>
            {selectedBudgetId && (
              <div className="flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl text-xs w-fit">
                <span>Filtering by budget: <strong>{budgets.find(b => b._id === selectedBudgetId)?.title || 'Selected Budget'}</strong></span>
                <button
                  onClick={() => {
                    setSelectedBudgetId(null);
                    navigate(location.pathname, { replace: true, state: {} });
                  }}
                  className="hover:text-white font-bold ml-1 transition-colors text-xs uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <ExpenseTable
            expenses={recentExpenses}
            pagination={pagination}
            onPageChange={async (page) => {
              let url = `/expenses?page=${page}&limit=10&search=${searchTerm}`;
              if (selectedBudgetId) {
                url += `&budgetId=${selectedBudgetId}`;
              }
              const res = await API.get(url);
              if (res.data.success) {
                setRecentExpenses(res.data.data);
                setPagination(res.data.pagination);
              }
            }}
            onEdit={openEditModal}
            onDelete={handleExpenseDelete}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={tableLoading}
          />
        </div>
      </div>

      {/* Quick Add Form Modal */}
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

export default Dashboard;
