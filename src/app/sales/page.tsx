import { prisma } from '@/lib/prisma'
import { SalesClient } from './SalesClient'
import { getOrganizationSettings } from '../settings/actions'

export default async function SalesPage() {
  const invoices = await prisma.salesInvoice.findMany({
    include: {
      customer: true,
      salesman: { include: { employee: true } },
      warehouse: true
    },
    orderBy: { invoiceDate: 'desc' }
  })

  const salesmen = await prisma.salesman.findMany({ include: { employee: true } })
  const customers = await prisma.customer.findMany()
  const warehouses = await prisma.warehouse.findMany()
  const products = await prisma.product.findMany({ include: { category: true } })
  const settings = await getOrganizationSettings()

  return (
    <SalesClient
      initialInvoices={invoices}
      salesmen={salesmen}
      customers={customers}
      warehouses={warehouses}
      products={products}
      settings={settings}
    />
  )
}