'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getCustomers() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  return prisma.customer.findMany({
    where: { organizationId: session.organizationId },
    include: { area: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCustomer(data: { name: string; phone: string; email: string; address: string; type: string; creditLimit: number }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const newCustomer = await prisma.customer.create({
    data: {
      organizationId: session.organizationId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      type: data.type,
      creditLimit: data.creditLimit
    },
    include: { area: true }
  })
  revalidatePath('/customers')
  return newCustomer
}

export async function deleteCustomer(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  try {
    await prisma.customer.delete({ 
      where: { id, organizationId: session.organizationId } 
    })
  } catch (e) {}
  revalidatePath('/customers')
}

export async function updateCustomer(id: number, data: { name: string; phone: string; email: string; address: string; type: string; creditLimit: number }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const updatedCustomer = await prisma.customer.update({
    where: { id, organizationId: session.organizationId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      type: data.type,
      creditLimit: data.creditLimit
    },
    include: { area: true }
  })
  revalidatePath('/customers')
  return updatedCustomer
}
