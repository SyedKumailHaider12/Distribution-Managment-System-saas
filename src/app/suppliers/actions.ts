'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getSuppliers() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  return prisma.supplier.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getSupplierCompanies() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return prisma.supplierCompany.findMany({
    where: { organizationId: session.organizationId }
  })
}

export async function createSupplier(data: { name: string; supplierCompanyId: number; phone: string; address: string; contactPerson?: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const newSupplier = await prisma.supplier.create({
    data: {
      organizationId: session.organizationId,
      supplierCompanyId: data.supplierCompanyId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      contactPerson: data.contactPerson
    },
    include: { supplierCompany: true } // Need to include to render organization name
  })
  revalidatePath('/suppliers')
  return newSupplier
}

export async function deleteSupplier(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await prisma.supplier.delete({
    where: { id, organizationId: session.organizationId }
  })
  revalidatePath('/suppliers')
}

export async function updateSupplier(id: number, data: { name: string; supplierCompanyId: number; phone: string; address: string; contactPerson?: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const updatedSupplier = await prisma.supplier.update({
    where: { id, organizationId: session.organizationId },
    data: {
      supplierCompanyId: data.supplierCompanyId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      contactPerson: data.contactPerson
    },
    include: { supplierCompany: true }
  })
  revalidatePath('/suppliers')
  return updatedSupplier
}
