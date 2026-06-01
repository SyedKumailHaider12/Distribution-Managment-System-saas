'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, Shield, User, Calendar, Activity } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  tableName: string | null;
  recordId: number | null;
  details: string | null;
  timestamp: Date;
  user: { id: number; fullName: string | null; username: string } | null;
}

interface AppUser {
  id: number;
  fullName: string | null;
  username: string;
  role: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CREATE_CUSTOMER_RETURN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CREATE_PURCHASE_RETURN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PAYMENT: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export default function AuditClient({ logs, users }: { logs: AuditLog[]; users: AppUser[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))).sort(), [logs]);
  const uniqueTables = useMemo(() => Array.from(new Set(logs.map(l => l.tableName).filter(Boolean))).sort() as string[], [logs]);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchUser = log.user?.fullName?.toLowerCase().includes(q) || log.user?.username?.toLowerCase().includes(q);
        const matchTable = log.tableName?.toLowerCase().includes(q);
        if (!matchDetails && !matchUser && !matchTable) return false;
      }
      // User filter
      if (filterUser && log.user?.id?.toString() !== filterUser) return false;
      // Action filter
      if (filterAction && log.action !== filterAction) return false;
      // Table filter
      if (filterTable && log.tableName !== filterTable) return false;
      // Date from
      if (filterDateFrom && new Date(log.timestamp) < new Date(filterDateFrom)) return false;
      // Date to
      if (filterDateTo && new Date(log.timestamp) > new Date(filterDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [logs, searchTerm, filterUser, filterAction, filterTable, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterUser('');
    setFilterAction('');
    setFilterTable('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasFilters = searchTerm || filterUser || filterAction || filterTable || filterDateFrom || filterDateTo;

  // Stats
  const todayCount = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" /> Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track all system activities by employee</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Logs</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{logs.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{todayCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deletions</p>
          <p className="text-2xl font-black text-red-500 mt-1">{deleteCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </h2>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search details, user..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Employee/User filter */}
          <div>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Employees</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Table filter */}
          <div>
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Modules</option>
              {uniqueTables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Date range row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Activity Log
          </span>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No audit logs match your filters</p>
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-xs">
                            {log.user?.fullName || log.user?.username || 'System'}
                          </p>
                          {log.user?.fullName && (
                            <p className="text-[10px] text-slate-400">@{log.user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs font-medium">
                      {log.tableName || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {log.recordId ? `#${log.recordId}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs">
                      <span className="line-clamp-2" title={log.details || ''}>
                        {log.details || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
