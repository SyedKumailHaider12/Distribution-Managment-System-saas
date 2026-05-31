'use client';

import { useState } from 'react';
import { RotateCcw, Plus, Search, X, CheckCircle2, Package } from 'lucide-react';
import { createCustomerReturn } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';

export function CustomerReturnsClient({ invoices, returns }: any) {
  const { symbol } = useCurrency();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date() };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: new Date() };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: new Date() };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate) : null,
        };
      default:
        return { start: null, end: null };
    }
  };

  const filteredReturns = returns.filter((ret: any) => {
    const matchesSearch = ret.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const { start, end } = getDateRange();
    const returnDate = new Date(ret.returnDate);
    const matchesDate = !start || !end || (returnDate >= start && returnDate <= end);
    
    const matchesType = invoiceTypeFilter === 'all' || ret.invoice.saleType === invoiceTypeFilter;
    
    return matchesSearch && matchesDate && matchesType;
  });

  const handleInvoiceSelect = (invoice: any) => {
    setSelectedInvoice(invoice);
    setReturnItems(invoice.items.map((item: any) => ({
      ...item,
      returnQty: 0,
      selected: false,
    })));
  };

  const toggleItem = (index: number) => {
    setReturnItems(returnItems.map((item, i) => 
      i === index ? { ...item, selected: !item.selected, returnQty: !item.selected ? item.quantity : 0 } : item
    ));
  };

  const updateReturnQty = (index: number, qty: number) => {
    setReturnItems(returnItems.map((item, i) => 
      i === index ? { ...item, returnQty: Math.min(qty, item.quantity) } : item
    ));
  };

  const calculateTotal = () => {
    return returnItems
      .filter(item => item.selected && item.returnQty > 0)
      .reduce((sum, item) => sum + (item.returnQty * item.salePrice), 0);
  };

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(item => item.selected && item.returnQty > 0);
    
    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomerReturn({
        invoiceId: selectedInvoice.id,
        reason,
        remarks,
        items: itemsToReturn.map((item: any) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.returnQty,
          returnPrice: item.salePrice,
        })),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setViewMode('list');
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-blue-600" /> Process Customer Return
          </h1>
          <button onClick={() => setViewMode('list')} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            ← Back
          </button>
        </div>

        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Return processed successfully! Stock updated.</p>
          </motion.div>
        )}

        {!selectedInvoice ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Select Invoice to Return</h2>
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <div key={inv.id} onClick={() => handleInvoiceSelect(inv)} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{inv.invoiceNumber}</p>
                      <p className="text-sm text-slate-500">{inv.customer.name} • {new Date(inv.invoiceDate).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white">{symbol}{inv.netAmount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-lg mb-4">Invoice: {selectedInvoice.invoiceNumber}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{selectedInvoice.customer.name}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-lg mb-4">Select Items to Return</h3>
              <div className="space-y-2">
                {returnItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input type="checkbox" checked={item.selected} onChange={() => toggleItem(index)} className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-slate-500">Batch: {item.batch.batchNumber} • Sold: {item.quantity}</p>
                    </div>
                    {item.selected && (
                      <input type="number" min="1" max={item.quantity} value={item.returnQty} onChange={(e) => updateReturnQty(index, parseInt(e.target.value))} className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    )}
                    <p className="font-bold w-24 text-right">{symbol}{item.salePrice.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <option value="">Select reason</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Customer Request">Customer Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Remarks</label>
                  <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Return Total</p>
                  <p className="text-3xl font-black text-blue-600">{symbol}{calculateTotal().toFixed(2)}</p>
                </div>
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <RotateCcw className="w-8 h-8 text-blue-600" /> Customer Returns
        </h1>
        <button onClick={() => setViewMode('form')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Return
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by invoice or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <select value={invoiceTypeFilter} onChange={(e) => setInvoiceTypeFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="all">All Types</option>
              <option value="retail">Retail</option>
              <option value="distribution">Distribution</option>
            </select>
          </div>
        </div>
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Return Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Invoice</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Reason</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No returns found</p>
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret: any) => (
                <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="px-6 py-4">{new Date(ret.returnDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">{ret.invoice.invoiceNumber}</td>
                  <td className="px-6 py-4">{ret.invoice.customer.name}</td>
                  <td className="px-6 py-4">{ret.reason || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold">{symbol}{ret.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                      {ret.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
