'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getWarehouses() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  return prisma.warehouse.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { number: 'asc' }
  })
}

export async function createWarehouse(data: { number: number; name: string; type: string; description: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const newWarehouse = await prisma.warehouse.create({
    data: {
      organizationId: session.organizationId,
      number: data.number,
      name: data.name,
      type: data.type,
      description: data.description
    }
  })
  revalidatePath('/warehouses')
  return newWarehouse
}

export async function deleteWarehouse(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  try {
    await prisma.warehouse.delete({
      where: { id, organizationId: session.organizationId }
    })
  } catch (e) {
    // Record might already be deleted
  }
  revalidatePath('/warehouses')
}

export async function updateWarehouse(id: number, data: { number: number; name: string; type: string; description: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const updatedWarehouse = await prisma.warehouse.update({
    where: { id, organizationId: session.organizationId },
    data: {
      number: data.number,
      name: data.name,
      type: data.type,
      description: data.description
    }
  })
  revalidatePath('/warehouses')
  return updatedWarehouse
}
