'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getLeaves() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employees = await prisma.employee.findMany({
    where: { organizationId: session.organizationId, isActive: true },
    orderBy: { name: 'asc' },
  });

  const leaves = await prisma.attendance.findMany({
    where: {
      status: 'LEAVE',
      employee: { organizationId: session.organizationId },
    },
    include: { employee: true },
    orderBy: { date: 'desc' },
  });

  return { employees, leaves };
}

export async function requestLeave(data: {
  employeeId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId, organizationId: session.organizationId },
  });
  if (!employee) throw new Error('Employee not found');

  // Create leave records for each day in the range
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const leaves = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const leaveDate = new Date(d);
    leaveDate.setHours(0, 0, 0, 0);

    const leave = await prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        date: leaveDate,
        status: 'LEAVE',
        notes: data.reason,
        markedBy: session.id,
      },
    });
    leaves.push(leave);
  }

  revalidatePath('/leaves');
  return leaves;
}

export async function deleteLeave(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  await prisma.attendance.delete({
    where: { id },
  });

  revalidatePath('/leaves');
  return { success: true };
}
