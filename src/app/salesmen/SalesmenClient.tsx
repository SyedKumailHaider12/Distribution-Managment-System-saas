'use client'

import { useState } from 'react'
import { UserCheck, Plus, Trash2, Phone, MapPin, Target } from 'lucide-react'
import { createSalesman, deleteSalesman } from './actions'
import { useCurrency } from '@/contexts/CurrencyContext'

type Salesman = {
  id: number
  name: string
  phone: string | null
  area: string | null
  target: number
  createdAt: Date
}

export default function SalesmenClient({ initialSalesmen }: { initialSalesmen: Salesman[] }) {
  const [salesmen, setSalesmen] = useState<Salesman[]>(initialSalesmen)
  const [isAdding, setIsAdding] = useState(false)
  const { symbol } = useCurrency()
  
  const [formData, setFormData] = useState({
    name: '', phone: '', area: '', target: '0'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createSalesman({
      name: formData.name,
      phone: formData.phone,
      area: formData.area,
      target: parseFloat(formData.target) || 0
    })
    setIsAdding(false)
    window.location.reload()
  }

  const handleDelete = async (id: number) => {
    if(confirm('Are you sure you want to delete this salesman?')) {
      await deleteSalesman(id)
      window.location.reload()
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UserCheck className="text-pink-400" /> Salesmen
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage sales representatives, coverage areas, and monthly targets.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary">
          <Plus size={18} /> Add Salesman
        </button>
      </div>

      {isAdding && (
        <div className="glass-card animate-slide-in">
          <h2 className="text-xl font-bold text-white mb-4">Add New Sales Representative</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">Salesman Name *</label>
              <input required type="text" className="input-field" placeholder="E.g. Michael Jordan" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">Phone Number</label>
              <input type="text" className="input-field" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">Coverage Area</label>
              <input type="text" className="input-field" placeholder="E.g. Downtown / Zone 1" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">Monthly Target Amount ({symbol})</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input type="number" step="100" min="0" className="input-field pl-10" placeholder="0.00" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-[var(--border-glass)] pt-4">
              <button type="button" className="btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Salesman</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Salesman Name</th>
              <th>Contact Details</th>
              <th>Coverage Area</th>
              <th>Monthly Target</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {salesmen.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">No salesmen found.</td>
              </tr>
            ) : salesmen.map(rep => (
              <tr key={rep.id}>
                <td className="font-semibold text-white">{rep.name}</td>
                <td className="text-[var(--text-secondary)]">
                  {rep.phone ? <div className="flex items-center gap-2 text-sm"><Phone size={14}/> {rep.phone}</div> : '-'}
                </td>
                <td className="text-[var(--text-secondary)]">
                  {rep.area ? <div className="flex items-center gap-2 text-sm"><MapPin size={14}/> {rep.area}</div> : '-'}
                </td>
                <td>
                  <div className="font-medium text-emerald-400 text-lg">
                    {symbol}{rep.target.toFixed(2)}
                  </div>
                </td>
                <td className="text-right">
                  <button onClick={() => handleDelete(rep.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={18} />
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
