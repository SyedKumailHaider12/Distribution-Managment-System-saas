'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getEmployees() {
  return prisma.employee.findMany({
    include: { branch: true },
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

export async function getSalarySlips() {
  return prisma.salarySlip.findMany({
    include: { employee: true },
    orderBy: { month: 'desc' }
  })
}

export async function generateSalarySlip(data: { employeeId: number; month: string; baseSalary: number; deductions: number; bonuses: number }) {
  const netSalary = data.baseSalary + data.bonuses - data.deductions

  await prisma.salarySlip.upsert({
    where: { employeeId_month: { employeeId: data.employeeId, month: data.month } },
    update: { baseSalary: data.baseSalary, deductions: data.deductions, bonuses: data.bonuses, netSalary },
    create: { employeeId: data.employeeId, month: data.month, baseSalary: data.baseSalary, deductions: data.deductions, bonuses: data.bonuses, netSalary, status: 'UNPAID' }
  })
  revalidatePath('/payroll')
}