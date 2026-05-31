'use client';

import { useState } from 'react';
import { Search, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface Batch {
  id: number;
  batchNumber: string;
  expiryDate: Date | null;
  purchasePrice: number;
  product: {
    id: number;
    name: string;
    brand?: { name: string };
    category?: { name: string };
  };
  stocks: {
    id: number;
    quantity: number;
    warehouse: { name: string };
  }[];
}

export function BatchClient({ initialBatches }: { initialBatches: Batch[] }) {
  const [batches] = useState(initialBatches);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'expired' | 'expiring' | 'valid'>('all');

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
    const now = new Date();
    const isExpired = expiryDate && expiryDate < now;
    const isExpiringSoon = expiryDate && !isExpired && (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30;

    let matchesFilter = true;
    if (filter === 'expired') matchesFilter = isExpired;
    else if (filter === 'expiring') matchesFilter = isExpiringSoon;
    else if (filter === 'valid') matchesFilter = !isExpired && !isExpiringSoon;

    return matchesSearch && matchesFilter;
  });

  const getExpiryStatus = (expiryDate: Date | null) => {
    if (!expiryDate) return { color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'No Expiry', icon: null };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Expired', icon: AlertTriangle };
    if (daysLeft <= 30) return { color: 'text-amber-400', bg: 'bg-amber-500/20', label: `${daysLeft} days`, icon: AlertTriangle };
    return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: `${daysLeft} days`, icon: CheckCircle };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalQuantity = (batch: Batch) => batch.stocks.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Batch Management</h1>
          <p className="text-slate-400 mt-1">Track product batches and expiry dates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by product or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'expired', label: 'Expired' },
            { value: 'expiring', label: 'Expiring Soon' },
            { value: 'valid', label: 'Valid' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50">
        <table className="w-full">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Batch #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Expiry Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Stock Locations</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Total Qty</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 bg-slate-800/30">
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No batches found
                </td>
              </tr>
            ) : (
              filteredBatches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate);
                const Icon = status.icon;

                return (
                  <tr key={batch.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-indigo-400">{batch.batchNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{batch.product.name}</p>
                      <p className="text-xs text-slate-500">{batch.product.brand?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {batch.product.category?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(batch.expiryDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {batch.stocks.map((stock) => (
                          <span
                            key={stock.id}
                            className="px-2 py-0.5 bg-slate-700 text-xs text-slate-300 rounded"
                          >
                            {stock.warehouse.name}: {stock.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold">{totalQuantity(batch)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${status.bg} ${status.color}`}>
                        {Icon && <Icon size={12} className="inline mr-1" />}
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
  );
}