'use client';

import { useState } from 'react';
import { Search, RotateCcw, Package, ArrowRightLeft, History, X } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

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

export function SalesReturnsClient({ initialInvoices, purchaseInvoices = [] }: { initialInvoices: Invoice[]; purchaseInvoices?: any[] }) {
  const [activeTab, setActiveTab] = useState<'customer' | 'company' | 'history'>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  const { symbol } = useCurrency();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredInvoices = initialInvoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedInvoice(null);
        setReturnItems([]);
        setReturnReason('');
      }, 2000);
    }, 1500);
  };

  const selectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setReturnItems([]);
    setReturnReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-amber-600" /> Returns Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Process customer and company returns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('customer')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'customer' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <ArrowRightLeft className="w-4 h-4 inline mr-2" /> Customer Returns (Sales)
        </button>
        <button onClick={() => setActiveTab('company')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'company' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Package className="w-4 h-4 inline mr-2" /> Company Returns (Purchase)
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <History className="w-4 h-4 inline mr-2" /> Return History
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <RotateCcw className="w-5 h-5" />
          <p className="font-medium">Return processed successfully!</p>
        </div>
      )}

      {/* ===== CUSTOMER RETURNS TAB ===== */}
      {activeTab === 'customer' && !selectedInvoice && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Search Sales Invoice</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search Invoice #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
          </div>
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
        </>
      )}

      {activeTab === 'customer' && selectedInvoice && (
        <div className="space-y-4">
          <button onClick={() => setSelectedInvoice(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Back to list</button>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Invoice: {selectedInvoice.invoiceNumber}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Customer: {selectedInvoice.customer.name} • Amount: {symbol}{selectedInvoice.netAmount.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 w-12">Select</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Return Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {selectedInvoice.items.map(item => {
                  const isSelected = returnItems.some(ri => ri.salesItemId === item.id);
                  const selectedItem = returnItems.find(ri => ri.salesItemId === item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)} className="w-4 h-4 rounded text-amber-600" /></td>
                      <td className="px-4 py-3 text-slate-800 dark:text-white">{item.product.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.batch.batchNumber}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {isSelected && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateReturnQuantity(item.id, (selectedItem?.quantity || 1) - 1)} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-200">-</button>
                            <span className="w-6 text-center">{selectedItem?.quantity || 0}</span>
                            <button onClick={() => updateReturnQuantity(item.id, (selectedItem?.quantity || 0) + 1)} disabled={selectedItem && selectedItem.quantity >= item.quantity} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-200 disabled:opacity-50">+</button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-800 dark:text-white">{symbol}{item.salePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">{symbol}{((selectedItem?.quantity || 0) * item.salePrice).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Remarks</label>
              <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={3} placeholder="Enter reason for return..." />
            </div>
            <div className="flex flex-col items-end justify-end">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Return Total</p>
              <p className="text-3xl font-bold text-amber-600">{symbol}{returnAmount.toFixed(2)}</p>
              <button onClick={handleSubmit} disabled={isSubmitting || returnItems.length === 0} className="mt-4 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                {isSubmitting ? 'Processing...' : 'Process Customer Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMPANY RETURNS TAB ===== */}
      {activeTab === 'company' && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Search Purchase Invoice</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search Invoice #..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select a purchase invoice to process company return</p>
          </div>
        </>
      )}

      {/* ===== RETURN HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Return #</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer/Supplier</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Processed By</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No return history found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}