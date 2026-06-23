import { prisma } from '@/lib/prisma'
import { SalesClient } from './SalesClient'
import { getOrganizationSettings } from '../settings/actions'
import { getSession } from '@/lib/auth'

export default async function SalesPage() {
  const session = await getSession();
  const org = session?.organizationId;

  if (!org) {
    return <div>Unauthorized. Please log in again.</div>;
  }

  const invoices = await prisma.salesInvoice.findMany({
    where: { organizationId: org },
    include: {
      customer: true,
      salesman: { include: { employee: true } },
      warehouse: true
    },
    orderBy: { invoiceDate: 'desc' }
  })

  const salesmen = await prisma.salesman.findMany({ where: { organizationId: org }, include: { employee: true } })
  const customers = await prisma.customer.findMany({ where: { organizationId: org } })
  const warehouses = await prisma.warehouse.findMany({ where: { organizationId: org } })
  const products = await prisma.product.findMany({ where: { organizationId: org }, include: { category: true } })
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