'use client';

import { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, Search, X } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'daily', name: 'Daily Sales Report' },
  { id: 'custom', name: 'Custom Range Sales Report' },
  { id: 'purchase', name: 'Purchase Report' },
  { id: 'profit', name: 'Profit Report' },
  { id: 'product-wise', name: 'Product-wise Sales' },
  { id: 'stock', name: 'Stock Report' },
  { id: 'movement', name: 'Stock Movement Report' },
  { id: 'expiry', name: 'Expiry Report' },
  { id: 'customer-balance', name: 'Customer Balance Report' },
  { id: 'customer-wise', name: 'Customer-wise Sales' },
  { id: 'customer-statement', name: 'Customer Statement' },
  { id: 'salesman', name: 'Salesman Performance' },
  { id: 'activity', name: 'Activity Logs' },
];

const QUICK_DATES = [
  { id: 'custom', name: 'Custom' },
  { id: 'today', name: 'Today' },
  { id: 'this-month', name: 'This Month' },
  { id: 'last-month', name: 'Last Month' },
  { id: 'this-year', name: 'This Year' },
  { id: 'last-year', name: 'Last Year' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [quickDate, setQuickDate] = useState('this-month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [saleType, setSaleType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" /> Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate and export various business reports</p>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              {REPORT_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quick Date</label>
            <select value={quickDate} onChange={(e) => setQuickDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              {QUICK_DATES.map(qd => <option key={qd.id} value={qd.id}>{qd.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sale Type</label>
            <select value={saleType} onChange={(e) => setSaleType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Sales</option>
              <option value="retail">Retail Only</option>
              <option value="distribution">Distribution Only</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-3">
            <button onClick={handlePreview} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Preview
            </button>
            <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Display Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{REPORT_TYPES.find(rt => rt.id === reportType)?.name}</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{isLoading ? 'Loading...' : 'Ready'}</span>
        </div>
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a report type and click Preview to generate the report</p>
        </div>
      </div>
    </div>
  );
}