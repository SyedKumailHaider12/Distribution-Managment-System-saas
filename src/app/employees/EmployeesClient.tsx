'use client';

import { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Key, ToggleLeft, ToggleRight, X, Shield, User as UserIcon, UserCog, Phone, DollarSign, Briefcase, Mail, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
  role: string;
  phone: string | null;
  baseSalary: number;
  isActive: boolean;
  branchId: number;
  branch: { name: string };
  user: { username: string; isActive: boolean } | null;
}

export function EmployeesClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const { symbol } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', 
    employeeCode: '', 
    role: 'Cashier', 
    phone: '', 
    baseSalary: 0, 
    username: '', 
    password: '',
    branchId: 1,
    organizationId: 1 // Default organization
  });

  const filteredEmployees = employees.filter(emp =>
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

  const openModal = (employee?: Employee) => {
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
        username: employee.user?.username || '', 
        password: '',
        branchId: employee.branchId
      });
    } else {
      setEditingEmployee(null);
      setFormData({ 
        name: '', 
        employeeCode: `EMP-${Date.now().toString().slice(-4)}`, 
        role: 'Cashier', 
        phone: '', 
        baseSalary: 0, 
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
          baseSalary: formData.baseSalary
        });
        setSuccess('Employee updated successfully');
      } else {
        await createEmployee({
          ...formData,
          branchId: parseInt(formData.branchId.toString()),
          organizationId: parseInt(formData.organizationId.toString())
        });
        setSuccess('Employee and user account created');
      }
      
      // Refresh list (ideally fetch again)
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
        setEmployees(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-200 dark:shadow-none">
              <Users className="w-7 h-7" />
            </div>
            Staff & HR Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Register employees, open user accounts, and manage roles</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-pink-100 dark:shadow-none"
        >
          <Plus className="w-5 h-5" /> Add New Employee
        </button>
      </div>

      {/* Stats/Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Staff</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{employees.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Accounts</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">{employees.filter(e => e.user?.isActive).length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Monthly Payroll</p>
          <h3 className="text-3xl font-black text-indigo-600 mt-1">{symbol} {employees.reduce((sum, e) => sum + e.baseSalary, 0).toLocaleString()}</h3>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, code or role..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Contact & Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Base Salary</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white group-hover:text-pink-600 transition-colors">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                          <Phone className="w-3.5 h-3.5" /> {emp.phone || 'No phone'}
                        </div>
                        {getRoleBadge(emp.role)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {emp.user ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <Shield className="w-3.5 h-3.5" /> @{emp.user.username}
                          </div>
                          <span className="text-[10px] text-slate-400">Account Linked</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-tight">No Login</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-base">
                      {symbol} {emp.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(emp)} 
                          className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-xl transition-all"
                          title="Edit Profile"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)} 
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="Terminate"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{editingEmployee ? 'Update Staff Member' : 'Register New Staff'}</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">HR & Account Management</p>
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
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500/20" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Employee Code *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500/20" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500/20">
                      <option value="Admin">Administrator</option>
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier / POS Operator</option>
                      <option value="Salesman">Field Salesman</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Base Salary (Monthly)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500/20" />
                    </div>
                  </div>
                </div>

                {/* Hidden field for branchId to ensure it's passed */}
                <input type="hidden" value={formData.branchId} />

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
                  <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-pink-100 dark:shadow-none flex items-center gap-3 disabled:opacity-50">
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