import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import GroupCard from '../components/GroupCard';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import { FolderKanban, Plus, ArrowLeft, Trash2, Calendar, IndianRupee, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';

const ExpenseGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states (new group)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isBudgetEnabled, setIsBudgetEnabled] = useState(true);
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal / Expense forms
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgets, setBudgets] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get('/groups');
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await API.get('/budgets');
      if (res.data.success) {
        setBudgets(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchBudgets();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Group title is required');
      return;
    }

    let limit = null;
    if (isBudgetEnabled) {
      limit = parseFloat(budgetLimit);
      if (isNaN(limit) || limit <= 0) {
        setError('Please enter a valid budget limit greater than 0');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/groups', {
        title: title.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budgetLimit: limit,
        isBudgetEnabled,
        status,
      });

      if (res.data.success) {
        setSuccess(`Group "${res.data.data.title}" created successfully!`);
        setTitle('');
        setDescription('');
        setBudgetLimit('');
        setEndDate('');
        fetchGroups();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setDetailLoading(true);
    try {
      const res = await API.get(`/groups/${group._id}`);
      if (res.data.success) {
        setGroupExpenses(res.data.data.expenses);
        // Sync selected group info with latest totals
        setSelectedGroup(res.data.data.group);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGroupDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense group? The expenses inside it will not be deleted, they will simply be disassociated.')) {
      try {
        const res = await API.delete(`/groups/${id}`);
        if (res.data.success) {
          setSelectedGroup(null);
          setGroupExpenses([]);
          fetchGroups();
          setSuccess('Group deleted successfully');
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('Failed to delete group');
      }
    }
  };

  // Expense management handlers inside group detail
  const handleExpenseSubmit = async (expenseData) => {
    try {
      let res;
      if (editingExpense) {
        res = await API.put(`/expenses/${editingExpense._id}`, expenseData);
      } else {
        res = await API.post('/expenses', expenseData);
      }

      if (res.data.success) {
        // Refresh details
        if (selectedGroup) {
          handleSelectGroup(selectedGroup);
        }
        fetchGroups();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to save expense',
      };
    }
  };

  const handleExpenseDelete = async (id) => {
    try {
      const res = await API.delete(`/expenses/${id}`);
      if (res.data.success) {
        if (selectedGroup) {
          handleSelectGroup(selectedGroup);
        }
        fetchGroups();
      }
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column: Groups List or Detail */}
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

        {!selectedGroup ? (
          /* Master View: Groups List */
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
              <span className="h-2 w-2 rounded-full bg-violet-500 mr-2.5"></span>
              Special Expense Trackers
            </h2>

            {loading ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="mt-2">Loading expense groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 border border-white/5 text-center text-slate-400 text-xs">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                <span>No expense groups found. Create a trip or event on the right!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    onClick={() => handleSelectGroup(group)}
                    className="cursor-pointer"
                  >
                    <GroupCard group={group} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Detail View: Selected Group Details */
          <div className="space-y-6">
            {/* Header / Back button */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSelectedGroup(null)}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to groups list</span>
              </button>

              <button
                onClick={() => handleGroupDelete(selectedGroup._id)}
                className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Group</span>
              </button>
            </div>

            {/* Selected Group Card details */}
            <div className="glass-card rounded-2xl p-6 border border-indigo-500/10 from-indigo-950/10 to-violet-950/10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedGroup.title}</h2>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Started {new Date(selectedGroup.startDate).toLocaleDateString('en-IN')}
                        {selectedGroup.endDate && ` – Ends ${new Date(selectedGroup.endDate).toLocaleDateString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full uppercase font-bold">
                  {selectedGroup.status}
                </span>
              </div>

              {selectedGroup.description && (
                <p className="text-slate-300 text-xs mt-3 leading-relaxed border-t border-white/5 pt-3">
                  {selectedGroup.description}
                </p>
              )}

              {/* Budget limit progress */}
              {selectedGroup.isBudgetEnabled && selectedGroup.budgetLimit !== null && selectedGroup.budgetLimit !== undefined ? (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <span className="text-xs text-slate-400 block mb-0.5">Budget Limit</span>
                    <div className="flex items-center justify-center font-bold text-white text-sm">
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                      <span>{selectedGroup.budgetLimit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <span className="text-xs text-slate-400 block mb-0.5">Total Spent</span>
                    <div className="flex items-center justify-center font-bold text-white text-sm">
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                      <span>{selectedGroup.totalSpent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <span className="text-xs text-slate-400 block mb-0.5">Remaining Balance</span>
                    <div className={`flex items-center justify-center font-bold text-sm ${selectedGroup.budgetLimit - selectedGroup.totalSpent >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                      <span>{(selectedGroup.budgetLimit - selectedGroup.totalSpent).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 bg-white/5 rounded-xl p-3 text-center border-t border-white/5 pt-4">
                  <span className="text-xs text-slate-400 block mb-0.5">Total Spent (No Limit)</span>
                  <div className="flex items-center justify-center font-bold text-white text-sm">
                    <IndianRupee className="h-3.5 w-3.5 mr-0.5 text-indigo-400" />
                    <span>{selectedGroup.totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* List of expenses inside selected group */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center">
                  <span className="h-2 w-2 rounded-full bg-violet-500 mr-2.5"></span>
                  Group Transactions Ledger
                </h3>
                <button
                  onClick={openAddExpenseModal}
                  disabled={selectedGroup.status !== 'active'}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Expense in Group</span>
                </button>
              </div>

              {detailLoading ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                  <p className="mt-2">Retrieving transactions...</p>
                </div>
              ) : (
                <ExpenseTable
                  expenses={groupExpenses}
                  pagination={{ page: 1, pages: 1, total: groupExpenses.length }}
                  onPageChange={() => {}}
                  onEdit={openEditExpenseModal}
                  onDelete={handleExpenseDelete}
                  searchTerm=""
                  onSearchChange={() => {}}
                  loading={detailLoading}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Create Group Form */}
      <div className="w-full lg:w-96 shrink-0">
        <div className="glass-card rounded-2xl p-6 border border-white/5 sticky top-24 space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/15">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Create Expense Group</h3>
          </div>

          <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Group Title *</label>
              <input
                type="text"
                placeholder="e.g. Goa Trip 2026, Wedding Prep"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input w-full text-xs"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Description</label>
              <textarea
                placeholder="Details about the campaign, event, or travel details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-input w-full text-xs min-h-[70px] resize-none"
                disabled={isSubmitting}
              />
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
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Enable Budget Limit Checkbox */}
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="isBudgetEnabled"
                checked={isBudgetEnabled}
                onChange={(e) => {
                  setIsBudgetEnabled(e.target.checked);
                  if (!e.target.checked) setBudgetLimit('');
                }}
                className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500/20 bg-slate-950"
              />
              <label htmlFor="isBudgetEnabled" className="text-xs uppercase font-bold text-slate-300 block tracking-wider cursor-pointer">
                Enable Budget Limit
              </label>
            </div>

            {/* Budget Limit */}
            {isBudgetEnabled && (
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Group Budget Limit (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="glass-input w-full text-xs"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            {/* Status Selection */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input w-full text-xs"
                disabled={isSubmitting}
              >
                <option value="active" className="bg-slate-900 text-white">Active (Open to spend)</option>
                <option value="completed" className="bg-slate-900 text-white">Completed (Goal achieved)</option>
                <option value="archived" className="bg-slate-900 text-white">Archived</option>
              </select>
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
                  <span>Create Group</span>
                </>
              )}
            </button>
          </form>

          {/* Tips block */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 space-y-1.5">
            <span className="text-xs uppercase font-bold text-indigo-400 block flex items-center">
              <HelpCircle className="h-3.5 w-3.5 mr-1" /> What are expense groups?
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use groups to track one-off expenses (like trips, events, weddings) separately. This lets you calculate totals for specific things without skewing your normal monthly budget metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Form Modal for this group context */}
      <ExpenseForm
        expense={editingExpense}
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
        budgets={budgets}
        groups={groups}
      />
    </div>
  );
};

export default ExpenseGroups;
