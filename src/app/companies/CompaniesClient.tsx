'use client'

import React, { useState } from 'react'
import { Building2, Plus, Trash2, Mail, Phone, MapPin, Search, X, Edit } from 'lucide-react'
import { createOrganization, deleteOrganization, updateOrganization } from './actions'

type Supplier = {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  address: string | null
  createdAt: Date
}

export default function CompaniesClient({ initialCompanies }: { initialCompanies: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialCompanies)
  // ... update variable names internally ...
  // Wait, I need to update all usages of `organizations` to `suppliers`.
  // This is too much to replace in one go. I will do it step by step.
  // Actually, I can use replace tool for this.

  const [isAdding, setIsAdding] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  })

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.contactPerson && sup.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sup.phone && sup.phone.includes(searchTerm))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingSupplier) {
        const updatedOrg = await updateOrganization(editingSupplier.id, formData)
        setSuppliers(prev => prev.map(c => c.id === editingSupplier.id ? updatedOrg : c))
      } else {
        const newOrg = await createOrganization(formData)
        setSuppliers(prev => [newOrg, ...prev])
      }
      setIsAdding(false)
      setEditingSupplier(null)
      setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' })
    } catch (error) {
      console.error("Failed to save supplier:", error)
      alert("Failed to save supplier. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: '', // Not in Supplier type, but in formData
      address: sup.address || '',
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteOrganization(id)
        setSuppliers(prev => prev.filter(c => c.id !== id))
      } catch (error) {
        console.error("Failed to delete supplier:", error)
        alert("Failed to delete supplier.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" /> Companies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage supplier companies and manufacturers</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Add Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingSupplier(null); setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' }) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Getz Pharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <textarea
                  placeholder="Supplier Address"
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditingSupplier(null); }} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                  {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
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
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Added On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No suppliers found</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup, index) => (
                  <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-white">{sup.name}</div>
                      {sup.contactPerson && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {sup.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sup.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {sup.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {sup.address || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(sup.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(sup)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sup.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
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
