"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Receipt, ShoppingCart, Package, FileText, ArrowRight, BarChart3,
  TrendingUp, TrendingDown, Users, Boxes, AlertTriangle, Activity
} from 'lucide-react';
import { getReportsOverview } from './actions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

type OverviewData = Awaited<ReturnType<typeof getReportsOverview>>;

export default function ReportsDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportsOverview()
      .then(setOverview)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const reports = [
    {
      title: 'Sales Report',
      description: 'View comprehensive sales analytics, margins, and customer performance.',
      icon: Receipt,
      href: '/reports/sales',
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      title: 'Purchase Report',
      description: 'Analyze procurement, supplier performance, and purchase history.',
      icon: ShoppingCart,
      href: '/reports/purchase',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      title: 'Stock Report',
      description: 'Monitor inventory levels, low stock alerts, and product movement.',
      icon: Package,
      href: '/reports/stock',
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/20'
    },
    {
      title: 'Audit Logs',
      description: 'Track user activity, system changes, and security events.',
      icon: FileText,
      href: '/audit',
      color: 'text-slate-600',
      bg: 'bg-slate-100 dark:bg-slate-900/20'
    }
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);

  const kpis = overview
    ? [
        {
          label: 'Monthly Sales',
          value: fmt(overview.monthlySales),
          sub: `${overview.monthlySalesCount} invoices`,
          icon: TrendingUp,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
        },
        {
          label: 'Monthly Purchases',
          value: fmt(overview.monthlyPurchases),
          sub: `${overview.monthlyPurchasesCount} invoices`,
          icon: TrendingDown,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
        },
        {
          label: 'Total Customers',
          value: overview.totalCustomers.toLocaleString(),
          sub: 'Active customers',
          icon: Users,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
        },
        {
          label: 'Total Products',
          value: overview.totalProducts.toLocaleString(),
          sub: `${overview.lowStockCount} low stock`,
          icon: Boxes,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          alert: overview.lowStockCount > 0,
        },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Reports & Analytics
          </h1>
          <p className="text-slate-500 mt-1">Business intelligence at a glance</p>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                <p className={`text-xs mt-1 font-medium ${kpi.alert ? 'text-amber-500' : 'text-slate-400'}`}>
                  {kpi.alert && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {kpi.sub}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      {overview && overview.monthlyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales vs Purchases Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
          >
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Sales vs Purchases (6 Months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={overview.monthlyTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(value: number) => fmt(value)}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} name="Sales" />
                <Bar dataKey="purchases" fill="#22c55e" radius={[6, 6, 0, 0]} name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
          >
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={overview.monthlyTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(value: number) => fmt(value)}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" name="Sales Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Recent Activity */}
      {overview && overview.recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h3>
            <Link href="/audit" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold">View All →</Link>
          </div>
          <div className="space-y-3">
            {overview.recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {log.user?.fullName?.charAt(0) || log.user?.username?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    <span className="font-bold">{log.user?.fullName || log.user?.username}</span>
                    {' '}<span className="text-slate-400">performed</span>{' '}
                    <span className="font-semibold text-indigo-500">{log.action}</span>
                  </p>
                  <p className="text-xs text-slate-400 truncate">{log.details || log.tableName || '-'}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                  {new Date(log.timestamp).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Report Modules Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Detailed Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {reports.map((report, idx) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="h-full"
              >
                <Link href={report.href} className="block h-full">
                  <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${report.bg} opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out`} />

                    <div className="relative z-10 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.bg} ${report.color} mb-6 shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {report.title}
                      </h3>

                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-6 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      View Report <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
