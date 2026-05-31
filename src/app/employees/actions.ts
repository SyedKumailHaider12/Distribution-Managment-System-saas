'use server';

import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmployees() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.employee.findMany({
    where: { organizationId: session.organizationId },
    include: {
      branch: true,
      user: true,
      salesmanProfile: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getEmployeeById(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.employee.findUnique({
    where: { 
      id,
      organizationId: session.organizationId 
    },
    include: {
      branch: true,
      user: true,
      salesmanProfile: true,
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      salarySlips: {
        orderBy: { month: 'desc' },
        take: 12,
      },
    },
  });
}

export async function createEmployee(data: {
  name: string;
  employeeCode: string;
  role: string;
  phone?: string;
  baseSalary?: number;
  branchId: number;
  organizationId: number; // New field
  username?: string;
  password?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { name, employeeCode, role, phone, baseSalary, branchId, organizationId, username, password } = data;

  const branchExists = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branchExists) {
    throw new Error(`Branch with ID ${branchId} does not exist.`);
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      employeeCode,
      role,
      phone,
      baseSalary: baseSalary || 0,
      branchId,
      organizationId, // Added
    },
  });

  // Create user account if username/password provided
  if (username && password) {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId, // Added
        username,
        passwordHash,
        role: role === 'Admin' ? 'admin' : role === 'Manager' ? 'manager' : 'cashier',
        fullName: name,
      },
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });
  }

  // Create salesman profile if role is Salesman
  if (role === 'Salesman') {
    await prisma.salesman.create({
      data: {
        employeeId: employee.id,
        name,
        phone,
      },
    });
  }

  revalidatePath('/employees');
  return employee;
}

export async function updateEmployee(id: number, data: {
  name?: string;
  role?: string;
  phone?: string;
  baseSalary?: number;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employee = await prisma.employee.update({
    where: { 
      id,
      organizationId: session.organizationId 
    },
    data,
  });

  revalidatePath('/employees');
  return employee;
}

export async function deleteEmployee(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  await prisma.employee.delete({
    where: { 
      id,
      organizationId: session.organizationId 
    },
  });

  revalidatePath('/employees');
  return { success: true };
}

// Attendance
export async function markAttendance(data: {
  employeeId: number;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  // Verify employee belongs to org
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId, organizationId: session.organizationId }
  });
  if (!employee) throw new Error('Employee not found in organization');

  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: data.date,
      },
    },
    update: {
      status: data.status,
      markedBy: session.id,
      notes: data.notes,
    },
    create: {
      employeeId: data.employeeId,
      date: data.date,
      status: data.status,
      markedBy: session.id,
      notes: data.notes,
    },
  });

  revalidatePath('/employees');
  return attendance;
}

// Payroll
export async function generateSalarySlip(data: {
  employeeId: number;
  month: string; // YYYY-MM format
  deductions?: number;
  bonuses?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId, organizationId: session.organizationId },
  });

  if (!employee) throw new Error('Employee not found in organization');

  const baseSalary = employee.baseSalary;
  const deductions = data.deductions || 0;
  const bonuses = data.bonuses || 0;
  const netSalary = baseSalary - deductions + bonuses;

  const slip = await prisma.salarySlip.upsert({
    where: {
      employeeId_month: {
        employeeId: data.employeeId,
        month: data.month,
      },
    },
    update: {
      deductions,
      bonuses,
      netSalary,
    },
    create: {
      employeeId: data.employeeId,
      month: data.month,
      baseSalary,
      deductions,
      bonuses,
      netSalary,
      status: 'UNPAID',
    },
  });

  revalidatePath('/payroll');
  return slip;
}

export async function getSalarySlips(employeeId?: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const where: any = { organizationId: session.organizationId }; // Assuming SalarySlip has organizationId, need to check schema. If not, filter by employee's org.
  if (employeeId) where.employeeId = employeeId;

  return prisma.salarySlip.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { month: 'desc' },
  });
}

// Leave Management
export async function getLeaves(employeeId?: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const where: any = {
    status: 'LEAVE',
    employee: { organizationId: session.organizationId }
  };
  if (employeeId) where.employeeId = employeeId;

  return prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      employee: true,
    },
  });
}