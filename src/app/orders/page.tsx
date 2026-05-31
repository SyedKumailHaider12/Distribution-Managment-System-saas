'use client';

import { useState } from 'react';
import { Package, Plus, RefreshCw, Truck, X, Search, Eye, CheckCircle, Clock, Box, Send } from 'lucide-react';

const STATUSES = ['All', 'Booked', 'Packing', 'Dispatched', 'Delivered'];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    if (status === 'Booked') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Booked</span>;
    if (status === 'Packing') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Packing</span>;
    if (status === 'Dispatched') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Dispatched</span>;
    if (status === 'Delivered') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Delivered</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600">{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-cyan-600" /> Delivery Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Order booking and delivery tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewDialog(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Delivery
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUSES.map(status => (
          <button key={status} onClick={() => setActiveTab(status)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === status ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
            {status}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button onClick={() => setShowStatusDialog(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Truck className="w-4 h-4" /> Update Status
        </button>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Eye className="w-4 h-4" /> View Details
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Salesman</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Delivery Date</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No deliveries found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Delivery</h2>
              <button onClick={() => setShowNewDialog(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sales Invoice #</label>
                <input type="text" placeholder="Enter invoice number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Salesman</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"><option>Select Salesman</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                <textarea className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={3} placeholder="Delivery notes..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowNewDialog(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2"><Send className="w-4 h-4" /> Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Update Status</h2>
              <button onClick={() => setShowStatusDialog(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              {['Booked', 'Packing', 'Dispatched', 'Delivered'].map(status => (
                <button key={status} className="w-full px-4 py-3 text-left rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-slate-700 dark:text-slate-200 transition-colors">
                  {status}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowStatusDialog(false)} className="px-4 py-2.5 text-slate-600">Cancel</button>
              <button className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}