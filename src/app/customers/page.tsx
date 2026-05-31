import { prisma } from '@/lib/prisma'
import CustomersClient from './CustomersClient'

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { area: true },
    orderBy: { createdAt: 'desc' }
  })
  const areas = await prisma.area.findMany({ select: { id: true, name: true } })

  return <CustomersClient initialCustomers={customers} areas={areas} />
}