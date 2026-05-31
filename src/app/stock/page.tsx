import { prisma } from '@/lib/prisma'
import { StockClient } from './StockClient'

export default async function StockPage() {
  const stocks = await prisma.stock.findMany({
    include: { product: { include: { category: true } }, batch: true, warehouse: true },
    orderBy: { id: 'desc' }
  })

  const warehouses = await prisma.warehouse.findMany()
  const categories = await prisma.category.findMany()

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