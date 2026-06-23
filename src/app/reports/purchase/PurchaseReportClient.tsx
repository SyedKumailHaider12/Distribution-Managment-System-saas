'use client';

import { useState, useMemo } from 'react';
import { Package, Download, RotateCcw, FileDown, TrendingDown, DollarSign, RotateCw } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pdf } from '@react-pdf/renderer';
import BasePDFReport from '@/components/reports/BasePDFReport';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 7 },
  totalRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', paddingVertical: 10, borderTopWidth: 2, borderColor: '#94a3b8' },
  cell: { fontSize: 9, padding: 4 },
  cellBold: { fontSize: 9, padding: 4, fontWeight: 'bold' },
});

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

type Invoice = { id: number; invoiceNumber: string; invoiceDate: Date; totalAmount: number; discount: number; netAmount: number; paidAmount: number; status: string; supplier: { id: number; name: string }; items: any[] };
type Return = { id: number; returnDate: Date; totalAmount: number; invoice: { invoiceNumber: string; supplier: { name: string } }; items: any[] };

interface Props {
  invoices: Invoice[]; returns: Return[];
  suppliers: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  settings: any; organization: any;
}

export default function PurchaseReportClient({ invoices, returns, suppliers, categories, settings, organization }: Props) {
  const { symbol } = useCurrency();
  const [quickDate, setQuickDate] = useState('this-month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reportType, setReportType] = useState<'summary' | 'supplier' | 'product' | 'returns'>('summary');

  const effectiveDates = useMemo(() => quickDate === 'custom' ? { from: dateFrom, to: dateTo } : quickRange(quickDate), [quickDate, dateFrom, dateTo]);

  const filtered = useMemo(() => invoices.filter(inv => {
    const d = new Date(inv.invoiceDate);
    if (effectiveDates.from && d < new Date(effectiveDates.from)) return false;
    if (effectiveDates.to && d > new Date(effectiveDates.to + 'T23:59:59')) return false;
    if (supplierId && inv.supplier.id.toString() !== supplierId) return false;
    return true;
  }), [invoices, effectiveDates, supplierId]);

  const stats = useMemo(() => ({
    total: filtered.reduce((s, i) => s + i.netAmount, 0),
    paid: filtered.reduce((s, i) => s + i.paidAmount, 0),
    discount: filtered.reduce((s, i) => s + i.discount, 0),
    count: filtered.length,
    returnTotal: returns.reduce((s, r) => s + r.totalAmount, 0),
  }), [filtered, returns]);

  const supplierReport = useMemo(() => {
    const map = new Map<string, { name: string; invoices: number; total: number; paid: number }>();
    filtered.forEach(inv => {
      const k = inv.supplier.id.toString();
      const e = map.get(k) || { name: inv.supplier.name, invoices: 0, total: 0, paid: 0 };
      map.set(k, { ...e, invoices: e.invoices + 1, total: e.total + inv.netAmount, paid: e.paid + inv.paidAmount });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const productReport = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    filtered.forEach(inv => inv.items.forEach((item: any) => {
      const k = item.productId?.toString() || item.product?.id?.toString();
      const name = item.product?.name || 'Unknown';
      const e = map.get(k) || { name, qty: 0, total: 0 };
      map.set(k, { name, qty: e.qty + item.quantity, total: e.total + item.subtotal });
    }));
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const exportPDF = async () => {
    const dateRange = effectiveDates.from && effectiveDates.to
      ? `${new Date(effectiveDates.from).toLocaleDateString()} - ${new Date(effectiveDates.to).toLocaleDateString()}`
      : 'All Time';
    const doc = (
      <BasePDFReport
        organization={{ name: organization?.name || settings?.companyName || 'AzanTech DMS', phone: settings?.companyPhone, email: settings?.companyEmail, address: settings?.companyAddress, city: settings?.companyCity }}
        reportTitle="PURCHASE REPORT"
        reportSubtitle={`Type: ${reportType.toUpperCase()} | Date Range: ${dateRange}`}
      >
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            {reportType === 'summary' && ['Invoice #','Date','Supplier','Total','Paid','Due'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [2,1.5,2.5,1.5,1.5,1.5][i] }]}>{h}</Text>
            ))}
            {reportType === 'supplier' && ['#','Supplier','Invoices','Total','Paid','Due'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [0.5,3,1,2,2,2][i] }]}>{h}</Text>
            ))}
            {reportType === 'product' && ['#','Product','Qty','Total Cost'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [0.5,3,1,2][i] }]}>{h}</Text>
            ))}
          </View>
          {reportType === 'summary' && filtered.slice(0, 50).map((inv, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{inv.invoiceNumber}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{new Date(inv.invoiceDate).toLocaleDateString()}</Text>
              <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{inv.supplier.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{inv.netAmount.toFixed(2)}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{inv.paidAmount.toFixed(2)}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{(inv.netAmount - inv.paidAmount).toFixed(2)}</Text>
            </View>
          ))}
          {reportType === 'summary' && filtered.length > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={[pdfStyles.cellBold, { flex: 6 }]}>GRAND TOTAL ({filtered.length} invoices)</Text>
              <Text style={[pdfStyles.cellBold, { flex: 1.5 }]}>{symbol}{stats.total.toFixed(2)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 1.5 }]}>{symbol}{stats.paid.toFixed(2)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 1.5 }]}>{symbol}{(stats.total - stats.paid).toFixed(2)}</Text>
            </View>
          )}
          {reportType === 'supplier' && supplierReport.map((s, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 0.5 }]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, { flex: 3 }]}>{s.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{s.invoices}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{s.total.toFixed(2)}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{s.paid.toFixed(2)}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{(s.total - s.paid).toFixed(2)}</Text>
            </View>
          ))}
          {reportType === 'supplier' && supplierReport.length > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={[pdfStyles.cellBold, { flex: 3.5 }]}>GRAND TOTAL ({supplierReport.length} suppliers)</Text>
              <Text style={[pdfStyles.cellBold, { flex: 1 }]}>{supplierReport.reduce((s, r) => s + r.invoices, 0)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 2 }]}>{symbol}{supplierReport.reduce((s, r) => s + r.total, 0).toFixed(2)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 2 }]}>{symbol}{supplierReport.reduce((s, r) => s + r.paid, 0).toFixed(2)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 2 }]}>{symbol}{supplierReport.reduce((s, r) => s + (r.total - r.paid), 0).toFixed(2)}</Text>
            </View>
          )}
          {reportType === 'product' && productReport.map((p, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 0.5 }]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, { flex: 3 }]}>{p.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{p.qty}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{p.total.toFixed(2)}</Text>
            </View>
          ))}
          {reportType === 'product' && productReport.length > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={[pdfStyles.cellBold, { flex: 3.5 }]}>GRAND TOTAL ({productReport.length} products)</Text>
              <Text style={[pdfStyles.cellBold, { flex: 1 }]}>{productReport.reduce((s, p) => s + p.qty, 0)}</Text>
              <Text style={[pdfStyles.cellBold, { flex: 2 }]}>{symbol}{productReport.reduce((s, p) => s + p.total, 0).toFixed(2)}</Text>
            </View>
          )}
        </View>
      </BasePDFReport>
    );
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `purchase-report-${Date.now()}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let rows: string[][] = [], headers: string[] = [];
    if (reportType === 'summary') {
      headers = ['Invoice #','Date','Supplier','Total','Discount','Net','Paid','Due','Status'];
      rows = filtered.map(i => [i.invoiceNumber, new Date(i.invoiceDate).toLocaleDateString(), i.supplier.name, i.totalAmount.toFixed(2), i.discount.toFixed(2), i.netAmount.toFixed(2), i.paidAmount.toFixed(2), (i.netAmount - i.paidAmount).toFixed(2), i.status]);
      rows.push(['', '', 'GRAND TOTAL', filtered.reduce((s, i) => s + i.totalAmount, 0).toFixed(2), stats.discount.toFixed(2), stats.total.toFixed(2), stats.paid.toFixed(2), (stats.total - stats.paid).toFixed(2), '']);
    } else if (reportType === 'supplier') {
      headers = ['Supplier','Invoices','Total','Paid','Due'];
      rows = supplierReport.map(s => [s.name, s.invoices.toString(), s.total.toFixed(2), s.paid.toFixed(2), (s.total - s.paid).toFixed(2)]);
      rows.push(['GRAND TOTAL', supplierReport.reduce((s, r) => s + r.invoices, 0).toString(), supplierReport.reduce((s, r) => s + r.total, 0).toFixed(2), supplierReport.reduce((s, r) => s + r.paid, 0).toFixed(2), supplierReport.reduce((s, r) => s + (r.total - r.paid), 0).toFixed(2)]);
    } else if (reportType === 'product') {
      headers = ['Product','Qty','Total Cost'];
      rows = productReport.map(p => [p.name, p.qty.toString(), p.total.toFixed(2)]);
      rows.push(['GRAND TOTAL', productReport.reduce((s, p) => s + p.qty, 0).toString(), productReport.reduce((s, p) => s + p.total, 0).toFixed(2)]);
    } else {
      headers = ['Date','Invoice #','Supplier','Amount'];
      rows = returns.map(r => [new Date(r.returnDate).toLocaleDateString(), r.invoice.invoiceNumber, r.invoice.supplier.name, r.totalAmount.toFixed(2)]);
      rows.push(['', '', 'GRAND TOTAL', returns.reduce((s: number, r: any) => s + r.totalAmount, 0).toFixed(2)]);
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `purchase-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: 'Total Purchases', value: `${symbol}${stats.total.toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Paid Amount', value: `${symbol}${stats.paid.toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Outstanding', value: `${symbol}${(stats.total-stats.paid).toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Returns', value: `${symbol}${stats.returnTotal.toLocaleString(undefined,{minimumFractionDigits:2})}`, icon: RotateCw, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const tabs = [
    { key: 'summary', label: 'Invoice List' },
    { key: 'supplier', label: 'By Supplier' },
    { key: 'product', label: 'By Product' },
    { key: 'returns', label: 'Returns Log' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" /> Purchase Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Purchase analysis and supplier performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportCSV} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick Date</label>
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
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Supplier</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setQuickDate('this-month'); setSupplierId(''); setDateFrom(''); setDateTo(''); }} className="w-full px-3 py-2 text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${k.bg}`}>
              <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${k.color}`} /><p className="text-xs font-bold text-slate-400 uppercase">{k.label}</p></div>
              <p className={`text-lg md:text-xl font-black ${k.color}`}>{k.value}</p>
              {i === 0 && <p className="text-xs text-slate-400 mt-1">{stats.count} invoices</p>}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setReportType(t.key)} className={`px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${reportType === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'summary' && (
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>{['Invoice #','Date','Supplier','Total','Discount','Net','Paid','Due','Status'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No invoices found</td></tr>
                : filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{inv.supplier.name}</td>
                    <td className="px-4 py-3 text-right">{symbol}{inv.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{symbol}{inv.discount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">{symbol}{inv.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{symbol}{inv.paidAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-amber-600 font-bold">{symbol}{(inv.netAmount - inv.paidAmount).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-900/70 font-black text-sm border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-slate-700 dark:text-slate-300">Grand Total ({filtered.length} invoices)</td>
                    <td className="px-4 py-3 text-right">{symbol}{filtered.reduce((s, i) => s + i.totalAmount, 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{symbol}{stats.discount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{symbol}{stats.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{symbol}{stats.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-600">{symbol}{(stats.total - stats.paid).toFixed(2)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === 'supplier' && (
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3 text-right">Invoices</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Outstanding</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {supplierReport.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No data</td></tr>
                : supplierReport.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-right text-indigo-600 font-bold">{s.invoices}</td>
                    <td className="px-4 py-3 text-right font-bold">{symbol}{s.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{symbol}{s.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-bold">{symbol}{(s.total - s.paid).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {supplierReport.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-900/70 font-black text-sm border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-300">Grand Total ({supplierReport.length} suppliers)</td>
                    <td className="px-4 py-3 text-right font-black text-indigo-600">{supplierReport.reduce((s, r) => s + r.invoices, 0)}</td>
                    <td className="px-4 py-3 text-right font-black">{symbol}{supplierReport.reduce((s, r) => s + r.total, 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{symbol}{supplierReport.reduce((s, r) => s + r.paid, 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black text-red-500">{symbol}{supplierReport.reduce((s, r) => s + (r.total - r.paid), 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === 'product' && (
            <table className="w-full text-sm text-left min-w-[400px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">Total Qty</th><th className="px-4 py-3 text-right">Total Cost</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {productReport.length === 0 ? <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">No data</td></tr>
                : productReport.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-bold">{p.qty}</td>
                    <td className="px-4 py-3 text-right text-slate-800 dark:text-white font-bold">{symbol}{p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {productReport.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-900/70 font-black text-sm border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-300">Grand Total ({productReport.length} products)</td>
                    <td className="px-4 py-3 text-right font-black text-blue-600">{productReport.reduce((s, p) => s + p.qty, 0)}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{symbol}{productReport.reduce((s, p) => s + p.total, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === 'returns' && (
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {returns.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No returns found</td></tr>
                : returns.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.returnDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-blue-600 text-xs">{r.invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{r.invoice.supplier.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.items.map((i: any) => i.product.name).join(', ')}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-bold">{symbol}{r.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {returns.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-900/70 font-black text-sm border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-slate-700 dark:text-slate-300">Grand Total ({returns.length} returns)</td>
                    <td className="px-4 py-3 text-right font-black text-red-600">{symbol}{returns.reduce((s: number, r: any) => s + r.totalAmount, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
