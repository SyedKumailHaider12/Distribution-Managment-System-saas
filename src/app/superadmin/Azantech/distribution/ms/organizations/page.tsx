'use client';

import { useState, useEffect } from 'react';
import { Building2, Search, Trash2, Edit, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Org = {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  subscriptionStatus: string;
  subscriptionFee: number | null;
  paymentStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  _count: { users: number; branches: number };
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit state
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingOrg, setDeletingOrg] = useState<number | null>(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/superadmin/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (org: Org) => {
    setEditingOrg(org);
    setEditForm({
      subscriptionStatus: org.subscriptionStatus,
      subscriptionFee: org.subscriptionFee || '',
      paymentStatus: org.paymentStatus,
      trialEndsAt: org.trialEndsAt ? org.trialEndsAt.substring(0, 16) : '',
      subscriptionEndsAt: org.subscriptionEndsAt ? org.subscriptionEndsAt.substring(0, 16) : '',
    });
  };

  const handleSave = async () => {
    if (!editingOrg) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/organizations/${editingOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingOrg(null);
        fetchOrgs();
      } else {
        alert('Failed to update organization');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingOrg(id);
    try {
      const res = await fetch(`/api/superadmin/organizations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchOrgs();
      } else {
        alert('Failed to delete organization');
      }
    } finally {
      setDeletingOrg(null);
    }
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Manage Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">Change status to ACTIVE and set 'Sub Ends At' to grant subscriptions.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-10 pl-10 pr-4 bg-[#111827] border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Organization</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status & Billing</th>
                <th className="px-6 py-4 font-medium">Metrics</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{org.name}</p>
                        <p className="text-xs text-slate-500">ID: {org.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{org.contactPerson || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{org.email || 'No email'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-1 ${
                      org.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      org.subscriptionStatus === 'TRIAL' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {org.subscriptionStatus}
                    </span>
                    <p className="text-xs text-slate-400">
                      Payment: <span className={org.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>{org.paymentStatus}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div title="Users">Users: <span className="text-white">{org._count.users}</span></div>
                      <div title="Branches">Branches: <span className="text-white">{org._count.branches}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(org)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit Subscription"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to hard delete ${org.name}? This cannot be undone.`)) {
                            handleDelete(org.id);
                          }
                        }}
                        disabled={deletingOrg === org.id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Organization"
                      >
                        {deletingOrg === org.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingOrg(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0B1220] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Edit Subscription: {editingOrg.name}</h3>
                <button onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Subscription Status</label>
                  <select
                    value={editForm.subscriptionStatus}
                    onChange={(e) => setEditForm({...editForm, subscriptionStatus: e.target.value})}
                    className="w-full h-10 bg-[#111827] border border-white/5 rounded-lg px-3 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TRIAL">TRIAL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Payment Status</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value})}
                    className="w-full h-10 bg-[#111827] border border-white/5 rounded-lg px-3 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Monthly Fee Amount</label>
                  <input
                    type="number"
                    value={editForm.subscriptionFee}
                    onChange={(e) => setEditForm({...editForm, subscriptionFee: e.target.value})}
                    className="w-full h-10 bg-[#111827] border border-white/5 rounded-lg px-3 text-white focus:outline-none focus:border-red-500"
                    placeholder="e.g. 99.99"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Trial Ends At</label>
                    <input
                      type="datetime-local"
                      value={editForm.trialEndsAt}
                      onChange={(e) => setEditForm({...editForm, trialEndsAt: e.target.value})}
                      className="w-full h-10 bg-[#111827] border border-white/5 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-red-500 [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Sub Ends At</label>
                    <input
                      type="datetime-local"
                      value={editForm.subscriptionEndsAt}
                      onChange={(e) => setEditForm({...editForm, subscriptionEndsAt: e.target.value})}
                      className="w-full h-10 bg-[#111827] border border-white/5 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-red-500 [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
