import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { User, Mail, ShieldCheck, Calendar, IndianRupee, FolderKanban, CalendarDays, KeyRound } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    budgetsCount: 0,
    groupsCount: 0,
    expensesCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch budgets to count
        const budgetRes = await API.get('/budgets');
        const budgetsCount = budgetRes.data.success ? budgetRes.data.count : 0;

        // Fetch groups to count
        const groupRes = await API.get('/groups');
        const groupsCount = groupRes.data.success ? groupRes.data.count : 0;

        // Fetch expenses count
        const expenseRes = await API.get('/expenses?limit=1');
        const expensesCount = expenseRes.data.success ? expenseRes.data.pagination.total : 0;

        setStats({
          budgetsCount,
          groupsCount,
          expensesCount,
        });
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 from-slate-900/60 to-slate-950/60 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none"></div>

        {/* Avatar */}
        <img
          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
          alt={user.name}
          className="h-28 w-28 rounded-3xl object-cover border border-white/10 ring-4 ring-indigo-500/10 shadow-2xl shrink-0"
        />

        {/* User profile data */}
        <div className="space-y-4 flex-1 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h2>
            <p className="text-slate-400 text-xs mt-1 flex items-center justify-center md:justify-start space-x-1.5">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>{user.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <span className="inline-flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Authorized Account</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Google Identity Provider</span>
            </span>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/5 text-center space-y-1.5">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Budgets Configured</span>
          {loading ? (
            <span className="h-5 w-5 border border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            <span className="text-2xl font-extrabold text-white block">{stats.budgetsCount}</span>
          )}
          <span className="text-xs text-slate-500 block">Monthly trackers initialized</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/5 text-center space-y-1.5">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Special Groups</span>
          {loading ? (
            <span className="h-5 w-5 border border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            <span className="text-2xl font-extrabold text-white block">{stats.groupsCount}</span>
          )}
          <span className="text-xs text-slate-500 block">Active campaigns & trips</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/5 text-center space-y-1.5">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Total Expenses logged</span>
          {loading ? (
            <span className="h-5 w-5 border border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            <span className="text-2xl font-extrabold text-white block">{stats.expensesCount}</span>
          )}
          <span className="text-xs text-slate-500 block">Unique ledger entries</span>
        </div>
      </div>

      {/* Detail Block */}
      <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">System Parameters</h3>
        <div className="divide-y divide-white/5 text-xs">
          <div className="py-3 flex justify-between">
            <span className="text-slate-400">Account ID</span>
            <code className="text-white text-xs font-mono select-all">{user.id}</code>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-slate-400">Auth Method</span>
            <span className="text-white font-medium">Google OAuth 2.0 (Verified via ID Token)</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-slate-400">Default Currency</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <IndianRupee className="h-3.5 w-3.5 mr-0.5" /> INR (Indian Rupee)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
