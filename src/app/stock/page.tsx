import { prisma } from '@/lib/prisma'
import { StockClient } from './StockClient'
import { getSession } from '@/lib/auth'

export default async function StockPage() {
  const session = await getSession()
  const org = session?.organizationId

  const stocks = await prisma.stock.findMany({
    where: { organizationId: org },
    include: { product: { include: { category: true } }, batch: true, warehouse: true },
    orderBy: { id: 'desc' }
  })

  const warehouses = await prisma.warehouse.findMany({ where: { organizationId: org } })
  const categories = await prisma.category.findMany({ where: { organizationId: org } })

  // Calculate counts
  const lowStockCount = stocks.filter(s => s.quantity > 0 && s.quantity < (s.product.reorderLevel || 10)).length
  const outOfStockCount = stocks.filter(s => s.quantity === 0).length
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCount = stocks.filter(s => s.batch.expiryDate && new Date(s.batch.expiryDate) <= thirtyDaysFromNow && new Date(s.batch.expiryDate) > new Date()).length

  return (
    <StockClient
      initialStocks={stocks}
      warehouses={warehouses}
      categories={categories}
      lowStockCount={lowStockCount}
      outOfStockCount={outOfStockCount}
      expiringCount={expiringCount}
    />
  )
}