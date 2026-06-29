'use client';

import { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Shield, User as UserIcon, Phone, Briefcase, CheckCircle2, AlertCircle, Save, RotateCcw, Calendar, DollarSign, Clock, FileText, Check, X } from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee, markAttendance, generateSalarySlip, markSalaryPaid } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';

export function EmployeesClient({ 
  initialEmployees, 
  availableRoles = [],
  initialAttendances = [],
  initialSalarySlips = [],
  hasAccess = true
}: any) {
  const { symbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ATTENDANCE' | 'PAYROLL'>('DIRECTORY');
  
  // Data State
  const [employees, setEmployees] = useState(initialEmployees);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [salarySlips, setSalarySlips] = useState(initialSalarySlips);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultRole = availableRoles.length > 0 ? availableRoles[0].name : 'Cashier';

  // Form State
  const [formData, setFormData] = useState({
    name: '', 
    employeeCode: '', 
    role: defaultRole, 
    phone: '', 
    baseSalary: 0, 
    joinDate: new Date().toISOString().split('T')[0],
    username: '', 
    password: '',
    branchId: 1
  });

  const filteredEmployees = employees.filter((emp: any) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roles: Record<string, string> = {
      'Admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Manager': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'Salesman': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'Cashier': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    };
    const style = roles[role] || roles['Cashier'];
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>{role}</span>;
  };

  // --- EMPLOYEE MODAL LOGIC ---
  const openModal = (employee?: any) => {
    setError(null);
    setSuccess(null);
    if (employee) {
      setEditingEmployee(employee);
      setFormData({ 
        name: employee.name, 
        employeeCode: employee.employeeCode, 
        role: employee.role, 
        phone: employee.phone || '', 
        baseSalary: employee.baseSalary,
        joinDate: new Date(employee.joinDate).toISOString().split('T')[0],
        username: employee.user?.username || '', 
        password: '',
        branchId: employee.branchId
      });
    } else {
      setEditingEmployee(null);
      setFormData({ 
        name: '', 
        employeeCode: `EMP-${Date.now().toString().slice(-4)}`, 
        role: defaultRole, 
        phone: '', 
        baseSalary: 0, 
        joinDate: new Date().toISOString().split('T')[0],
        username: '', 
        password: '',
        branchId: 1
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          baseSalary: formData.baseSalary,
          joinDate: new Date(formData.joinDate)
        });
        setSuccess('Employee updated successfully');
      } else {
        await createEmployee({
          name: formData.name,
          employeeCode: formData.employeeCode,
          role: formData.role,
          phone: formData.phone,
          baseSalary: formData.baseSalary,
          joinDate: new Date(formData.joinDate),
          branchId: formData.branchId,
          username: formData.username,
          password: formData.password
        });
        setSuccess('Employee and user account created');
      }
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure? This will delete the employee and their linked user account.')) {
      try {
        await deleteEmployee(id);
        setEmployees((prev: any) => prev.filter((e: any) => e.id !== id));
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  // --- ATTENDANCE LOGIC ---
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleMarkAttendance = async (employeeId: number, status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE') => {
    try {
      const att = await markAttendance({
        employeeId,
        date: new Date(attDate),
        status,
        notes: ''
      });
      setAttendances((prev: any) => {
        const filtered = prev.filter((a: any) => !(a.employeeId === employeeId && new Date(a.date).toDateString() === new Date(attDate).toDateString()));
        return [att, ...filtered];
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getAttendanceForDate = (empId: number, dateStr: string) => {
    return attendances.find((a: any) => a.employeeId === empId && new Date(a.date).toDateString() === new Date(dateStr).toDateString());
  };

  // --- PAYROLL LOGIC ---
  const [payMonth, setPayMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleGenerateSlip = async (emp: any) => {
    try {
      // Basic auto-calculation based on attendance
      // Standard rule: (Base / 30) * Absent Days
      const currentMonthAtts = attendances.filter((a: any) => 
        a.employeeId === emp.id && 
        new Date(a.date).toISOString().startsWith(payMonth)
      );

      const absents = currentMonthAtts.filter((a: any) => a.status === 'ABSENT').length;
      const halfDays = currentMonthAtts.filter((a: any) => a.status === 'HALF_DAY').length;
      
      const totalAbsentPenaltyDays = absents + (halfDays * 0.5);
      const dailyRate = emp.baseSalary / 30;
      const deductions = Math.round(totalAbsentPenaltyDays * dailyRate);

      const slip = await generateSalarySlip({
        employeeId: emp.id,
        month: payMonth,
        deductions,
        bonuses: 0 // Overtime or bonus can be manually adjusted later
      });

      setSalarySlips((prev: any) => {
        const filtered = prev.filter((s: any) => !(s.employeeId === emp.id && s.month === payMonth));
        return [slip, ...filtered];
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkPaid = async (slipId: number) => {
    if(confirm('Confirm salary payment?')) {
      try {
        const updated = await markSalaryPaid(slipId);
        setSalarySlips((prev: any) => prev.map((s: any) => s.id === slipId ? updated : s));
      } catch(err: any) {
        alert(err.message);
      }
    }
  };

  const getSlipForMonth = (empId: number, month: string) => {
    return salarySlips.find((s: any) => s.employeeId === empId && s.month === month);
  };


  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-200 dark:shadow-none">
              <Users className="w-7 h-7" />
            </div>
            HR Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage employees, attendance, and payroll</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('DIRECTORY')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'DIRECTORY' ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Directory
          </button>
          <button 
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'ATTENDANCE' ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Attendance
          </button>
          <button 
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'PAYROLL' ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Payroll
          </button>
        </div>
      </div>

      {/* --- TAB 1: DIRECTORY --- */}
      {activeTab === 'DIRECTORY' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20" 
              />
            </div>
            <button onClick={() => openModal()} disabled={!hasAccess} className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all shadow-xl shadow-pink-100 dark:shadow-none ${!hasAccess ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white'}`}>
              <Plus className="w-5 h-5" /> Add Staff
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contact & Role</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Base Salary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredEmployees.length === 0 && !hasAccess && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-bold">Access Restricted</p>
                      <p className="text-xs">You do not have permission to view this data.</p>
                    </td>
                  </tr>
                )}
                {filteredEmployees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium text-xs">
                          <Phone className="w-3.5 h-3.5" /> {emp.phone || 'No phone'}
                        </div>
                        {getRoleBadge(emp.role)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                          <Calendar className="w-3.5 h-3.5" /> Joined {new Date(emp.joinDate).toLocaleDateString()}
                        </div>
                        {emp.user && (
                          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                            <Shield className="w-3 h-3" /> Account Active
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                      {symbol} {emp.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(emp)} disabled={!hasAccess} className={`p-2 ${!hasAccess ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-pink-600'}`}>
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} disabled={!hasAccess} className={`p-2 ml-2 ${!hasAccess ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600'}`}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- TAB 2: ATTENDANCE --- */}
      {activeTab === 'ATTENDANCE' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="font-bold text-slate-700 dark:text-slate-300">Mark Attendance For:</div>
            <input 
              type="date" 
              value={attDate} 
              onChange={e => setAttDate(e.target.value)} 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp: any) => {
              const currentAtt = getAttendanceForDate(emp.id, attDate);
              return (
                <div key={emp.id} className={`p-5 rounded-3xl border ${currentAtt ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{emp.role}</p>
                    </div>
                    {currentAtt && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                        currentAtt.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                        currentAtt.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                        currentAtt.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {currentAtt.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={!hasAccess} onClick={() => handleMarkAttendance(emp.id, 'PRESENT')} className={`py-2 text-xs font-bold rounded-xl transition-all ${currentAtt?.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200'} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}>Present</button>
                    <button disabled={!hasAccess} onClick={() => handleMarkAttendance(emp.id, 'ABSENT')} className={`py-2 text-xs font-bold rounded-xl transition-all ${currentAtt?.status === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200'} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}>Absent</button>
                    <button disabled={!hasAccess} onClick={() => handleMarkAttendance(emp.id, 'HALF_DAY')} className={`py-2 text-xs font-bold rounded-xl transition-all ${currentAtt?.status === 'HALF_DAY' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200'} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}>Half Day</button>
                    <button disabled={!hasAccess} onClick={() => handleMarkAttendance(emp.id, 'LEAVE')} className={`py-2 text-xs font-bold rounded-xl transition-all ${currentAtt?.status === 'LEAVE' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200'} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}>Leave</button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* --- TAB 3: PAYROLL --- */}
      {activeTab === 'PAYROLL' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="font-bold text-slate-700 dark:text-slate-300">Payroll Month:</div>
            <input 
              type="month" 
              value={payMonth} 
              onChange={e => setPayMonth(e.target.value)} 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4 text-right">Base Salary</th>
                  <th className="px-6 py-4 text-center">Status (This Month)</th>
                  <th className="px-6 py-4 text-right">Net Salary</th>
                  <th className="px-6 py-4 text-center">Payment Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {employees.map((emp: any) => {
                  const slip = getSlipForMonth(emp.id, payMonth);
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{emp.role}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">
                        {symbol} {emp.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {slip ? (
                          <div className="text-xs text-red-500 font-medium">-{symbol} {slip.deductions.toLocaleString()} (Deductions)</div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not generated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-indigo-600 text-base">
                        {slip ? `${symbol} ${slip.netSalary.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {slip?.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                        ) : slip?.status === 'UNPAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!slip ? (
                          <button disabled={!hasAccess} onClick={() => handleGenerateSlip(emp)} className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors ${!hasAccess ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                            Generate
                          </button>
                        ) : slip.status === 'UNPAID' ? (
                          <button disabled={!hasAccess} onClick={() => handleMarkPaid(slip.id)} className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 ${!hasAccess ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            <Check className="w-3 h-3" /> Pay Now
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">{new Date(slip.paidDate).toLocaleDateString()}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- ADD/EDIT EMPLOYEE MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{editingEmployee ? 'Update Staff Member' : 'Register New Staff'}</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-colors shadow-sm"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {success && <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border border-emerald-500/20"><CheckCircle2 className="w-5 h-5" /> {success}</div>}
                {error && <div className="bg-red-500/10 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border border-red-500/20"><AlertCircle className="w-5 h-5" /> {error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Employee Code *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold">
                      {availableRoles.map((role: any) => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Base Salary (Monthly)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm">{symbol}</span>
                      <input type="number" value={formData.baseSalary || ''} onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Joining</label>
                    <div className="relative">
                      <input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>
                </div>

                {!editingEmployee && (
                  <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-pink-600" />
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Open App Login Account</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" placeholder="staff.login" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Password</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3.5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl transition-all flex items-center gap-3 disabled:opacity-50">
                    {isSubmitting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingEmployee ? 'Save Changes' : 'Confirm Registration'}
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