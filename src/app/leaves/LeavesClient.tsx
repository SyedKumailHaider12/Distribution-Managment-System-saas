'use client';

import { useState } from 'react';
import { Calendar, Plus, Trash2, Search, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { requestLeave, deleteLeave } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
}

interface Leave {
  id: number;
  date: Date;
  notes: string | null;
  employee: { name: string; employeeCode: string };
}

export function LeavesClient({ employees, leaves }: { employees: Employee[]; leaves: Leave[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: 0,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const filteredLeaves = leaves.filter(
    (leave) =>
      leave.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      employeeId: employees[0]?.id || 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestLeave({
        employeeId: formData.employeeId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        reason: formData.reason,
      });
      setSuccess('Leave request submitted successfully');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this leave record?')) {
      try {
        await deleteLeave(id);
        window.location.reload();
      } catch (err) {
        alert('Failed to delete leave record');
      }
    }
  };

  // Group leaves by employee
  const leavesByEmployee = filteredLeaves.reduce((acc, leave) => {
    const key = leave.employee.employeeCode;
    if (!acc[key]) {
      acc[key] = {
        employee: leave.employee,
        leaves: [],
      };
    }
    acc[key].leaves.push(leave);
    return acc;
  }, {} as Record<string, { employee: { name: string; employeeCode: string }; leaves: Leave[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-none">
              <Calendar className="w-7 h-7" />
            </div>
            Leave Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Request and track employee leave applications
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-100 dark:shadow-none"
        >
          <Plus className="w-5 h-5" /> Request Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Leaves</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{leaves.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">This Month</p>
          <h3 className="text-3xl font-black text-purple-600 mt-1">
            {
              leaves.filter((l) => {
                const leaveDate = new Date(l.date);
                const now = new Date();
                return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
              }).length
            }
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Employees on Leave</p>
          <h3 className="text-3xl font-black text-pink-600 mt-1">{Object.keys(leavesByEmployee).length}</h3>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Leave Records */}
        <div className="p-6 space-y-6">
          {Object.keys(leavesByEmployee).length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-slate-400 dark:text-slate-500 font-medium">No leave records found</p>
            </div>
          ) : (
            Object.values(leavesByEmployee).map((group) => (
              <div
                key={group.employee.employeeCode}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {group.employee.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{group.employee.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {group.employee.employeeCode}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full">
                    {group.leaves.length} day(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {group.leaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {new Date(leave.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          {leave.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{leave.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Request Leave</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Employee Leave Application
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {success && (
                  <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" /> {success}
                  </div>
                )}
                {error && (
                  <div className="bg-red-500/10 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border border-red-500/20">
                    <AlertCircle className="w-5 h-5" /> {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Select Employee *
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                    rows={3}
                    placeholder="Reason for leave..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3.5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-100 dark:shadow-none flex items-center gap-3 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
