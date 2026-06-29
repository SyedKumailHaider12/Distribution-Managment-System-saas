'use client';

import { useState } from 'react';
import { Search, Filter, AlertTriangle, Package, Warehouse, RotateCcw, ArrowRightLeft, Sliders, X } from 'lucide-react';

interface Stock {
  id: number;
  quantity: number;
  product: { id: number; name: string; reorderLevel: number; category?: { name: string } | null };
  batch: { id: number; batchNumber: string; expiryDate: Date | null };
  warehouse: { id: number; name: string };
}

interface Warehouse { id: number; name: string }
interface Category { id: number; name: string }

export function StockClient({
  initialStocks,
  warehouses,
  categories,
  lowStockCount = 0,
  outOfStockCount = 0,
  expiringCount = 0
}: {
  initialStocks: Stock[];
  warehouses: Warehouse[];
  categories: Category[];
  lowStockCount?: number;
  outOfStockCount?: number;
  expiringCount?: number;
}) {
  const [stocks] = useState(initialStocks);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  const getStockStatus = (qty: number, reorderLevel: number) => {
    if (qty === 0) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Out of Stock' };
    if (qty < reorderLevel) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Low Stock' };
    return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'In Stock' };
  };

  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false;
    const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft > 0;
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesWarehouse = !selectedWarehouse || stock.warehouse.id.toString() === selectedWarehouse;
    const matchesCategory = !selectedCategory || stock.product.category?.name === selectedCategory;
    const matchesSearch = !searchTerm || stock.product.name.toLowerCase().includes(searchTerm.toLowerCase()) || stock.batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStockStatus(stock.quantity, stock.product.reorderLevel);
    const matchesStatus = !statusFilter || (statusFilter === 'out' && stock.quantity === 0) || (statusFilter === 'low' && stock.quantity < stock.product.reorderLevel && stock.quantity > 0) || (statusFilter === 'in' && stock.quantity >= stock.product.reorderLevel);
    return matchesWarehouse && matchesCategory && matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedWarehouse('');
    setSelectedCategory('');
    setStatusFilter('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" /> Stock Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor inventory levels and batch information</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransferDialog(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium rounded-lg transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
          </button>
          <button onClick={() => setShowAdjustDialog(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium rounded-lg transition-colors">
            <Sliders className="w-4 h-4" /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{lowStockCount}</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{outOfStockCount}</p>
              <p className="text-sm text-red-600 dark:text-red-500">Out of Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{expiringCount}</p>
              <p className="text-sm text-orange-600 dark:text-orange-500">Expiring Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search product, batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Clear Filters</button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No stock records found</p>
                  </td>
                </tr>
              ) : (
                filteredStocks.map(stock => {
                  const status = getStockStatus(stock.quantity, stock.product.reorderLevel);
                  const expiring = isExpiringSoon(stock.batch.expiryDate);
                  const expired = isExpired(stock.batch.expiryDate);
                  return (
                    <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{stock.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{stock.product.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{stock.product.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{stock.warehouse.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{stock.batch.batchNumber}</td>
                      <td className={`px-6 py-4 ${expired ? 'text-red-600 dark:text-red-400 font-medium' : expiring ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {formatDate(stock.batch.expiryDate)}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${status.color}`}>{stock.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Transfer Stock</h2>
              <button onClick={() => setShowTransferDialog(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Product</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select Product</option></select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From Warehouse</label><select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To Warehouse</label><select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quantity</label><input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" /></div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowTransferDialog(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Dialog */}
      {showAdjustDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Adjust Stock</h2>
              <button onClick={() => setShowAdjustDialog(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Product</label><select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Warehouse</label><select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Adjustment Type</label><select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Add</option><option>Remove</option><option>Set</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quantity</label><input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason</label><textarea className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2}></textarea></div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAdjustDialog(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Adjust</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}