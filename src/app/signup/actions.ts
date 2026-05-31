'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { slugify } from '@/util/slugify';

export async function registerOrganization(data: {
  orgName: string;
  adminName: string;
  username: string;
  password: string;
}) {
  const { orgName, adminName, username, password } = data;
  console.log('Registering Organization:', orgName);

  try {
    // 1. Create Organization
    const organization = await prisma.organization.create({
      data: { name: orgName, slug: slugify(orgName) },
    });
    console.log('Organization created:', organization.id);

    // 2. Create Admin User
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        username,
        passwordHash,
        role: 'admin',
        fullName: adminName,
      },
    });
    console.log('User created:', user.id);

    // 3. Create Default Branch
    const branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        organizationId: organization.id,
      },
    });
    console.log('Branch created:', branch.id);

    // 4. Create Admin Employee record
    const employee = await prisma.employee.create({
      data: {
        organizationId: organization.id,
        branchId: branch.id,
        userId: user.id,
        employeeCode: `ADM-${Date.now().toString().slice(-4)}`,
        name: adminName,
        role: 'Admin',
      },
    });
    console.log('Employee created:', employee.id);

    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
}
