import { getEmployees, getLeaves, getSalarySlips } from './actions';

import { EmployeesClient } from './EmployeesClient';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { checkPermission } from '@/lib/authorization';

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const hasAccess = await checkPermission('people');

  let employees: any[] = [];
  let roles: any[] = [];
  let salarySlips: any[] = [];
  let attendances: any[] = [];

  if (hasAccess) {
    employees = await getEmployees();
    roles = await prisma.employeeRole.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { name: 'asc' },
    });
    salarySlips = await getSalarySlips();
    
    // Fetch recent attendance for the whole org
    attendances = await prisma.attendance.findMany({
      where: { employee: { organizationId: session.organizationId } },
      include: { employee: true, manager: true },
      orderBy: { date: 'desc' },
      take: 500,
    });
  }

  return (
    <EmployeesClient 
      initialEmployees={employees} 
      availableRoles={roles} 
      initialAttendances={attendances}
      initialSalarySlips={salarySlips}
      hasAccess={hasAccess}
    />
  );
}