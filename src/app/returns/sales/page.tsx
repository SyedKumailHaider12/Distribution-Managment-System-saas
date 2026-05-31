import { prisma } from '@/lib/prisma'
import { SalesReturnsClient } from './SalesReturnsClient'

export default async function SalesReturnsPage() {
  const invoices = await prisma.salesInvoice.findMany({
    include: {
      customer: true,
      items: { include: { product: true, batch: true } }
    },
    orderBy: { invoiceDate: 'desc' },
    take: 50
  })

  const purchaseInvoices = await prisma.purchaseInvoice.findMany({ take: 10 })

  return <SalesReturnsClient initialInvoices={invoices} purchaseInvoices={purchaseInvoices} />
}