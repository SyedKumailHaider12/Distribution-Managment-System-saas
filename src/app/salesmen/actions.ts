'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSalesmen() {
  return prisma.salesman.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createSalesman(data: { name: string; phone: string; area: string; target: number }) {
  await prisma.salesman.create({
    data: {
      name: data.name,
      phone: data.phone,
      area: data.area,
      target: data.target
    }
  })
  revalidatePath('/salesmen')
}

export async function deleteSalesman(id: number) {
  await prisma.salesman.delete({
    where: { id }
  })
  revalidatePath('/salesmen')
}
