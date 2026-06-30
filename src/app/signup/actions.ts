'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { slugify } from '@/util/slugify';
import { sendEmail } from '@/lib/mailer';

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
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        username,
        email,
        passwordHash,
        role: 'admin',
        fullName: adminName,
        otpCode,
        otpExpiry,
        emailVerified: false,
      },
    });
    console.log('User created:', user.id);

    // Send OTP Email
    try {
      await sendEmail(
        email,
        'Verify Your Email Address - AzanTech Solutions',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; text-align: center;">Welcome to AzanTech Solutions!</h2>
            <p style="color: #475569; font-size: 16px;">Hello ${adminName},</p>
            <p style="color: #475569; font-size: 16px;">Thank you for registering your organization <strong>${orgName}</strong>. Please verify your email address to continue.</p>
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Your Verification Code</p>
              <h1 style="margin: 10px 0 0; color: #0f172a; font-size: 36px; letter-spacing: 4px;">${otpCode}</h1>
            </div>
            <p style="color: #475569; font-size: 14px;">This code will expire in 30 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">If you did not request this, please ignore this email.</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // We don't fail the registration if email fails, but they might need to request a new OTP later
    }

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
