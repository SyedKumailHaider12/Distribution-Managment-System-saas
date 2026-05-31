'use client';

import { useState } from 'react';
import { Plus, Search, DollarSign, Calendar, Check, X, CreditCard, User, Briefcase, TrendingUp, TrendingDown, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { generateSalarySlip } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
  baseSalary: number;
}

interface SalarySlip {
  id: number;
  month: string;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  status: string;
  paidDate: Date | null;
  employee: { name: string; employeeCode: string };
}

export function PayrollClient({
  initialEmployees,
  initialSlips,
}: {
  initialEmployees: Employee[];
  initialSlips: SalarySlip[];
}) {
  const [employees] = useState(initialEmployees);
  const [slips] = useState(initialSlips);
  const { symbol } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredSlips = slips.filter((slip) => slip.month === selectedMonth);

  const totalPayroll = filteredSlips.reduce((sum, slip) => sum + slip.netSalary, 0);
  const totalDeductions = filteredSlips.reduce((sum, slip) => sum + slip.deductions, 0);
  const totalBonuses = filteredSlips.reduce((sum, slip) => sum + slip.bonuses, 0);

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      await generateSalarySlip({
        employeeId: selectedEmployee,
        month: selectedMonth,
        deductions,
        bonuses,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      alert(error.message || 'Failed to generate salary slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <DollarSign className="w-7 h-7" />
            </div>
            Payroll & Salaries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Generate salary slips and track monthly disbursements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={20} />
          Issue Salary Slip
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 w-fit shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Calendar size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Payroll Month:</span>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Slips Issued</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{filteredSlips.length}</h3>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Base Total</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">
            {symbol} {filteredSlips.reduce((sum, s) => sum + s.baseSalary, 0).toLocaleString()}
          </h3>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Total Deductions</p>
          <h3 className="text-3xl font-black text-red-500">-{symbol} {totalDeductions.toLocaleString()}</h3>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm ring-2 ring-emerald-500/20">
          <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Net Disbursements</p>
          <h3 className="text-3xl font-black text-emerald-600">{symbol} {totalPayroll.toLocaleString()}</h3>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4 text-right">Base Salary</th>
                <th className="px-6 py-4 text-right text-red-400">Deductions</th>
                <th className="px-6 py-4 text-right text-emerald-400">Bonuses</th>
                <th className="px-6 py-4 text-right">Net Payable</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    No salary slips found for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold">
                          {slip.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{slip.employee.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{slip.employee.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">{symbol} {slip.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-red-500 font-bold">-{symbol} {slip.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-emerald-500 font-bold">+{symbol} {slip.bonuses.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-base">
                      {symbol} {slip.netSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          slip.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {slip.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Issue Salary Slip</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Payroll Processing</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-colors shadow-sm"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <div className="p-8 space-y-6">
                {success && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" /> Salary Slip Generated Successfully
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Employee *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={selectedEmployee || ''}
                        onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                      >
                        <option value="">Choose Staff...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({symbol} {emp.baseSalary.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-red-400 uppercase tracking-widest ml-1">Deductions</label>
                      <div className="relative">
                        <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                        <input
                          type="number"
                          value={deductions}
                          onChange={(e) => setDeductions(Number(e.target.value))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest ml-1">Bonuses</label>
                      <div className="relative">
                        <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                        <input
                          type="number"
                          value={bonuses}
                          onChange={(e) => setBonuses(Number(e.target.value))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => setShowModal(false)} className="px-8 py-3.5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedEmployee}
                    className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {loading ? 'Processing...' : 'Confirm & Issue'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}