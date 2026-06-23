'use server';

import { prisma } from '@/lib/prisma';
import { requirePermissionForAction } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';

export async function getEmployeeRoles() {
  const session = await requirePermissionForAction('settings');
  
  return prisma.employeeRole.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function createEmployeeRole(name: string) {
  const session = await requirePermissionForAction('settings');
  
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
  const session = await requirePermissionForAction('settings');
  
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

export async function getRolePermissions() {
  const session = await requirePermissionForAction('settings');

  return prisma.rolePermission.findMany({
    where: { organizationId: session.organizationId },
  });
}

export async function updateRolePermissions(roleName: string, modules: string[]) {
  const session = await requirePermissionForAction('settings');
  
  if (roleName.toLowerCase() === 'admin') {
    throw new Error('Admin role permissions cannot be modified');
  }

  const rolePermission = await prisma.rolePermission.upsert({
    where: {
      organizationId_role: {
        organizationId: session.organizationId,
        role: roleName,
      }
    },
    update: {
      modules: JSON.stringify(modules)
    },
    create: {
      organizationId: session.organizationId,
      role: roleName,
      modules: JSON.stringify(modules)
    }
  });

  revalidatePath('/settings');
  return rolePermission;
}
