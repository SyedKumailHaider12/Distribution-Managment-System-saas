'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getCategories() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  return prisma.category.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: 'asc' }
  })
}

export async function createCategory(data: { name: string; description: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const newCategory = await prisma.category.create({
    data: {
      organizationId: session.organizationId,
      name: data.name,
      description: data.description
    }
  })
  revalidatePath('/categories')
  return newCategory
}

export async function deleteCategory(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await prisma.category.delete({
    where: { id, organizationId: session.organizationId }
  })
  revalidatePath('/categories')
}

export async function updateCategory(id: number, data: { name: string; description: string }) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const updatedCategory = await prisma.category.update({
    where: { id, organizationId: session.organizationId },
    data: {
      name: data.name,
      description: data.description
    }
  })
  revalidatePath('/categories')
  return updatedCategory
}
