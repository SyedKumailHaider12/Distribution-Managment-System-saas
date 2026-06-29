'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { slugify } from '@/util/slugify';

export async function registerOrganization(data: {
  orgName: string;
  adminName: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}) {
  const { orgName, adminName, username, password, phone, email, address, city } = data;
  
  if (!orgName || !adminName || !username || !password || !phone || !email || !address || !city) {
    throw new Error('All fields are required.');
  }

  // Check uniqueness globally
  const existingOrg = await prisma.organization.findUnique({ where: { name: orgName } });
  if (existingOrg) throw new Error(`Organization name "${orgName}" is already taken.`);

  const existingOrgSlug = await prisma.organization.findUnique({ where: { slug: slugify(orgName) } });
  if (existingOrgSlug) throw new Error(`An organization with a similar name already exists.`);

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw new Error(`Username "${username}" is already taken.`);

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new Error(`Email "${email}" is already registered.`);

  try {
    // 1. Create Organization & Default Settings
    const organization = await prisma.organization.create({
      data: { 
        name: orgName, 
        slug: slugify(orgName),
        phone: phone || null,
        email: email || null,
        address: address || null,
        settings: {
          create: {
            companyName: orgName,
            companyContact: adminName,
            companyPhone: phone || '',
            companyEmail: email || '',
            companyAddress: address || '',
            companyCity: city || '',
          }
        }
      },
    });
    console.log('Organization created:', organization.id);

    // 2. Create Admin User
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        username,
        email,
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

    // 5. Create Built-in Walking Customer for Retail POS
    await prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: 'Walking Customer',
        isWalkIn: true,
        type: 'retail',
      },
    });
    console.log('Walking Customer created');

    // 6. Create Default System Roles
    const defaultRoles = ['Admin', 'Manager', 'Cashier', 'Salesman'];
    for (const roleName of defaultRoles) {
      await prisma.employeeRole.create({
        data: {
          organizationId: organization.id,
          name: roleName,
          isSystem: true,
        },
      });
    }
    console.log('Default roles created');

    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
}
