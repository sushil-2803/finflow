import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import SavingsCard from '../components/SavingsCard';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, FileText, Calendar, IndianRupee, HelpCircle, Inbox } from 'lucide-react';

const Savings = () => {
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/savings/history');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching savings history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSpendSavings = async (transactionData) => {
    try {
      const res = await API.post('/savings/spend', transactionData);
      if (res.data.success) {
        // Refresh local history & user profile balance
        fetchHistory();
        await refreshUser();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to record transaction',
      };
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Overview & Spend Form */}
      <SavingsCard
        overallSavings={user?.overallSavings || 0}
        onSpendSavings={handleSpendSavings}
      />

      {/* Savings Ledger History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2.5"></span>
          Savings Spend Ledger
        </h3>

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-400">Withdrawals from accumulated savings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Item details</th>
                  <th className="px-6 py-4">Transaction Date</th>
                  <th className="px-6 py-4">Purpose / Memo</th>
                  <th className="px-6 py-4 text-right">Amount Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading && history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400">
                      <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                      <p className="mt-2 text-xs">Loading transaction logs...</p>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                      <span>No savings spending recorded yet.</span>
                    </td>
                  </tr>
                ) : (
                  history.map((transaction) => {
                    const { _id, title, amount, purpose, transactionDate } = transaction;
                    return (
                      <tr key={_id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{title}</td>
                        <td className="px-6 py-4 text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>{formatDate(transactionDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {purpose ? (
                            <span className="flex items-center space-x-1">
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              <span>{purpose}</span>
                            </span>
                          ) : (
                            <span className="italic text-slate-600 text-xs">No memo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-400 text-sm whitespace-nowrap">
                          <span className="text-xs font-normal mr-0.5">₹</span>
                          <span>{amount.toLocaleString('en-IN')}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Logic details */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 flex items-start space-x-3.5">
        <HelpCircle className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white tracking-tight">How Accumulated Savings Work</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your **Overall Savings** represents all the funds left over from completed monthly budgets. When you click **Close & Save** on a monthly budget, any remaining balance transfers automatically into this pool.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            You can spend directly from this savings pool for major, unbudgeted purchases. These transactions are tracked separately from your daily monthly budgets to maintain historical budgeting integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Savings;
