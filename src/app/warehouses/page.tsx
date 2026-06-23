import { prisma } from '@/lib/prisma'
import WarehousesClient from './WarehousesClient'
import { getSession } from '@/lib/auth'

export default async function WarehousesPage() {
  const session = await getSession()
  const org = session?.organizationId

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: org },
    orderBy: { number: 'asc' }
  })

  return <WarehousesClient initialWarehouses={warehouses} />
}