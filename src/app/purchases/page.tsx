import { prisma } from '@/lib/prisma'
import PurchasesClient from './PurchasesClient'
import { getSession } from '@/lib/auth'

export default async function PurchasesPage() {
  const session = await getSession()
  
  // Fetch purchase invoices
  const invoices = await prisma.purchaseInvoice.findMany({
    include: {
      supplier: {
        include: { organization: true, supplierCompany: true }
      },
      warehouse: true,
      branch: true,
      items: {
        include: { product: true, batch: true }
      }
    },
    orderBy: { invoiceDate: 'desc' }
  })

  // Fetch lookup data
  const suppliers = await prisma.supplier.findMany({ include: { organization: true, supplierCompany: true } })
  const supplierCompanies = await prisma.supplierCompany.findMany({ orderBy: { name: 'asc' } })
  const warehouses = await prisma.warehouse.findMany()
  const branches = await prisma.branch.findMany({ include: { organization: true } })
  const categories = await prisma.category.findMany()
  const products = await prisma.product.findMany({ include: { category: true, brand: true } })

  return (
    <PurchasesClient
      initialInvoices={invoices}
      suppliers={suppliers}
      supplierCompanies={supplierCompanies}
      warehouses={warehouses}
      branches={branches}
      categories={categories}
      products={products}
      session={session}
      appSettings={{}}
    />
  )
  }