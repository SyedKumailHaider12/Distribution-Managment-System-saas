"use server";

import prisma from '../prisma';

/**
 * Staff self-service punch-in or punch-out.
 */
export async function toggleAttendance(employeeId: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize to start of day

  return prisma.$transaction(async (tx) => {
    let attendance = await tx.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } }
    });

    if (!attendance) {
      // First punch of the day -> Punch In
      attendance = await tx.attendance.create({
        data: {
          employeeId,
          date: today,
          status: 'PRESENT',
          punchIn: new Date(),
        }
      });
      return { status: 'PUNCHED_IN', time: attendance.punchIn };
    } else {
      // Already punched in -> Punch Out
      if (attendance.punchOut) {
        throw new Error("Already punched out for today.");
      }
      attendance = await tx.attendance.update({
        where: { id: attendance.id },
        data: { punchOut: new Date() }
      });
      return { status: 'PUNCHED_OUT', time: attendance.punchOut };
    }
  });
}

/**
 * Manager override to mark attendance.
 */
export async function markAttendanceByManager(data: {
  employeeId: number;
  date: Date;
  status: string; // 'PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'
  managerUserId: number;
  notes?: string;
}) {
  const normalizedDate = new Date(data.date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date: normalizedDate } },
    update: {
      status: data.status,
      markedBy: data.managerUserId,
      notes: data.notes
    },
    create: {
      employeeId: data.employeeId,
      date: normalizedDate,
      status: data.status,
      markedBy: data.managerUserId,
      notes: data.notes
    }
  });
}
