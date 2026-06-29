'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requirePermissionForAction } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';

export async function getEmployees() {
  const session = await requirePermissionForAction('people');
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
  const session = await requirePermissionForAction('people');
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
  username?: string;
  password?: string;
  joinDate?: Date;
}) {
  const session = await requirePermissionForAction('people');

  const { name, employeeCode, role, phone, baseSalary, branchId, username, password } = data;
  const organizationId = session.organizationId;

  const branchExists = await prisma.branch.findUnique({ 
    where: { id: branchId, organizationId } 
  });
  if (!branchExists) {
    throw new Error(`Branch with ID ${branchId} does not exist in your organization.`);
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      employeeCode,
      role,
      phone,
      baseSalary: baseSalary || 0,
      joinDate: data.joinDate || new Date(),
      branchId,
      organizationId,
    },
  });

  // Create user account if username/password provided
  if (username && password) {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId,
        username,
        email: `${username}@azantech.com`,
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
        organizationId,
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
  joinDate?: Date;
}) {
  const session = await requirePermissionForAction('people');

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
  const session = await requirePermissionForAction('people');

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
  const session = await requirePermissionForAction('people');

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
  const session = await requirePermissionForAction('people');

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
  const session = await requirePermissionForAction('people');

  const where: any = { employee: { organizationId: session.organizationId } }; 
  if (employeeId) where.employeeId = employeeId;

  return prisma.salarySlip.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { month: 'desc' },
  });
}

export async function markSalaryPaid(slipId: number) {
  const session = await requirePermissionForAction('people');

  // Verify slip belongs to an employee in this org
  const slip = await prisma.salarySlip.findUnique({
    where: { id: slipId },
    include: { employee: true }
  });

  if (!slip || slip.employee.organizationId !== session.organizationId) {
    throw new Error('Salary slip not found or unauthorized');
  }

  const updated = await prisma.salarySlip.update({
    where: { id: slipId },
    data: {
      status: 'PAID',
      paidDate: new Date(),
    }
  });

  revalidatePath('/employees');
  return updated;
}

// Leave Management
export async function getLeaves(employeeId?: number) {
  const session = await requirePermissionForAction('people');
  
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