'use client'

import { useState } from 'react'
import { Warehouse as WarehouseIcon, Plus, Trash2, Home, Truck, Store, Search, X, Edit } from 'lucide-react'
import { createWarehouse, deleteWarehouse, updateWarehouse } from './actions'

type Warehouse = {
  id: number
  number: number
  name: string
  type: string
  description: string | null
}

export default function WarehousesClient({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses)
  const [isAdding, setIsAdding] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState({ number: 0, name: '', type: 'warehouse', description: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredWarehouses = warehouses.filter(wh =>
    wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wh.description && wh.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingWarehouse) {
      const updatedWarehouse = await updateWarehouse(editingWarehouse.id, { ...formData, number: parseInt(formData.number.toString()) })
      setWarehouses(prev => prev.map(w => w.id === editingWarehouse.id ? updatedWarehouse : w))
    } else {
      const newWarehouse = await createWarehouse({ ...formData, number: parseInt(formData.number.toString()) })
      setWarehouses(prev => [...prev, newWarehouse])
    }
    setIsAdding(false)
    setEditingWarehouse(null)
    setFormData({ number: 0, name: '', type: 'warehouse', description: '' })
    setIsSubmitting(false)
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      number: warehouse.number,
      name: warehouse.name,
      type: warehouse.type,
      description: warehouse.description || '',
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm('Are you sure you want to delete this warehouse?')) {
      await deleteWarehouse(id)
      setWarehouses(prev => prev.filter(wh => wh.id !== id))
    }
  }

  const getTypeIcon = (type: string) => {
    if (type === 'warehouse') return <Home className="w-4 h-4 text-indigo-500" />
    if (type === 'van') return <Truck className="w-4 h-4 text-amber-500" />
    if (type === 'shop') return <Store className="w-4 h-4 text-emerald-500" />
    return null
  }

  const getTypeBadge = (type: string) => {
    if (type === 'warehouse') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Main Warehouse</span>
    if (type === 'van') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Delivery Van</span>
    if (type === 'shop') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Retail Shop</span>
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600">{type}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <WarehouseIcon className="w-8 h-8 text-indigo-600" /> Warehouses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage physical locations, shops, and delivery vans</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search warehouses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Add Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingWarehouse ? 'Edit Location' : 'Add New Location'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingWarehouse(null); setFormData({ number: 0, name: '', type: 'warehouse', description: '' }) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Number</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.number}
                    onChange={e => setFormData({...formData, number: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Main Godown"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="warehouse">Main Warehouse</option>
                  <option value="shop">Retail Shop</option>
                  <option value="van">Delivery Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Address or details"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingWarehouse ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">Number</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <WarehouseIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No warehouses found</p>
                  </td>
                </tr>
              ) : filteredWarehouses.map((wh, index) => (
                <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{wh.number}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-white">
                      {getTypeIcon(wh.type)} {wh.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTypeBadge(wh.type)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{wh.description || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(wh)} className="inline-flex items-center justify-center p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(wh.id)} className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
