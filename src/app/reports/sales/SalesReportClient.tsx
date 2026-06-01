'use client';

import { useState, useMemo } from 'react';
import { BarChart3, Download, RotateCcw, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  saleType: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  customer: { id: number; name: string };
  salesman: { id: number; name: string } | null;
  items: Array<{
    quantity: number;
    salePrice: number;
    subtotal: number;
    product: { id: number; name: string; genericName: string | null };
  }>;
}

interface Props {
  invoices: Invoice[];
  customers: { id: number; name: string }[];
  salesmen: { id: number; name: string }[];
}

function getQuickDateRange(quickDate: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = fmt(today);

  switch (quickDate) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(start), to: todayStr };
    }
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(start), to: fmt(end) };
    }
    case 'this-year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(start), to: todayStr };
    }
    case 'last-year': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { from: fmt(start), to: fmt(end) };
    }
    default:
      return { from: '', to: '' };
  }
}

export default function SalesReportClient({ invoices, customers, salesmen }: Props) {
  const { symbol } = useCurrency();
  const [quickDate, setQuickDate] = useState('this-month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [saleType, setSaleType] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [salesmanId, setSalesmanId] = useState('');
  const [reportType, setReportType] = useState<'summary' | 'product' | 'customer' | 'salesman'>('summary');

  // Resolve effective date range
  const effectiveDates = useMemo(() => {
    if (quickDate === 'custom') return { from: dateFrom, to: dateTo };
    return getQuickDateRange(quickDate);
  }, [quickDate, dateFrom, dateTo]);

  // Filter invoices in real-time
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      if (effectiveDates.from && invDate < new Date(effectiveDates.from)) return false;
      if (effectiveDates.to && invDate > new Date(effectiveDates.to + 'T23:59:59')) return false;
      if (saleType && inv.saleType !== saleType) return false;
      if (customerId && inv.customer.id.toString() !== customerId) return false;
      if (salesmanId && inv.salesman?.id.toString() !== salesmanId) return false;
      return true;
    });
  }, [invoices, effectiveDates, saleType, customerId, salesmanId]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSales = filtered.reduce((s, i) => s + i.netAmount, 0);
    const totalDiscount = filtered.reduce((s, i) => s + i.discount, 0);
    const totalPaid = filtered.reduce((s, i) => s + i.paidAmount, 0);
    const totalDue = totalSales - totalPaid;
    const retailCount = filtered.filter(i => i.saleType === 'retail').length;
    const distCount = filtered.filter(i => i.saleType === 'distribution').length;
    return { totalSales, totalDiscount, totalPaid, totalDue, retailCount, distCount, count: filtered.length };
  }, [filtered]);

  // Product-wise aggregation
  const productReport = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filtered.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.product.id.toString();
        const existing = map.get(key) || { name: item.product.name, qty: 0, revenue: 0 };
        map.set(key, { name: existing.name, qty: existing.qty + item.quantity, revenue: existing.revenue + item.subtotal });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // Customer-wise aggregation
  const customerReport = useMemo(() => {
    const map = new Map<string, { name: string; invoices: number; revenue: number; paid: number }>();
    filtered.forEach(inv => {
      const key = inv.customer.id.toString();
      const existing = map.get(key) || { name: inv.customer.name, invoices: 0, revenue: 0, paid: 0 };
      map.set(key, { name: existing.name, invoices: existing.invoices + 1, revenue: existing.revenue + inv.netAmount, paid: existing.paid + inv.paidAmount });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // Salesman-wise aggregation
  const salesmanReport = useMemo(() => {
    const map = new Map<string, { name: string; invoices: number; revenue: number }>();
    filtered.forEach(inv => {
      const key = inv.salesman?.id?.toString() || 'none';
      const name = inv.salesman?.name || 'No Salesman';
      const existing = map.get(key) || { name, invoices: 0, revenue: 0 };
      map.set(key, { name: existing.name, invoices: existing.invoices + 1, revenue: existing.revenue + inv.netAmount });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const exportCSV = () => {
    let rows: string[][] = [];
    let headers: string[] = [];
    if (reportType === 'summary') {
      headers = ['Invoice #', 'Date', 'Type', 'Customer', 'Salesman', 'Total', 'Discount', 'Net', 'Paid', 'Due', 'Status'];
      rows = filtered.map(inv => [
        inv.invoiceNumber,
        new Date(inv.invoiceDate).toLocaleDateString(),
        inv.saleType,
        inv.customer.name,
        inv.salesman?.name || '',
        inv.totalAmount.toFixed(2),
        inv.discount.toFixed(2),
        inv.netAmount.toFixed(2),
        inv.paidAmount.toFixed(2),
        (inv.netAmount - inv.paidAmount).toFixed(2),
        inv.status,
      ]);
    } else if (reportType === 'product') {
      headers = ['Product', 'Qty Sold', 'Revenue'];
      rows = productReport.map(p => [p.name, p.qty.toString(), p.revenue.toFixed(2)]);
    } else if (reportType === 'customer') {
      headers = ['Customer', 'Invoices', 'Revenue', 'Paid', 'Due'];
      rows = customerReport.map(c => [c.name, c.invoices.toString(), c.revenue.toFixed(2), c.paid.toFixed(2), (c.revenue - c.paid).toFixed(2)]);
    } else {
      headers = ['Salesman', 'Invoices', 'Revenue'];
      rows = salesmanReport.map(s => [s.name, s.invoices.toString(), s.revenue.toFixed(2)]);
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sales-report-${reportType}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" /> Sales Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time sales analysis and export</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick Date</label>
            <select value={quickDate} onChange={e => setQuickDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="today">Today</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {quickDate === 'custom' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sale Type</label>
            <select value={saleType} onChange={e => setSaleType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Types</option>
              <option value="retail">Retail</option>
              <option value="distribution">Distribution</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Salesman</label>
            <select value={salesmanId} onChange={e => setSalesmanId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Salesmen</option>
              {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setQuickDate('this-month'); setSaleType(''); setCustomerId(''); setSalesmanId(''); setDateFrom(''); setDateTo(''); }} className="w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-xs rounded-lg flex items-center justify-center gap-1 border border-red-200 dark:border-red-800">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2"><ShoppingCart className="w-4 h-4 text-indigo-500" /><p className="text-xs font-bold text-slate-400 uppercase">Invoices</p></div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.count}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.retailCount} retail · {stats.distCount} dist.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><p className="text-xs font-bold text-slate-400 uppercase">Net Sales</p></div>
          <p className="text-2xl font-black text-emerald-600">{symbol}{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">Disc: {symbol}{stats.totalDiscount.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-blue-500" /><p className="text-xs font-bold text-slate-400 uppercase">Collected</p></div>
          <p className="text-2xl font-black text-blue-600">{symbol}{stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-red-500" /><p className="text-xs font-bold text-slate-400 uppercase">Outstanding</p></div>
          <p className="text-2xl font-black text-red-500">{symbol}{stats.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['summary', 'product', 'customer', 'salesman'] as const).map(t => (
          <button key={t} onClick={() => setReportType(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors capitalize ${reportType === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'summary' ? 'Invoice List' : t === 'product' ? 'Product-wise' : t === 'customer' ? 'Customer-wise' : 'Salesman-wise'}
          </button>
        ))}
      </div>

      {/* Report table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'summary' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Salesman</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No invoices in selected range</td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.saleType === 'retail' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{inv.saleType}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{inv.customer.name}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.salesman?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold">{symbol}{inv.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{symbol}{inv.paidAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-bold">{symbol}{(inv.netAmount - inv.paidAmount).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'product' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {productReport.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">No data</td></tr>
                ) : productReport.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{p.qty}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{symbol}{p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'customer' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Invoices</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {customerReport.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No data</td></tr>
                ) : customerReport.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{c.invoices}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{symbol}{c.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{symbol}{c.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">{symbol}{(c.revenue - c.paid).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'salesman' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Salesman</th>
                  <th className="px-4 py-3 text-right">Invoices</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {salesmanReport.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">No data</td></tr>
                ) : salesmanReport.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{s.invoices}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{symbol}{s.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
