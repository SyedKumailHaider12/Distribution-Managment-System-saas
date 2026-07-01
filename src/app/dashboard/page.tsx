"use client";

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, X, FileDown } from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getDashboardOutstandingData, getDashboardReceivablesData, getDashboardKPIs } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [kpis, setKPIs] = useState({
    todaySales: 0,
    monthSales: 0,
    receivables: 0,
    payables: 0,
    lowStock: 0,
    expiring: 0,
    totalCustomers: 0,
    totalOrders: 0,
    organizationName: '',
    subscriptionStatus: 'TRIAL',
    trialEndsAt: null as Date | string | null,
    subscriptionEndsAt: null as Date | string | null
  });
  
  const [outstandingData, setOutstandingData] = useState<{totalOutstanding: number, suppliersOutstanding: any[]}>({
    totalOutstanding: 0,
    suppliersOutstanding: []
  });

  const [receivablesData, setReceivablesData] = useState<{totalReceivables: number, customersReceivables: any[]}>({
    totalReceivables: 0,
    customersReceivables: []
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [outData, recData, kpiData] = await Promise.all([
          getDashboardOutstandingData(),
          getDashboardReceivablesData(),
          getDashboardKPIs(),
        ]);
        setOutstandingData(outData);
        setReceivablesData(recData);
        setKPIs(prev => ({
          ...prev,
          payables: outData.totalOutstanding,
          receivables: recData.totalReceivables,
          todaySales: kpiData.todaySales,
          monthSales: kpiData.monthSales,
          totalCustomers: kpiData.totalCustomers,
          lowStock: kpiData.lowStock,
          expiring: kpiData.expiring,
          organizationName: kpiData.organizationName,
          subscriptionStatus: kpiData.subscriptionStatus,
          trialEndsAt: kpiData.trialEndsAt ?? null,
          subscriptionEndsAt: kpiData.subscriptionEndsAt ?? null,
        }));
      } catch (e: any) {
        if (e.message?.includes('Unauthorized')) {
          setHasAccess(false);
        }
        console.error(e);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const exportToCSV = () => {
    const headers = ['Company', 'Supplier Name', 'Phone', 'Invoices Pending', 'Amount Due'];
    const rows = outstandingData.suppliersOutstanding.map(s => [
      s.companyName, s.supplierName, s.phone, s.invoiceCount, s.totalDue
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Outstanding_Payables.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { currency, symbol } = useCurrency();

  const kpiCards = [
    { title: "Today's Sales", value: `${symbol} ${kpis.todaySales.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    { title: 'This Month', value: `${symbol} ${kpis.monthSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { title: 'Receivables', value: `${symbol} ${kpis.receivables.toLocaleString()}`, icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', onClick: () => setIsReceivablesModalOpen(true), clickable: true },
    { title: 'Total Payables', value: `${symbol} ${kpis.payables.toLocaleString()}`, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', onClick: () => setIsModalOpen(true), clickable: true },
    { title: 'Low Stock', value: kpis.lowStock, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { title: 'Customers', value: kpis.totalCustomers, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" /> Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {!hasAccess ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-50" />
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Access Restricted</h2>
          <p className="text-slate-500 mt-2">You do not have permission to view the dashboard.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${kpi.bg} ${kpi.clickable ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:shadow-lg transition-all transform hover:-translate-y-1' : ''}`}
              onClick={kpi.clickable ? kpi.onClick : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                {kpi.clickable && <span className="text-[10px] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300">CLICK TO VIEW</span>}
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.title}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/sales" className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-400">New Sale</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Create invoice</p>
          </div>
        </Link>
        <Link href="/purchases" className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <Package className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-400">New Purchase</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Add stock</p>
          </div>
        </Link>
        <Link href="/customers" className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <Users className="w-6 h-6 text-purple-600" />
          <div>
            <p className="font-medium text-purple-800 dark:text-purple-400">Customers</p>
            <p className="text-xs text-purple-600 dark:text-purple-500">Manage</p>
          </div>
        </Link>
        <Link href="/stock" className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
          <Package className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">View Stock</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Inventory</p>
          </div>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link href="/companies" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-slate-200">Companies / Suppliers</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/categories" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-slate-200">Categories</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/warehouses" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-slate-200">Warehouses</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/reports/sales" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-slate-200">Reports</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">System Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Organization</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{kpis.organizationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Plan Status</span>
              <span className={`font-medium ${kpis.subscriptionStatus === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : kpis.subscriptionStatus === 'EXPIRED' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {kpis.subscriptionStatus}
              </span>
            </div>
            {kpis.subscriptionStatus === 'TRIAL' && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Trial Days Left</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {kpis.trialEndsAt ? Math.max(0, Math.ceil((new Date(kpis.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 7} Days
                </span>
              </div>
            )}
            {kpis.subscriptionStatus === 'ACTIVE' && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subscription Days Left</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {kpis.subscriptionEndsAt ? Math.max(0, Math.ceil((new Date(kpis.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 'N/A'} Days
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Account Email</span>
              <span className={`font-medium ${user?.emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {user?.emailVerified ? 'Verified ✓' : 'Unverified ⚠'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Currency</span>
              <span className="font-medium text-slate-800 dark:text-white">{currency} ({symbol})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Version</span>
              <span className="font-medium text-slate-800 dark:text-white">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payables Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <ArrowDownRight className="w-6 h-6 text-red-500" /> Total Outstanding Payables
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Detailed view of outstanding balances grouped by Supplier.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium">
                    <FileDown className="w-4 h-4" /> Export CSV
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-xs font-bold text-red-500 uppercase">Total Outstanding</p>
                    <p className="text-3xl font-black text-red-700 dark:text-red-400 mt-1">{currency}{outstandingData.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Suppliers with Due</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{outstandingData.suppliersOutstanding.length}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Company / Supplier</th>
                        <th className="px-6 py-4 font-semibold">Contact Info</th>
                        <th className="px-6 py-4 font-semibold text-center">Pending Invoices</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {outstandingData.suppliersOutstanding.map((sup, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-white">{sup.supplierName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{sup.companyName}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {sup.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400">
                              {sup.invoiceCount} invoices
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-black text-red-600 dark:text-red-400">
                              {currency}{sup.totalDue.toLocaleString(undefined, {minimumFractionDigits:2})}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {outstandingData.suppliersOutstanding.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No outstanding payables found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receivables Modal */}
      <AnimatePresence>
        {isReceivablesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <ArrowUpRight className="w-6 h-6 text-amber-500" /> Total Outstanding Receivables
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Customer payments pending for distribution sales.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/customers" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium">
                    <Users className="w-4 h-4" /> View Customers
                  </Link>
                  <button onClick={() => setIsReceivablesModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs font-bold text-amber-500 uppercase">Total Receivables</p>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{currency}{receivablesData.totalReceivables.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Customers with Due</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{receivablesData.customersReceivables.length}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Customer</th>
                        <th className="px-6 py-4 font-semibold">Contact Info</th>
                        <th className="px-6 py-4 font-semibold text-center">Pending Invoices</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {receivablesData.customersReceivables.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-white">{cust.customerName}</p>
                            {cust.address && <p className="text-[10px] text-slate-500">{cust.address}</p>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {cust.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400">
                              {cust.invoiceCount} invoices
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-black text-amber-600 dark:text-amber-400">
                              {currency}{cust.totalDue.toLocaleString(undefined, {minimumFractionDigits:2})}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {receivablesData.customersReceivables.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No outstanding receivables found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}