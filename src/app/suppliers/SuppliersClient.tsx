'use client'

import { useState } from 'react'
import { Building2, Plus, Trash2, Phone, Mail, MapPin, User, Search, X, Edit } from 'lucide-react'
import { createSupplier, deleteSupplier, updateSupplier } from './actions'

type SupplierCompany = { id: number; name: string }
type Supplier = {
  id: number
  name: string
  phone: string | null
  address: string | null
  supplierCompany?: SupplierCompany | null
  supplierCompanyId: number | null
  createdAt: Date
}

export default function SuppliersClient({ initialSuppliers, supplierCompanies }: { initialSuppliers: Supplier[]; supplierCompanies: SupplierCompany[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [isAdding, setIsAdding] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '', supplierCompanyId: '', phone: '', address: ''
  })

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.supplierCompany?.name && sup.supplierCompany.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingSupplier) {
      const updatedSupplier = await updateSupplier(editingSupplier.id, { ...formData, supplierCompanyId: parseInt(formData.supplierCompanyId) })
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updatedSupplier : s))
    } else {
      const newSupplier = await createSupplier({ ...formData, supplierCompanyId: parseInt(formData.supplierCompanyId) })
      setSuppliers(prev => [newSupplier, ...prev])
    }
    setIsAdding(false)
    setEditingSupplier(null)
    setFormData({ name: '', supplierCompanyId: '', phone: '', address: '' })
    setIsSubmitting(false)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      supplierCompanyId: supplier.supplierCompanyId?.toString() || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm('Are you sure you want to delete this supplier?')) {
      await deleteSupplier(id)
      setSuppliers(prev => prev.filter(s => s.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-orange-500" /> Suppliers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage suppliers linked to organizations</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>

      {/* Add Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingSupplier(null); setFormData({ name: '', supplierCompanyId: '', phone: '', address: '' }) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier Company *</label>
                <select
                  required
                  value={formData.supplierCompanyId}
                  onChange={e => setFormData({ ...formData, supplierCompanyId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="">Select Supplier Company</option>
                  {supplierCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier Name *</label>
                <input
                  required
                  type="text"
                  placeholder="Supplier name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Supplier'}
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
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Supplier Company</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No suppliers found</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup, index) => (
                  <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{sup.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{sup.supplierCompany?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sup.phone && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone className="w-3.5 h-3.5" /> {sup.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {sup.address ? (
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {sup.address}</div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(sup)} className="inline-flex items-center justify-center p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sup.id)} className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  )
}