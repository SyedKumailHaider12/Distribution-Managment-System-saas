'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmployeeRoles() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.employeeRole.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function createEmployeeRole(name: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const role = await prisma.employeeRole.create({
    data: {
      organizationId: session.organizationId,
      name,
      isSystem: false,
    },
  });
  
  revalidatePath('/settings');
  return role;
}

export async function deleteEmployeeRole(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const role = await prisma.employeeRole.findUnique({
    where: { id, organizationId: session.organizationId },
  });
  
  if (!role) throw new Error('Role not found');
  if (role.isSystem) throw new Error('Cannot delete system roles');
  
  await prisma.employeeRole.delete({
    where: { id },
  });
  
  revalidatePath('/settings');
  return { success: true };
}
