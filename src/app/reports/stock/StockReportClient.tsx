'use client';

import { useState, useMemo } from 'react';
import { Boxes, Download, FileDown, AlertTriangle, RotateCcw, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pdf } from '@react-pdf/renderer';
import BasePDFReport from '@/components/reports/BasePDFReport';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 7 },
  cell: { fontSize: 9, padding: 4 },
});

type Stock = { id: number; quantity: number; product: { id: number; name: string; purchasePrice: number; salePriceRetail: number; salePriceDistribution: number; reorderLevel: number; category?: { name: string }; brand?: { name: string } }; batch: { id: number; batchNumber: string; expiryDate: Date | null; purchasePrice: number }; warehouse: { id: number; name: string } };

interface Props { stocks: Stock[]; settings: any; organization: any; }

export default function StockReportClient({ stocks, settings, organization }: Props) {
  const { symbol } = useCurrency();
  const [reportType, setReportType] = useState<'inventory' | 'lowstock' | 'expiry' | 'expired'>('inventory');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const lowStockThreshold = parseInt(settings?.alertStockThreshold || '10');
  const expiryDays = parseInt(settings?.alertExpiryDays || '30');
  const expiryAlertDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + expiryDays); return d; }, [expiryDays]);

  const warehouses = useMemo(() => [...new Map(stocks.map(s => [s.warehouse.id, s.warehouse.name])).entries()].map(([id, name]) => ({ id, name })), [stocks]);
  const categories = useMemo(() => [...new Map(stocks.map(s => [s.product.category?.name || '', s.product.category?.name || 'Uncategorized']).filter(([k]) => k)).entries()].map(([k, v]) => ({ key: k, label: v })), [stocks]);

  const filtered = useMemo(() => stocks.filter(s => {
    if (warehouseFilter && s.warehouse.id.toString() !== warehouseFilter) return false;
    if (categoryFilter && s.product.category?.name !== categoryFilter) return false;
    if (searchFilter && !s.product.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  }), [stocks, warehouseFilter, categoryFilter, searchFilter]);

  const inventory = filtered;
  const lowStock = filtered.filter(s => s.quantity <= Math.max(lowStockThreshold, s.product.reorderLevel) && s.quantity > 0);
  const zeroStock = filtered.filter(s => s.quantity === 0);
  const expiringSoon = filtered.filter(s => s.batch.expiryDate && new Date(s.batch.expiryDate) <= expiryAlertDate && new Date(s.batch.expiryDate) >= new Date() && s.quantity > 0);
  const expired = filtered.filter(s => s.batch.expiryDate && new Date(s.batch.expiryDate) < new Date() && s.quantity > 0);

  const totalInventoryValue = inventory.reduce((sum, s) => sum + s.quantity * (s.batch.purchasePrice || s.product.purchasePrice), 0);
  const totalRetailValue = inventory.reduce((sum, s) => sum + s.quantity * s.product.salePriceRetail, 0);
  const totalUnits = inventory.reduce((sum, s) => sum + s.quantity, 0);

  const currentData = reportType === 'inventory' ? inventory : reportType === 'lowstock' ? [...lowStock, ...zeroStock] : reportType === 'expiry' ? expiringSoon : expired;

  const exportPDF = async () => {
    const doc = (
      <BasePDFReport
        organization={{ name: organization?.name || settings?.companyName || 'AzanTech DMS', phone: settings?.companyPhone, email: settings?.companyEmail, address: settings?.companyAddress, city: settings?.companyCity }}
        reportTitle="STOCK REPORT"
        reportSubtitle={`Type: ${reportType.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`}
      >
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            {['Product','Category','Warehouse','Batch','Expiry','Stock','Purchase Value'].map((h, i) => (
              <Text key={i} style={[pdfStyles.cell, { flex: [2.5, 1.5, 1.5, 1.5, 1.5, 1, 2][i] }]}>{h}</Text>
            ))}
          </View>
          {currentData.slice(0, 60).map((s, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{s.product.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{s.product.category?.name || '-'}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{s.warehouse.name}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{s.batch.batchNumber}</Text>
              <Text style={[pdfStyles.cell, { flex: 1.5 }]}>{s.batch.expiryDate ? new Date(s.batch.expiryDate).toLocaleDateString() : 'N/A'}</Text>
              <Text style={[pdfStyles.cell, { flex: 1 }]}>{s.quantity}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{symbol}{(s.quantity * (s.batch.purchasePrice || s.product.purchasePrice)).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </BasePDFReport>
    );
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `stock-report-${reportType}-${Date.now()}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Product','Category','Brand','Warehouse','Batch','Expiry','Qty','Purchase Price','Purchase Value','Retail Price','Retail Value'];
    const rows = currentData.map(s => [s.product.name, s.product.category?.name || '', s.product.brand?.name || '', s.warehouse.name, s.batch.batchNumber, s.batch.expiryDate ? new Date(s.batch.expiryDate).toLocaleDateString() : '', s.quantity.toString(), (s.batch.purchasePrice || s.product.purchasePrice).toFixed(2), (s.quantity * (s.batch.purchasePrice || s.product.purchasePrice)).toFixed(2), s.product.salePriceRetail.toFixed(2), (s.quantity * s.product.salePriceRetail).toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `stock-report-${reportType}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'inventory', label: 'Full Inventory', count: inventory.length, color: 'border-blue-500 text-blue-600' },
    { key: 'lowstock', label: 'Low / Zero Stock', count: lowStock.length + zeroStock.length, color: 'border-amber-500 text-amber-600' },
    { key: 'expiry', label: 'Expiring Soon', count: expiringSoon.length, color: 'border-orange-500 text-orange-600' },
    { key: 'expired', label: 'Expired', count: expired.length, color: 'border-red-500 text-red-600' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Boxes className="w-8 h-8 text-amber-500" /> Stock Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inventory analysis, expiry tracking and alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><FileDown className="w-4 h-4" /> PDF</button>
          <button onClick={exportCSV} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Purchase Value</p>
          <p className="text-lg md:text-xl font-black text-blue-600">{symbol}{totalInventoryValue.toLocaleString(undefined,{minimumFractionDigits:2})}</p>
          <p className="text-xs text-slate-400 mt-1">{totalUnits.toLocaleString()} total units</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retail Value</p>
          <p className="text-lg md:text-xl font-black text-emerald-600">{symbol}{totalRetailValue.toLocaleString(undefined,{minimumFractionDigits:2})}</p>
          <p className="text-xs text-slate-400 mt-1">Potential revenue</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs font-bold text-amber-500 uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low / Zero Stock</p>
          <p className="text-lg md:text-xl font-black text-amber-600">{lowStock.length + zeroStock.length} items</p>
          <p className="text-xs text-amber-500 mt-1">{zeroStock.length} out of stock</p>
        </div>
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Expiry Alerts</p>
          <p className="text-lg md:text-xl font-black text-red-600">{expiringSoon.length + expired.length} batches</p>
          <p className="text-xs text-red-500 mt-1">{expired.length} already expired</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Search Product</label>
            <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Product name..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Warehouse</label>
            <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setWarehouseFilter(''); setCategoryFilter(''); setSearchFilter(''); }} className="w-full px-3 py-2 text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setReportType(t.key)} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${reportType === t.key ? t.color : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${reportType === t.key ? 'bg-current/10 opacity-80' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[650px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Purchase Value</th>
                <th className="px-4 py-3 text-right">Retail Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {currentData.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No items found for this report</td></tr>
              ) : currentData.map((s, i) => {
                const isExpired = s.batch.expiryDate && new Date(s.batch.expiryDate) < new Date();
                const isExpiringSoon = s.batch.expiryDate && !isExpired && new Date(s.batch.expiryDate) <= expiryAlertDate;
                const isLow = s.quantity > 0 && s.quantity <= Math.max(lowStockThreshold, s.product.reorderLevel);
                const purchaseVal = s.quantity * (s.batch.purchasePrice || s.product.purchasePrice);
                const retailVal = s.quantity * s.product.salePriceRetail;
                return (
                  <tr key={i} className={`transition-colors ${isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : isExpiringSoon ? 'bg-orange-50/50 dark:bg-orange-900/10' : isLow ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{s.product.name}{s.product.brand?.name && <span className="text-xs text-slate-400 ml-1">({s.product.brand.name})</span>}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.product.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.warehouse.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600 dark:text-indigo-400">{s.batch.batchNumber}</td>
                    <td className="px-4 py-3 text-xs">
                      {s.batch.expiryDate ? (
                        <span className={`px-2 py-0.5 rounded font-bold ${isExpired ? 'bg-red-100 text-red-700' : isExpiringSoon ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>
                          {new Date(s.batch.expiryDate).toLocaleDateString()}
                        </span>
                      ) : <span className="text-slate-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black text-base ${s.quantity === 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>{s.quantity}</span>
                      {s.quantity === 0 && <span className="ml-1 text-[9px] bg-red-100 text-red-700 px-1 rounded font-bold">OUT</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400 font-bold">{symbol}{purchaseVal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{symbol}{retailVal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            {currentData.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-bold text-sm">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-slate-600 dark:text-slate-300">Total ({currentData.length} items)</td>
                  <td className="px-4 py-3 text-right text-slate-800 dark:text-white">{currentData.reduce((s, r) => s + r.quantity, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{symbol}{currentData.reduce((s, r) => s + r.quantity * (r.batch.purchasePrice || r.product.purchasePrice), 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{symbol}{currentData.reduce((s, r) => s + r.quantity * r.product.salePriceRetail, 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
