'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getCompanies() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  return prisma.supplierCompany.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createOrganization(data: { name: string; contactPerson: string; phone: string; email: string; address: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  const newOrg = await prisma.supplierCompany.create({
    data: {
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      organization: { connect: { id: session.organizationId } },
    },
  })
  revalidatePath('/companies')
  return newOrg
}

export async function deleteOrganization(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  try {
    await prisma.supplierCompany.delete({
      where: { id },
    })
  } catch (e) {}
  revalidatePath('/companies')
}

export async function updateOrganization(id: number, data: { name: string; contactPerson: string; phone: string; email: string; address: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  const updatedOrg = await prisma.supplierCompany.update({
    where: { id },
    data: {
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address
    }
  })
  revalidatePath('/companies')
  return updatedOrg
}
