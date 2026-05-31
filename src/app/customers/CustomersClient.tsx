'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Phone, Mail, MapPin, Wallet, Search, X, Edit } from 'lucide-react'
import { createCustomer, deleteCustomer, updateCustomer } from './actions'
import { useCurrency } from '@/contexts/CurrencyContext'

type Area = { id: number; name: string }
type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  type: string
  creditLimit: number
  area?: Area
  createdAt: Date
}

export default function CustomersClient({ initialCustomers, areas }: { initialCustomers: Customer[]; areas: Area[] }) {
  const { symbol } = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [isAdding, setIsAdding] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', type: 'retail', creditLimit: '0'
  })

  const filteredCustomers = customers.filter(cust =>
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cust.phone && cust.phone.includes(searchTerm)) ||
    (cust.address && cust.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingCustomer) {
      const updatedCustomer = await updateCustomer(editingCustomer.id, { ...formData, creditLimit: Number(formData.creditLimit) || 0 })
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCustomer : c))
    } else {
      const newCustomer = await createCustomer({ ...formData, creditLimit: Number(formData.creditLimit) || 0 })
      setCustomers(prev => [newCustomer, ...prev])
    }
    setIsAdding(false)
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', email: '', address: '', type: 'retail', creditLimit: '0' })
    setIsSubmitting(false)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      type: customer.type,
      creditLimit: customer.creditLimit.toString()
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'retail') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Retail</span>
    if (type === 'shopkeeper') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Shopkeeper</span>
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600">{type}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-500" /> Customers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage wholesale customers and track ledger balances</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {/* Add Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Customer</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Customer Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ahmed Ali"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Customer Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="retail">Retail</option>
                    <option value="shopkeeper">Shopkeeper</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Credit Limit</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Customer'}
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
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Area</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Credit Limit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, index) => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-white">{cust.name}</div>
                      {cust.address && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {cust.address}</div>}
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(cust.type)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{cust.area?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {cust.phone && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone className="w-3.5 h-3.5" /> {cust.phone}</div>}
                        {cust.email && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Mail className="w-3.5 h-3.5" /> {cust.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-white">{symbol} {Number(cust.creditLimit || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(cust)} className="inline-flex items-center justify-center p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cust.id)} className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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