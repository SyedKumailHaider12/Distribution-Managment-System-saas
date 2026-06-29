'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Phone, Mail, MapPin, Search, X, Edit, Wallet, AlertCircle, CheckCircle, Receipt } from 'lucide-react'
import { createCustomer, deleteCustomer, updateCustomer, getCustomerPendingInvoices, recordCustomerPayment } from './actions'
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
  area?: Area | null
  createdAt: Date
  pendingPayments?: number
  pendingInvoicesCount?: number
}

type PendingInvoice = {
  id: number
  invoiceNumber: string
  invoiceDate: Date
  netAmount: number
  paidAmount: number
}

export default function CustomersClient({ initialCustomers, areas }: { initialCustomers: Customer[]; areas: Area[] }) {
  const { symbol } = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [isAdding, setIsAdding] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{ customer: Customer; invoices: PendingInvoice[] } | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)
  const [loadingPendingFor, setLoadingPendingFor] = useState<number | null>(null)

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
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updatedCustomer } : c))
    } else {
      const newCustomer = await createCustomer({ ...formData, creditLimit: Number(formData.creditLimit) || 0 })
      setCustomers(prev => [{ ...newCustomer, pendingPayments: 0, pendingInvoicesCount: 0 }, ...prev])
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

  const handleOpenPaymentModal = async (customer: Customer) => {
    setLoadingPendingFor(customer.id)
    try {
      const invoices = await getCustomerPendingInvoices(customer.id)
      setPaymentModal({ customer, invoices: invoices as PendingInvoice[] })
      setSelectedInvoiceId(invoices.length > 0 ? invoices[0].id : null)
      setPaymentAmount('')
      setPaymentMethod('CASH')
      setPaymentNotes('')
    } catch (err) {
      alert('Failed to load pending invoices')
    } finally {
      setLoadingPendingFor(null)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentModal || !selectedInvoiceId || !paymentAmount) return

    setIsPaymentSubmitting(true)
    try {
      await recordCustomerPayment({
        customerId: paymentModal.customer.id,
        invoiceId: selectedInvoiceId,
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes || undefined
      })

      // Update local state
      const selectedInv = paymentModal.invoices.find(i => i.id === selectedInvoiceId)
      if (selectedInv) {
        const paid = Number(paymentAmount)
        const newDue = (selectedInv.netAmount - selectedInv.paidAmount) - paid
        const prevPending = paymentModal.customer.pendingPayments || 0

        setCustomers(prev => prev.map(c =>
          c.id === paymentModal.customer.id
            ? {
                ...c,
                pendingPayments: Math.max(0, prevPending - paid),
                pendingInvoicesCount: newDue <= 0
                  ? Math.max(0, (c.pendingInvoicesCount || 0) - 1)
                  : c.pendingInvoicesCount
              }
            : c
        ))
      }

      setPaymentModal(null)
      alert('Payment recorded successfully')
    } catch (err: any) {
      alert(err.message || 'Failed to record payment')
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'retail') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Retail</span>
    if (type === 'shopkeeper') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Shopkeeper</span>
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600">{type}</span>
  }

  const selectedInvoice = paymentModal?.invoices.find(i => i.id === selectedInvoiceId)
  const selectedInvoiceDue = selectedInvoice ? selectedInvoice.netAmount - selectedInvoice.paidAmount : 0

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

      {/* Add/Edit Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingCustomer(null) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
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
                <button type="button" onClick={() => { setIsAdding(false); setEditingCustomer(null) }} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
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

      {/* Record Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                Record Payment
              </h2>
              <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{paymentModal.customer.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {paymentModal.invoices.length} pending invoice{paymentModal.invoices.length !== 1 ? 's' : ''}
              </p>
            </div>

            {paymentModal.invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <p>No pending invoices for this customer.</p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Invoice *</label>
                  <select
                    value={selectedInvoiceId || ''}
                    onChange={e => setSelectedInvoiceId(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    {paymentModal.invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Due: {symbol} {(inv.netAmount - inv.paidAmount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {selectedInvoice && (
                    <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Total: {symbol} {selectedInvoice.netAmount.toFixed(2)}</span>
                      <span>Paid: {symbol} {selectedInvoice.paidAmount.toFixed(2)}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Balance: {symbol} {selectedInvoiceDue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Amount *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedInvoiceDue}
                      required
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedInvoiceDue.toFixed(2))}
                      className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors whitespace-nowrap"
                    >
                      Full Amount
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'CARD', 'BANK'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          paymentMethod === method
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cheque no., transfer ref..."
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setPaymentModal(null)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPaymentSubmitting || !paymentAmount} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isPaymentSubmitting ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            )}
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
                <th className="px-6 py-4">Pending Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
                    <td className="px-6 py-4">
                      {(cust.pendingPayments || 0) > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            {symbol} {(cust.pendingPayments || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {cust.pendingInvoicesCount} invoice{(cust.pendingInvoicesCount || 0) !== 1 ? 's' : ''} pending
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(cust.pendingPayments || 0) > 0 && (
                          <button
                            onClick={() => handleOpenPaymentModal(cust)}
                            disabled={loadingPendingFor === cust.id}
                            className="inline-flex items-center justify-center p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Record Payment"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
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
