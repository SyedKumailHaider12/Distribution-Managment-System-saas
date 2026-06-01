'use client'

import { useState } from 'react'
import { UserCheck, Plus, Trash2, Phone, MapPin, Target, Briefcase } from 'lucide-react'
import { createSalesman, deleteSalesman } from './actions'
import { useCurrency } from '@/contexts/CurrencyContext'

type Salesman = {
  id: number
  name: string
  phone: string | null
  target: number | null
  commissionRate: number
  createdAt: Date
  employee: { id: number; name: string; role: string }
}

type Employee = {
  id: number
  name: string
  role: string
}

export default function SalesmenClient({
  initialSalesmen,
  availableEmployees,
}: {
  initialSalesmen: Salesman[]
  availableEmployees: Employee[]
}) {
  const [salesmen, setSalesmen] = useState<Salesman[]>(initialSalesmen)
  const [isAdding, setIsAdding] = useState(false)
  const { symbol } = useCurrency()

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    phone: '',
    target: '0',
    commissionRate: '0',
  })

  const handleEmployeeChange = (employeeId: string) => {
    const emp = availableEmployees.find(e => e.id.toString() === employeeId)
    setFormData(prev => ({
      ...prev,
      employeeId,
      name: emp?.name || prev.name,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeId) {
      alert('Please select an employee')
      return
    }
    try {
      await createSalesman({
        employeeId: parseInt(formData.employeeId),
        name: formData.name,
        phone: formData.phone,
        target: parseFloat(formData.target) || 0,
        commissionRate: parseFloat(formData.commissionRate) || 0,
      })
      setIsAdding(false)
      setFormData({ employeeId: '', name: '', phone: '', target: '0', commissionRate: '0' })
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Failed to create salesman')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this salesman profile?')) {
      await deleteSalesman(id)
      setSalesmen(salesmen.filter(s => s.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-pink-500" /> Salesmen
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage sales representatives linked to employees
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Salesman
        </button>
      </div>

      {availableEmployees.length === 0 && !isAdding && salesmen.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-amber-700 dark:text-amber-400 text-sm">
          <strong>No employees available.</strong> Please add employees first from the Employees section before creating salesman profiles.
        </div>
      )}

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">New Salesman Profile</h2>
          {availableEmployees.length === 0 ? (
            <p className="text-amber-600 text-sm">No available employees to link. All employees are already assigned as salesmen, or no employees exist.</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link to Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={e => handleEmployeeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select Employee</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name shown on invoices"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contact number"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Target ({symbol})</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.target}
                  onChange={e => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commissionRate}
                  onChange={e => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm">
                  Save Salesman
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-4">Salesman</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Monthly Target</th>
              <th className="px-6 py-4">Commission</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {salesmen.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No salesmen found. Add one above.</p>
                </td>
              </tr>
            ) : salesmen.map(rep => (
              <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{rep.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">{rep.employee?.name}</span>
                    <span className="text-[10px] text-slate-400">({rep.employee?.role})</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {rep.phone ? <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{rep.phone}</div> : '—'}
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">
                  {symbol}{(rep.target || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {rep.commissionRate}%
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(rep.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
