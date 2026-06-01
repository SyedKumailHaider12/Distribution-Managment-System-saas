'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getSalesmen() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return prisma.salesman.findMany({
    where: { organizationId: session.organizationId },
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getAvailableEmployees() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  // Employees not already linked to a salesman profile
  const linkedEmployeeIds = await prisma.salesman.findMany({
    where: { organizationId: session.organizationId },
    select: { employeeId: true }
  })
  const linkedIds = linkedEmployeeIds.map(s => s.employeeId)
  return prisma.employee.findMany({
    where: {
      organizationId: session.organizationId,
      isActive: true,
      id: { notIn: linkedIds.length > 0 ? linkedIds : [-1] }
    },
    orderBy: { name: 'asc' }
  })
}

export async function createSalesman(data: {
  employeeId: number
  name: string
  phone: string
  areaId?: number
  target: number
  commissionRate: number
}) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await prisma.salesman.create({
    data: {
      organizationId: session.organizationId,
      employeeId: data.employeeId,
      name: data.name,
      phone: data.phone || null,
      areaId: data.areaId || null,
      target: data.target,
      commissionRate: data.commissionRate,
    }
  })
  revalidatePath('/salesmen')
}

export async function deleteSalesman(id: number) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  await prisma.salesman.delete({
    where: { id, organizationId: session.organizationId }
  })
  revalidatePath('/salesmen')
}
