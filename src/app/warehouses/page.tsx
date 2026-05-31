import { prisma } from '@/lib/prisma'
import WarehousesClient from './WarehousesClient'

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { number: 'asc' }
  })

  return <WarehousesClient initialWarehouses={warehouses} />
}