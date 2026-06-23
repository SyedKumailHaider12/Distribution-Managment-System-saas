import { prisma } from '@/lib/prisma'
import PurchasesClient from './PurchasesClient'
import { getSession } from '@/lib/auth'

export default async function PurchasesPage() {
  const session = await getSession()
  
  const org = session?.organizationId
  if (!org) {
    return <div>Unauthorized. Please log in again.</div>
  }
  
  // Fetch purchase invoices
  const invoices = await prisma.purchaseInvoice.findMany({
    where: { organizationId: org },
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
  const suppliers = await prisma.supplier.findMany({ where: { organizationId: org }, include: { organization: true, supplierCompany: true } })
  const supplierCompanies = await prisma.supplierCompany.findMany({ where: { organizationId: org }, orderBy: { name: 'asc' } })
  const warehouses = await prisma.warehouse.findMany({ where: { organizationId: org } })
  const branches = await prisma.branch.findMany({ where: { organizationId: org }, include: { organization: true } })
  const categories = await prisma.category.findMany({ where: { organizationId: org } })
  const products = await prisma.product.findMany({ where: { organizationId: org }, include: { category: true, brand: true } })

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