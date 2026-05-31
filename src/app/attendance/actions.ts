'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAttendance() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employees = await prisma.employee.findMany({
    where: { organizationId: session.organizationId, isActive: true },
    include: { branch: true },
    orderBy: { name: 'asc' },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      date: today,
      employee: { organizationId: session.organizationId },
    },
    include: { employee: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: { employee: { organizationId: session.organizationId } },
    include: { employee: true },
    orderBy: { date: 'desc' },
    take: 100,
  });

  return { employees, attendances, todayAttendances };
}

export async function markAttendance(data: {
  employeeId: number;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  punchIn?: Date;
  punchOut?: Date;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId, organizationId: session.organizationId },
  });
  if (!employee) throw new Error('Employee not found');

  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: data.date,
      },
    },
    update: {
      status: data.status,
      punchIn: data.punchIn,
      punchOut: data.punchOut,
      markedBy: session.id,
      notes: data.notes,
    },
    create: {
      employeeId: data.employeeId,
      date: data.date,
      status: data.status,
      punchIn: data.punchIn,
      punchOut: data.punchOut,
      markedBy: session.id,
      notes: data.notes,
    },
  });

  revalidatePath('/attendance');
  return attendance;
}

export async function bulkMarkAttendance(data: {
  employeeIds: number[];
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const results = await Promise.all(
    data.employeeIds.map((employeeId) =>
      prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: data.date,
          },
        },
        update: {
          status: data.status,
          markedBy: session.id,
        },
        create: {
          employeeId,
          date: data.date,
          status: data.status,
          markedBy: session.id,
        },
      })
    )
  );

  revalidatePath('/attendance');
  return results;
}
