'use client';

import { useState, useMemo } from 'react';
import { ClipboardList, Download, FileDown, RotateCcw, RotateCw, CreditCard } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pdf } from '@react-pdf/renderer';
import BasePDFReport from '@/components/reports/BasePDFReport';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 7 },
  cell: { fontSize: 8, padding: 3 },
});

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700', UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700', PAYMENT: 'bg-amber-100 text-amber-700',
};

interface Props {
  logs: any[]; payments: any[];
  customerReturns: any[]; purchaseReturns: any[];
  settings: any; organization: any;
}

export default function AuditReportClient({ logs, payments, customerReturns, purchaseReturns, settings, organization }: Props) {
  const { symbol } = useCurrency();
  const [reportType, setReportType] = useState<'activity' | 'payments' | 'returns'>('activity');
  const [quickDate, setQuickDate] = useState('this-month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  function quickRange(key: string) {
    const now = new Date(); const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const today = fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    if (key === 'today') return { from: today, to: today };
    if (key === 'this-month') return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    if (key === 'last-month') return { from: fmt(new Date(now.getFullYear(), now.getMonth()-1, 1)), to: fmt(new Date(now.getFullYear(), now.getMonth(), 0)) };
    if (key === 'this-year') return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: today };
    return { from: '', to: '' };
  }

  const effectiveDates = useMemo(() => quickDate === 'custom' ? { from: dateFrom, to: dateTo } : quickRange(quickDate), [quickDate, dateFrom, dateTo]);

  const filteredLogs = useMemo(() => logs.filter(log => {
    const d = new Date(log.timestamp);
    if (effectiveDates.from && d < new Date(effectiveDates.from)) return false;
    if (effectiveDates.to && d > new Date(effectiveDates.to + 'T23:59:59')) return false;
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchFilter && !(log.details?.toLowerCase().includes(searchFilter.toLowerCase()) || log.tableName?.toLowerCase().includes(searchFilter.toLowerCase()))) return false;
    return true;
  }), [logs, effectiveDates, actionFilter, searchFilter]);

  const filteredPayments = useMemo(() => payments.filter(p => {
    const d = new Date(p.date);
    if (effectiveDates.from && d < new Date(effectiveDates.from)) return false;
    if (effectiveDates.to && d > new Date(effectiveDates.to + 'T23:59:59')) return false;
    return true;
  }), [payments, effectiveDates]);

  const orgDetails = { name: organization?.name || settings?.companyName || 'AzanTech DMS', phone: settings?.companyPhone, email: settings?.companyEmail, address: settings?.companyAddress, city: settings?.companyCity };
  const dateRange = effectiveDates.from ? `${new Date(effectiveDates.from).toLocaleDateString()} - ${new Date(effectiveDates.to || new Date()).toLocaleDateString()}` : 'All Time';

  const exportPDF = async () => {
    const doc = (
      <BasePDFReport organization={orgDetails} reportTitle={reportType === 'activity' ? 'ACTIVITY LOG' : reportType === 'payments' ? 'PAYMENT HISTORY' : 'RETURNS LOG'} reportSubtitle={`Date Range: ${dateRange}`}>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            {reportType === 'activity' && ['Date/Time','User','Action','Module','Details'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [2,1.5,1,1.5,4][i] }]}>{h}</Text>
            ))}
            {reportType === 'payments' && ['Date','Type','Method','Customer/Supplier','Ref #','Amount'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [1.5,1,1,2.5,2,1.5][i] }]}>{h}</Text>
            ))}
            {reportType === 'returns' && ['Date','Type','Invoice #','Customer/Supplier','Items','Amount'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [1.5,1,1.5,2,3,1.5][i] }]}>{h}</Text>
            ))}
          </View>
          {reportType === 'activity' && filteredLogs.slice(0, 60).map((log, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{new Date(log.timestamp).toLocaleString()}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{log.user?.fullName || log.user?.username || '—'}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{log.action}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{log.tableName || '—'}</Text>
              <Text style={[pdfStyles.cell, { flex: 4 }]}>{log.details || '—'}</Text>
            </View>
          ))}
          {reportType === 'payments' && filteredPayments.map((p, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{new Date(p.date).toLocaleDateString()}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{p.type}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{p.paymentMethod}</Text>
              <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{p.customer?.name || p.supplier?.name || '—'}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{p.invoiceNumber || '—'}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{p.amount.toFixed(2)}</Text>
            </View>
          ))}
          {reportType === 'returns' && [...customerReturns.map(r => ({ ...r, retType: 'Customer' })), ...purchaseReturns.map(r => ({ ...r, retType: 'Purchase' }))].sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime()).map((r, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{new Date(r.returnDate).toLocaleDateString()}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{r.retType}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{r.invoice.invoiceNumber}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{r.retType === 'Customer' ? r.invoice.customer?.name : r.invoice.supplier?.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 3 }]}>{r.items.map((it: any) => it.product.name).join(', ')}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{r.totalAmount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </BasePDFReport>
    );
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-${reportType}-${Date.now()}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let headers: string[], rows: string[][];
    if (reportType === 'activity') {
      headers = ['Date/Time','User','Action','Module','Record ID','Details'];
      rows = filteredLogs.map(l => [new Date(l.timestamp).toLocaleString(), l.user?.fullName || l.user?.username || '', l.action, l.tableName || '', String(l.recordId || ''), l.details || '']);
    } else if (reportType === 'payments') {
      headers = ['Date','Type','Method','Customer/Supplier','Invoice #','Amount','Notes'];
      rows = filteredPayments.map(p => [new Date(p.date).toLocaleDateString(), p.type, p.paymentMethod, p.customer?.name || p.supplier?.name || '', p.invoiceNumber || '', p.amount.toFixed(2), p.notes || '']);
    } else {
      const allReturns = [...customerReturns.map(r => ({ ...r, retType: 'Customer' })), ...purchaseReturns.map(r => ({ ...r, retType: 'Purchase' }))];
      headers = ['Date','Type','Invoice #','Party','Items','Amount'];
      rows = allReturns.map(r => [new Date(r.returnDate).toLocaleDateString(), r.retType, r.invoice.invoiceNumber, r.retType === 'Customer' ? r.invoice.customer?.name : r.invoice.supplier?.name, r.items.map((i: any) => i.product.name).join('; '), r.totalAmount.toFixed(2)]);
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `audit-${reportType}-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const allReturns = [...customerReturns.map(r => ({ ...r, retType: 'Customer' })), ...purchaseReturns.map(r => ({ ...r, retType: 'Purchase' }))].sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
  const paymentTotal = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const returnTotal = allReturns.reduce((s, r) => s + r.totalAmount, 0);
  const actions = ['ALL', ...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-purple-600" /> Audit Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Activity logs, payment history and returns tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><FileDown className="w-4 h-4" /> PDF</button>
          <button onClick={exportCSV} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Log Entries', value: filteredLogs.length.toString(), color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Payments', value: `${symbol}${paymentTotal.toLocaleString(undefined,{minimumFractionDigits:2})}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Cust. Returns', value: `${customerReturns.length} items`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Purch. Returns', value: `${purchaseReturns.length} items`, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((k, i) => (
          <div key={i} className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${k.bg}`}>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">{k.label}</p>
            <p className={`text-lg md:text-xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Quick Date</label>
            <select value={quickDate} onChange={e => setQuickDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="today">Today</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {quickDate === 'custom' && <>
            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" /></div>
          </>}
          {reportType === 'activity' && <>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Action</label>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                {actions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Search</label>
              <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Filter details..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
          </>}
          <div className="flex items-end">
            <button onClick={() => { setQuickDate('this-month'); setActionFilter('ALL'); setSearchFilter(''); setDateFrom(''); setDateTo(''); }} className="w-full px-3 py-2 text-red-500 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {[
          { key: 'activity', label: 'Activity Log', icon: ClipboardList, count: filteredLogs.length },
          { key: 'payments', label: 'Payments', icon: CreditCard, count: filteredPayments.length },
          { key: 'returns', label: 'Returns', icon: RotateCw, count: allReturns.length },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setReportType(t.key as any)} className={`px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${reportType === t.key ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-black">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'activity' && (
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">Date & Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Details</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLogs.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No activity logs found</td></tr>
                : filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white text-xs">{log.user?.fullName || log.user?.username || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>{log.action}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.tableName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'payments' && (
            <table className="w-full text-sm text-left min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Customer / Supplier</th><th className="px-4 py-3">Invoice Ref</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Notes</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredPayments.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No payments found</td></tr>
                : filteredPayments.map((p: any, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.type === 'INCOMING' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{p.type}</span></td>
                    <td className="px-4 py-3 text-xs font-medium">{p.paymentMethod}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.customer?.name || p.supplier?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600 dark:text-indigo-400">{p.invoiceNumber || '—'}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{symbol}{p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <tr><td colSpan={5} className="px-4 py-3 text-slate-600 dark:text-slate-300">Total ({filteredPayments.length} payments)</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{symbol}{paymentTotal.toFixed(2)}</td><td /></tr>
              </tfoot>
            </table>
          )}

          {reportType === 'returns' && (
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Customer / Supplier</th><th className="px-4 py-3">Items Returned</th><th className="px-4 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {allReturns.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No returns found</td></tr>
                : allReturns.map((r: any, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.retType === 'Customer' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.retType}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600 dark:text-indigo-400">{r.invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{r.retType === 'Customer' ? r.invoice.customer?.name : r.invoice.supplier?.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{r.items.map((it: any) => it.product.name).join(', ')}</td>
                    <td className="px-4 py-3 text-right font-black text-red-600">{symbol}{r.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <tr><td colSpan={5} className="px-4 py-3 text-slate-600 dark:text-slate-300">Total ({allReturns.length} returns)</td>
                  <td className="px-4 py-3 text-right text-red-600">{symbol}{returnTotal.toFixed(2)}</td></tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
