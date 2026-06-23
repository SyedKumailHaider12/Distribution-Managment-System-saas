'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, RotateCcw, ArrowRightLeft, History, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { createCustomerReturn } from '../customer/actions';

interface InvoiceItem {
  id: number;
  quantity: number;
  salePrice: number;
  product: { id: number; name: string };
  batch: { id: number; batchNumber: string };
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  netAmount: number;
  customer: { name: string };
  items: InvoiceItem[];
}

interface ReturnItem {
  salesItemId: number;
  productId: number;
  batchId: number;
  quantity: number;
  salePrice: number;
}

export function SalesReturnsClient({
  initialInvoices,
  returns = [],
}: {
  initialInvoices: Invoice[];
  purchaseInvoices?: any[];
  returns?: any[];
}) {
  const [activeTab, setActiveTab] = useState<'customer' | 'history'>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  const { symbol } = useCurrency();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateFilter) {
      case 'today': return { start: today, end: new Date() };
      case 'week': { const s = new Date(today); s.setDate(today.getDate() - 7); return { start: s, end: new Date() }; }
      case 'month': { const s = new Date(today); s.setMonth(today.getMonth() - 1); return { start: s, end: new Date() }; }
      case 'specific':
        if (specificDate) {
          const d = new Date(specificDate);
          return { start: new Date(d.getFullYear(), d.getMonth(), d.getDate()), end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) };
        }
        return { start: null, end: null };
      case 'custom':
        return { start: customStartDate ? new Date(customStartDate) : null, end: customEndDate ? new Date(customEndDate) : null };
      default: return { start: null, end: null };
    }
  };

  const filteredInvoices = initialInvoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || inv.customer.name === customerFilter;
    const { start, end } = getDateRange();
    const matchesDate = !start || !end || (new Date(inv.invoiceDate) >= start && new Date(inv.invoiceDate) <= end);
    return matchesSearch && matchesDate && matchesCustomer;
  });

  const uniqueCustomers = Array.from(new Set(initialInvoices.map(inv => inv.customer.name)));

  const toggleItem = (item: InvoiceItem) => {
    const existing = returnItems.find(ri => ri.salesItemId === item.id);
    if (existing) {
      setReturnItems(returnItems.filter(ri => ri.salesItemId !== item.id));
    } else {
      setReturnItems([...returnItems, { salesItemId: item.id, productId: item.product.id, batchId: item.batch.id, quantity: item.quantity, salePrice: item.salePrice }]);
    }
  };

  const updateReturnQuantity = (salesItemId: number, qty: number) => {
    if (qty < 1) return;
    setReturnItems(returnItems.map(ri => ri.salesItemId === salesItemId ? { ...ri, quantity: qty } : ri));
  };

  const returnAmount = returnItems.reduce((sum, item) => sum + item.quantity * item.salePrice, 0);

  const handleSubmit = async () => {
    if (!selectedInvoice || returnItems.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createCustomerReturn({
        invoiceId: selectedInvoice.id,
        reason: returnReason,
        remarks: '',
        items: returnItems.map(ri => ({
          productId: ri.productId,
          batchId: ri.batchId,
          quantity: ri.quantity,
          returnPrice: ri.salePrice,
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedInvoice(null);
        setReturnItems([]);
        setReturnReason('');
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setReturnItems([]);
    setReturnReason('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-amber-600" /> Returns Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Process customer returns and view history</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
          <Link href="/returns/sales" className="px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400">
            Sales Returns
          </Link>
          <Link href="/returns/purchase" className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
            Purchase Returns
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'customer' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowRightLeft className="w-4 h-4 inline mr-2" /> Customer Returns (Sales)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <History className="w-4 h-4 inline mr-2" /> Return History ({returns.length})
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Return processed successfully! Stock restored.</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* CUSTOMER RETURNS TAB — invoice list */}
      {activeTab === 'customer' && !selectedInvoice && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Search Sales Invoice</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Invoice # or Customer..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                <option value="all">All Customers</option>
                {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="specific">Specific Day</option>
                <option value="custom">Custom Range</option>
              </select>
              {dateFilter === 'specific' && (
                <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              )}
              {dateFilter === 'custom' && (
                <>
                  <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                  <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </>
              )}
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No invoices found matching your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvoices.map(inv => (
                <button key={inv.id} onClick={() => selectInvoice(inv)} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:border-amber-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">{inv.invoiceNumber}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{symbol}{inv.netAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-slate-800 dark:text-white font-medium">{inv.customer.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{inv.items.length} items</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* CUSTOMER RETURNS TAB — item selection */}
      {activeTab === 'customer' && selectedInvoice && (
        <div className="space-y-4">
          <button onClick={() => setSelectedInvoice(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium">
            ← Back to list
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Invoice: {selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer: {selectedInvoice.customer.name} • Amount: {symbol}{selectedInvoice.netAmount.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setReturnItems(selectedInvoice.items.map(item => ({ salesItemId: item.id, productId: item.product.id, batchId: item.batch.id, quantity: item.quantity, salePrice: item.salePrice })))}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm"
              >
                Full Return
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 w-12">Select</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-center">Sold Qty</th>
                  <th className="px-4 py-3 text-center">Return Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Return Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {selectedInvoice.items.map(item => {
                  const isSelected = returnItems.some(ri => ri.salesItemId === item.id);
                  const selectedItem = returnItems.find(ri => ri.salesItemId === item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 ${isSelected ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)} className="w-4 h-4 rounded accent-amber-600" />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{item.product.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.batch.batchNumber}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {isSelected && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateReturnQuantity(item.id, (selectedItem?.quantity || 1) - 1)} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded font-bold">-</button>
                            <span className="w-8 text-center font-bold">{selectedItem?.quantity || 0}</span>
                            <button onClick={() => updateReturnQuantity(item.id, (selectedItem?.quantity || 0) + 1)} disabled={(selectedItem?.quantity || 0) >= item.quantity} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded font-bold disabled:opacity-40">+</button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{symbol}{item.salePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">{symbol}{((selectedItem?.quantity || 0) * item.salePrice).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Reason</label>
              <textarea
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                rows={3}
                placeholder="Enter reason for return..."
              />
            </div>
            <div className="flex flex-col items-end justify-end gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Return Total</p>
                <p className="text-3xl font-black text-amber-600">{symbol}{returnAmount.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">{returnItems.length} item(s) selected</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || returnItems.length === 0}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting
                  ? <><RotateCcw className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Process Return</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Return #</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Processed By</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No return history found</p>
                    </td>
                  </tr>
                ) : (
                  returns.map((ret: any) => (
                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-6 py-4 font-bold text-amber-600">#{ret.id}</td>
                      <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400">{ret.invoice?.invoiceNumber || '-'}</td>
                      <td className="px-6 py-4 font-medium">{ret.invoice?.customer?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(ret.returnDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold">{ret.items?.length || 0} items</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-600">{symbol}{ret.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500">{ret.processedByUser?.fullName || ret.processedByUser?.username || 'System'}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{ret.reason || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-bold">{ret.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
