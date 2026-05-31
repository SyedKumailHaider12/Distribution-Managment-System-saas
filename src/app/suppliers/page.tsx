import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuppliersClient from './SuppliersClient'

export default async function SuppliersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: session.organizationId },
    include: { supplierCompany: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const supplierCompanies = await prisma.supplierCompany.findMany({ 
    where: { organizationId: session.organizationId },
    orderBy: { name: 'asc' } 
  })

  return <SuppliersClient initialSuppliers={suppliers} supplierCompanies={supplierCompanies} />
}