import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { SalesReturnsClient } from './SalesReturnsClient'
import { redirect } from 'next/navigation'

export default async function SalesReturnsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const invoices = await prisma.salesInvoice.findMany({
    where: { organizationId: session.organizationId },
    include: {
      customer: true,
      items: { include: { product: true, batch: true } }
    },
    orderBy: { invoiceDate: 'desc' },
    take: 100
  })

  const returns = await prisma.customerReturn.findMany({
    where: { organizationId: session.organizationId },
    include: {
      invoice: { include: { customer: true } },
      items: { include: { product: true, batch: true } },
      processedByUser: true,
    },
    orderBy: { returnDate: 'desc' },
    take: 100
  })

  return <SalesReturnsClient initialInvoices={invoices} returns={returns} />
}
