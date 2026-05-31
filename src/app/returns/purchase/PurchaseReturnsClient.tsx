'use client';

import { useState } from 'react';
import { Search, RotateCcw, Package } from 'lucide-react';
import { createPurchaseReturn } from '../actions';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvoiceItem {
  id: number;
  quantity: number;
  bonus: number;
  purchasePrice: number;
  product: {
    id: number;
    name: string;
  };
  batch: {
    id: number;
    batchNumber: string;
  };
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  netAmount: number;
  supplier: {
    name: string;
  };
  items: InvoiceItem[];
}

interface ReturnItem {
  purchaseItemId: number;
  productId: number;
  batchId: number;
  quantity: number;
  purchasePrice: number;
}

export function PurchaseReturnsClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const { symbol } = useCurrency();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (item: InvoiceItem) => {
    const existing = returnItems.find((ri) => ri.purchaseItemId === item.id);
    if (existing) {
      setReturnItems(returnItems.filter((ri) => ri.purchaseItemId !== item.id));
    } else {
      setReturnItems([
        ...returnItems,
        {
          purchaseItemId: item.id,
          productId: item.product.id,
          batchId: item.batch.id,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        },
      ]);
    }
  };

  const updateReturnQuantity = (purchaseItemId: number, qty: number) => {
    if (qty < 1) return;
    setReturnItems(
      returnItems.map((ri) => (ri.purchaseItemId === purchaseItemId ? { ...ri, quantity: qty } : ri))
    );
  };

  const returnAmount = returnItems.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);

  const handleSubmit = async () => {
    if (!selectedInvoice || returnItems.length === 0) {
      alert('Please select items to return');
      return;
    }

    setLoading(true);
    try {
      await createPurchaseReturn({
        purchaseInvoiceId: selectedInvoice.id,
        items: returnItems,
        returnReason,
      });
      alert('Return processed successfully');
      setSelectedInvoice(null);
      setReturnItems([]);
      setReturnReason('');
    } catch (error: any) {
      alert(error.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Purchase Returns</h1>
        <p className="text-slate-400 mt-1">Process returns for purchase invoices</p>
      </div>

      {!selectedInvoice ? (
        <>
          {/* Invoice Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices by number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400"
            />
          </div>

          {/* Invoice List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-indigo-400">{invoice.invoiceNumber}</span>
                  <span className="text-emerald-400 font-medium">{symbol}{invoice.netAmount.toFixed(2)}</span>
                </div>
                <p className="text-white font-medium">{invoice.supplier.name}</p>
                <p className="text-xs text-slate-400">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 mt-2">{invoice.items.length} items</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Selected Invoice Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setReturnItems([]);
                }}
                className="text-slate-400 hover:text-white mb-2"
              >
                ← Back to list
              </button>
              <h2 className="text-xl font-bold text-white">
                Invoice: {selectedInvoice.invoiceNumber}
              </h2>
              <p className="text-slate-400">
                Supplier: {selectedInvoice.supplier.name} • Amount: {symbol}{selectedInvoice.netAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Items to Return */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Batch</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Received Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Return Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {selectedInvoice.items.map((item) => {
                  const isSelected = returnItems.some((ri) => ri.purchaseItemId === item.id);
                  const selectedItem = returnItems.find((ri) => ri.purchaseItemId === item.id);
                  const totalQty = item.quantity + item.bonus;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          className="w-4 h-4 rounded border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-white">{item.product.name}</td>
                      <td className="px-4 py-3 text-slate-400">{item.batch.batchNumber}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{totalQty}</td>
                      <td className="px-4 py-3">
                        {isSelected && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                updateReturnQuantity(item.id, (selectedItem?.quantity || 1) - 1)
                              }
                              className="w-6 h-6 bg-slate-700 rounded text-white"
                            >
                              -
                            </button>
                            <span className="w-6 text-center">{selectedItem?.quantity || 0}</span>
                            <button
                              onClick={() =>
                                updateReturnQuantity(item.id, (selectedItem?.quantity || 0) + 1)
                              }
                              disabled={selectedItem && selectedItem.quantity >= totalQty}
                              className="w-6 h-6 bg-slate-700 rounded text-white disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-white">{symbol}{item.purchasePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {symbol}{((selectedItem?.quantity || 0) * item.purchasePrice).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Return Details */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Return Reason</label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400"
              rows={3}
              placeholder="Enter reason for return..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400">Return Amount</p>
              <p className="text-2xl font-bold text-emerald-400">{symbol}{returnAmount.toFixed(2)}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || returnItems.length === 0}
              className="py-3 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Process Return'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}