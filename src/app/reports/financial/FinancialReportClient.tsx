'use client';

import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Download, FileDown, RotateCcw, DollarSign, Users, Package } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pdf } from '@react-pdf/renderer';
import BasePDFReport from '@/components/reports/BasePDFReport';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 7 },
  cell: { fontSize: 9, padding: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  summaryLabel: { fontSize: 10, color: '#475569' },
  summaryValue: { fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginTop: 15, marginBottom: 8 },
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

interface Props {
  salesInvoices: any[]; purchaseInvoices: any[];
  customerReturns: any[]; unpaidSales: any[]; unpaidPurchases: any[];
  settings: any; organization: any;
}

export default function FinancialReportClient({ salesInvoices, purchaseInvoices, customerReturns, unpaidSales, unpaidPurchases, settings, organization }: Props) {
  const { symbol } = useCurrency();
  const [reportType, setReportType] = useState<'pl' | 'customer-aging' | 'supplier-aging'>('pl');
  const [quickDate, setQuickDate] = useState('this-year');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'pl' || tab === 'customer-aging' || tab === 'supplier-aging') {
      setReportType(tab);
    }
  }, []);

  const effectiveDates = useMemo(() => quickDate === 'custom' ? { from: dateFrom, to: dateTo } : quickRange(quickDate), [quickDate, dateFrom, dateTo]);

  const filteredSales = useMemo(() => salesInvoices.filter(inv => {
    const d = new Date(inv.invoiceDate);
    if (effectiveDates.from && d < new Date(effectiveDates.from)) return false;
    if (effectiveDates.to && d > new Date(effectiveDates.to + 'T23:59:59')) return false;
    return true;
  }), [salesInvoices, effectiveDates]);

  const filteredPurchases = useMemo(() => purchaseInvoices.filter(inv => {
    const d = new Date(inv.invoiceDate);
    if (effectiveDates.from && d < new Date(effectiveDates.from)) return false;
    if (effectiveDates.to && d > new Date(effectiveDates.to + 'T23:59:59')) return false;
    return true;
  }), [purchaseInvoices, effectiveDates]);

  // P&L Calculations
  const pl = useMemo(() => {
    const totalRevenue = filteredSales.reduce((s, i) => s + i.netAmount, 0);
    const totalCOGS = filteredSales.reduce((s, inv) => s + inv.items.reduce((is: number, item: any) => is + (item.purchasePrice * item.quantity), 0), 0);
    const totalReturns = customerReturns.reduce((s, r) => s + r.totalAmount, 0);
    const totalDiscount = filteredSales.reduce((s, i) => s + i.discount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalReturns;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalPurchaseCost = filteredPurchases.reduce((s, i) => s + i.netAmount, 0);
    return { totalRevenue, totalCOGS, totalReturns, totalDiscount, grossProfit, netProfit, grossMargin, netMargin, totalPurchaseCost };
  }, [filteredSales, filteredPurchases, customerReturns]);

  // Customer Aging
  const customerAging = useMemo(() => {
    const now = new Date();
    const map = new Map<number, any>();
    for (const inv of unpaidSales) {
      const due = inv.netAmount - inv.paidAmount;
      if (due <= 0) continue;
      const days = Math.floor((now.getTime() - new Date(inv.invoiceDate).getTime()) / 86400000);
      const k = inv.customer.id;
      const e = map.get(k) || { id: k, name: inv.customer.name, phone: inv.customer.phone || '', current: 0, d30: 0, d60: 0, d90: 0, over90: 0, total: 0 };
      if (days <= 30) e.current += due; else if (days <= 60) e.d30 += due; else if (days <= 90) e.d60 += due; else e.over90 += due;
      e.total += due;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [unpaidSales]);

  // Supplier Aging
  const supplierAging = useMemo(() => {
    const now = new Date();
    const map = new Map<number, any>();
    for (const inv of unpaidPurchases) {
      const due = inv.netAmount - inv.paidAmount;
      if (due <= 0) continue;
      const days = Math.floor((now.getTime() - new Date(inv.invoiceDate).getTime()) / 86400000);
      const k = inv.supplier.id;
      const e = map.get(k) || { id: k, name: inv.supplier.name, phone: inv.supplier.phone || '', current: 0, d30: 0, d60: 0, d90: 0, over90: 0, total: 0 };
      if (days <= 30) e.current += due; else if (days <= 60) e.d30 += due; else if (days <= 90) e.d60 += due; else e.over90 += due;
      e.total += due;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [unpaidPurchases]);

  const orgDetails = { name: organization?.name || settings?.companyName || 'AzanTech DMS', phone: settings?.companyPhone, email: settings?.companyEmail, address: settings?.companyAddress, city: settings?.companyCity };
  const dateRange = effectiveDates.from ? `${new Date(effectiveDates.from).toLocaleDateString()} - ${new Date(effectiveDates.to || new Date()).toLocaleDateString()}` : 'All Time';

  const exportPDF = async () => {
    let doc;
    if (reportType === 'pl') {
      doc = (
        <BasePDFReport organization={orgDetails} reportTitle="PROFIT & LOSS STATEMENT" reportSubtitle={`Period: ${dateRange}`}>
          <View style={{ marginTop: 10 }}>
            {[
              ['REVENUE', null], ['Total Sales', symbol + pl.totalRevenue.toFixed(2)],
              ['Less: Discounts', '-' + symbol + pl.totalDiscount.toFixed(2)],
              ['Less: Returns', '-' + symbol + pl.totalReturns.toFixed(2)],
              ['Net Revenue', symbol + (pl.totalRevenue - pl.totalDiscount - pl.totalReturns).toFixed(2)],
              ['', null],
              ['COST OF GOODS', null], ['Cost of Sales (COGS)', symbol + pl.totalCOGS.toFixed(2)],
              ['', null],
              ['GROSS PROFIT', symbol + pl.grossProfit.toFixed(2)],
              ['Gross Margin', pl.grossMargin.toFixed(1) + '%'],
              ['', null],
              ['NET PROFIT', symbol + pl.netProfit.toFixed(2)],
              ['Net Margin', pl.netMargin.toFixed(1) + '%'],
            ].map(([label, value], i) => (
              <View key={i} style={pdfStyles.summaryRow}>
                <Text style={pdfStyles.summaryLabel}>{label}</Text>
                {value && <Text style={pdfStyles.summaryValue}>{value}</Text>}
              </View>
            ))}
          </View>
        </BasePDFReport>
      );
    } else if (reportType === 'customer-aging') {
      doc = (
        <BasePDFReport organization={orgDetails} reportTitle="CUSTOMER AGING REPORT" reportSubtitle={`Generated: ${new Date().toLocaleDateString()}`}>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              {['Customer','Phone','0-30','31-60','61-90','91+','Total'].map((h, i) => (
                <Text key={i} style={[pdfStyles.cell, { flex: [2.5,1.5,1.5,1.5,1.5,1.5,2][i] }]}>{h}</Text>
              ))}
            </View>
            {customerAging.map((c, i) => (
              <View key={i} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{c.name}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{c.phone || '—'}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{c.current.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{c.d30.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{c.d60.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{c.over90.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{c.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </BasePDFReport>
      );
    } else {
      doc = (
        <BasePDFReport organization={orgDetails} reportTitle="SUPPLIER AGING REPORT" reportSubtitle={`Generated: ${new Date().toLocaleDateString()}`}>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              {['Supplier','Phone','0-30','31-60','61-90','91+','Total'].map((h, i) => (
                <Text key={i} style={[pdfStyles.cell, { flex: [2.5,1.5,1.5,1.5,1.5,1.5,2][i] }]}>{h}</Text>
              ))}
            </View>
            {supplierAging.map((s, i) => (
              <View key={i} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{s.name}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{s.phone || '—'}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{s.current.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{s.d30.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{s.d60.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{symbol}{s.over90.toFixed(0)}</Text>
                <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{s.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </BasePDFReport>
      );
    }
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `financial-${reportType}-${Date.now()}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let headers: string[], rows: string[][];
    if (reportType === 'pl') {
      headers = ['Item','Amount']; rows = [['Total Sales', pl.totalRevenue.toFixed(2)], ['COGS', pl.totalCOGS.toFixed(2)], ['Returns', pl.totalReturns.toFixed(2)], ['Gross Profit', pl.grossProfit.toFixed(2)], ['Gross Margin %', pl.grossMargin.toFixed(2)], ['Net Profit', pl.netProfit.toFixed(2)], ['Net Margin %', pl.netMargin.toFixed(2)]];
    } else if (reportType === 'customer-aging') {
      headers = ['Customer','Phone','0-30 Days','31-60 Days','61-90 Days','Over 90','Total Due'];
      rows = customerAging.map(c => [c.name, c.phone, c.current.toFixed(2), c.d30.toFixed(2), c.d60.toFixed(2), c.over90.toFixed(2), c.total.toFixed(2)]);
    } else {
      headers = ['Supplier','Phone','0-30 Days','31-60 Days','61-90 Days','Over 90','Total Due'];
      rows = supplierAging.map(s => [s.name, s.phone, s.current.toFixed(2), s.d30.toFixed(2), s.d60.toFixed(2), s.over90.toFixed(2), s.total.toFixed(2)]);
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `financial-${reportType}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" /> Financial Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Profit & Loss, customer and supplier aging analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><FileDown className="w-4 h-4" /> PDF</button>
          <button onClick={exportCSV} className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      {/* Filters — only for P&L */}
      {reportType === 'pl' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Period</label>
              <select value={quickDate} onChange={e => setQuickDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
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
            <div className="flex items-end">
              <button onClick={() => { setQuickDate('this-year'); setDateFrom(''); setDateTo(''); }} className="w-full px-3 py-2 text-red-500 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {([
          { key: 'pl', label: 'Profit & Loss', icon: TrendingUp },
          { key: 'customer-aging', label: 'Customer Aging', icon: Users },
          { key: 'supplier-aging', label: 'Supplier Aging', icon: Package },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setReportType(t.key)} className={`px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${reportType === t.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* P&L View */}
      {reportType === 'pl' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {[
              { label: 'Total Revenue', value: pl.totalRevenue, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
              { label: 'Cost of Sales', value: pl.totalCOGS, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
              { label: 'Gross Profit', value: pl.grossProfit, color: pl.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
              { label: 'Net Profit', value: pl.netProfit, color: pl.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
            ].map((k, i) => (
              <div key={i} className={`p-4 rounded-xl border ${k.bg}`}>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{k.label}</p>
                <p className={`text-lg md:text-xl font-black ${k.color}`}>{symbol}{Math.abs(k.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>

          {/* P&L Statement */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Profit & Loss — {dateRange}</h3>
            <div className="space-y-0">
              {[
                { label: 'Revenue', isSection: true },
                { label: 'Gross Sales', value: pl.totalRevenue, indent: true },
                { label: 'Less: Discounts', value: -pl.totalDiscount, indent: true, neg: true },
                { label: 'Less: Returns', value: -pl.totalReturns, indent: true, neg: true },
                { label: 'Net Revenue', value: pl.totalRevenue - pl.totalDiscount - pl.totalReturns, bold: true },
                { label: '', isDivider: true },
                { label: 'Cost of Goods', isSection: true },
                { label: 'COGS (Purchase Price)', value: pl.totalCOGS, indent: true },
                { label: '', isDivider: true },
                { label: 'GROSS PROFIT', value: pl.grossProfit, bold: true, highlight: true, pct: pl.grossMargin },
                { label: '', isDivider: true },
                { label: 'NET PROFIT (after returns)', value: pl.netProfit, bold: true, highlight: true, pct: pl.netMargin },
              ].map((row, i) => {
                if (row.isDivider) return <div key={i} className="border-t border-slate-200 dark:border-slate-700 my-2" />;
                if (row.isSection) return <p key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 mb-1">{row.label}</p>;
                const isNeg = row.neg || (row.value !== undefined && row.value < 0);
                return (
                  <div key={i} className={`flex justify-between items-center py-2 px-2 rounded ${row.highlight ? (row.value! >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20') : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'} ${row.indent ? 'ml-4' : ''}`}>{row.label}</span>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isNeg ? 'text-red-600' : row.highlight ? (row.value! >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600') : 'text-slate-800 dark:text-white'}`}>
                        {isNeg && row.value! < 0 ? '-' : ''}{symbol}{Math.abs(row.value!).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {row.pct !== undefined && <p className="text-[10px] text-slate-400">{row.pct.toFixed(1)}%</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Aging Tables */}
      {(reportType === 'customer-aging' || reportType === 'supplier-aging') && (() => {
        const data = reportType === 'customer-aging' ? customerAging : supplierAging;
        const entityLabel = reportType === 'customer-aging' ? 'Customer' : 'Supplier';
        const totalRow = data.reduce((acc, row) => ({ current: acc.current + row.current, d30: acc.d30 + row.d30, d60: acc.d60 + row.d60, over90: acc.over90 + row.over90, total: acc.total + row.total }), { current: 0, d30: 0, d60: 0, over90: 0, total: 0 });
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: '0-30 Days', value: totalRow.current, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' },
                { label: '31-60 Days', value: totalRow.d30, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200' },
                { label: '61-90 Days', value: totalRow.d60, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
                { label: '91+ Days', value: totalRow.over90, color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200' },
              ].map((k, i) => (
                <div key={i} className={`p-4 rounded-xl border ${k.color.split(' ').slice(1).join(' ')}`}>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">{k.label}</p>
                  <p className={`text-lg md:text-xl font-black ${k.color.split(' ')[0]}`}>{symbol}{k.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-4 py-3">{entityLabel}</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3 text-right bg-emerald-50/50 dark:bg-emerald-900/10">0-30 Days</th>
                      <th className="px-4 py-3 text-right bg-amber-50/50 dark:bg-amber-900/10">31-60 Days</th>
                      <th className="px-4 py-3 text-right bg-orange-50/50 dark:bg-orange-900/10">61-90 Days</th>
                      <th className="px-4 py-3 text-right bg-red-50/50 dark:bg-red-900/10">91+ Days</th>
                      <th className="px-4 py-3 text-right font-black">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No outstanding balances found</td></tr>
                    ) : data.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{row.phone || '—'}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">{row.current > 0 ? `${symbol}${row.current.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-amber-600 font-bold">{row.d30 > 0 ? `${symbol}${row.d30.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-orange-600 font-bold">{row.d60 > 0 ? `${symbol}${row.d60.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-bold">{row.over90 > 0 ? `${symbol}${row.over90.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{symbol}{row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-300">Grand Total ({data.length} {entityLabel.toLowerCase()}s)</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{symbol}{totalRow.current.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{symbol}{totalRow.d30.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-700">{symbol}{totalRow.d60.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-red-700">{symbol}{totalRow.over90.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-800 dark:text-white">{symbol}{totalRow.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
