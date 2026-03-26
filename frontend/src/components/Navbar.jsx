import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  TrendingUp,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  IndianRupee,
  Wallet
} from 'lucide-react';

const Navbar = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Monthly Budgets', path: '/budgets', icon: CalendarDays },
    { name: 'Expense Groups', path: '/groups', icon: FolderKanban },
    { name: 'Savings & Goals', path: '/savings', icon: TrendingUp },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = menuItems.find((m) => m.path === location.pathname);
    return item ? item.name : 'FinFlow';
  };

  return (
    <div className="min-height-screen flex flex-col md:flex-row bg-[#030712]">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/5 sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            FinFlow
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-xs font-semibold">
              <IndianRupee className="h-3 w-3" />
              <span>{user.overallSavings?.toLocaleString('en-IN') || 0}</span>
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white focus:outline-none">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/5 pt-6 flex flex-col justify-between z-40 transition-transform duration-300 transform md:translate-x-0 md:static md:h-screen md:bg-transparent md:glass overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="px-6 mb-8 hidden md:flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              FinFlow
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 pl-3.5'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white pl-4'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile details & Logout at bottom */}
        {user && (
          <div className="p-4 border-t border-white/5 space-y-4">
            {/* Savings Quick Display (Desktop only) */}
            <div className="hidden md:block bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-xl p-3">
              <span className="text-xs font-semibold text-emerald-500 tracking-wider uppercase block">Overall Savings</span>
              <div className="flex items-center mt-1 text-emerald-400">
                <IndianRupee className="h-4.5 w-4.5 mr-0.5 font-bold" />
                <span className="text-xl font-bold tracking-tight">
                  {user.overallSavings?.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>

            {/* Profile Avatar / Logout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                  alt={user.name}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-white/5 glass sticky top-0 z-30">
          <h1 className="text-2xl font-bold text-white tracking-tight">{getPageTitle()}</h1>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1.5 rounded-lg text-sm text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Session</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-300">{user.name}</span>
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                  alt={user.name}
                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10"
                />
              </div>
            </div>
          )}
        </header>

        {/* Page Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Navbar;
