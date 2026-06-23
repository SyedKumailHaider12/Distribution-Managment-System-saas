'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getCustomers() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  const customers = await prisma.customer.findMany({
    where: { organizationId: session.organizationId },
    include: { area: true },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate pending payments for each customer
  const customersWithPending = await Promise.all(
    customers.map(async (customer) => {
      const salesInvoices = await prisma.salesInvoice.findMany({
        where: {
          customerId: customer.id,
          organizationId: session.organizationId,
          saleType: 'distribution',
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      })

      const totalPending = salesInvoices.reduce((sum, inv) => {
        return sum + (inv.netAmount - inv.paidAmount)
      }, 0)

      return {
        ...customer,
        pendingPayments: totalPending,
        pendingInvoicesCount: salesInvoices.length
      }
    })
  )

  return customersWithPending
}

export async function createCustomer(data: { name: string; phone: string; email: string; address: string; type: string; creditLimit: number }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const newCustomer = await prisma.customer.create({
    data: {
      organizationId: session.organizationId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      type: data.type,
      creditLimit: data.creditLimit
    },
    include: { area: true }
  })
  revalidatePath('/customers')
  return newCustomer
}

export async function deleteCustomer(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  try {
    await prisma.customer.delete({ 
      where: { id, organizationId: session.organizationId } 
    })
  } catch (e) {}
  revalidatePath('/customers')
}

export async function updateCustomer(id: number, data: { name: string; phone: string; email: string; address: string; type: string; creditLimit: number }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const updatedCustomer = await prisma.customer.update({
    where: { id, organizationId: session.organizationId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      type: data.type,
      creditLimit: data.creditLimit
    },
    include: { area: true }
  })
  revalidatePath('/customers')
  return updatedCustomer
}

export async function getCustomerPendingInvoices(customerId: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  return prisma.salesInvoice.findMany({
    where: {
      customerId,
      organizationId: session.organizationId,
      saleType: 'distribution',
      status: { in: ['UNPAID', 'PARTIAL'] }
    },
    orderBy: { invoiceDate: 'desc' }
  })
}

export async function recordCustomerPayment(data: {
  customerId: number
  invoiceId: number
  amount: number
  paymentMethod: string
  notes?: string
}) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const organizationId = session.organizationId

  const invoice = await prisma.salesInvoice.findUnique({
    where: { id: data.invoiceId, organizationId }
  })
  if (!invoice) throw new Error('Invoice not found')

  const due = invoice.netAmount - invoice.paidAmount
  if (data.amount <= 0) throw new Error('Amount must be greater than 0')
  if (data.amount > due) throw new Error(`Amount exceeds balance due (${due.toFixed(2)})`)

  const newPaidAmount = invoice.paidAmount + data.amount
  const newStatus = newPaidAmount >= invoice.netAmount ? 'PAID' : 'PARTIAL'

  await prisma.$transaction(async (tx) => {
    // Update invoice
    await tx.salesInvoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      }
    })

    // Record payment
    await tx.payment.create({
      data: {
        organizationId,
        branchId: invoice.branchId,
        type: 'INCOMING',
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        customerId: data.customerId,
        invoiceNumber: invoice.invoiceNumber,
        notes: data.notes
      }
    })

    // Customer ledger credit entry
    const lastEntry = await tx.customerLedgerEntry.findFirst({
      where: { customerId: data.customerId, organizationId },
      orderBy: { date: 'desc' }
    })
    await tx.customerLedgerEntry.create({
      data: {
        organizationId,
        customerId: data.customerId,
        type: 'CREDIT',
        amount: data.amount,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        referenceId: invoice.invoiceNumber,
        balance: (lastEntry?.balance || 0) - data.amount
      }
    })

    // Audit log
    await tx.auditLog.create({
      data: {
        organizationId,
        userId: session.id,
        action: 'PAYMENT',
        tableName: 'SalesInvoice',
        recordId: data.invoiceId,
        details: `Payment of ${data.amount} recorded for invoice ${invoice.invoiceNumber}`
      }
    })
  })

  revalidatePath('/customers')
  revalidatePath('/sales')
  return { success: true }
}
