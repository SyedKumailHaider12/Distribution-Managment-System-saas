import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SA_COOKIE = 'sa_session';

export interface SuperAdminSession {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifySuperAdminLogin(identifier: string, password: string): Promise<SuperAdminSession | null> {
  const envUser = process.env.SUPERADMIN_USERNAME;
  const envPass = process.env.SUPERADMIN_PASSWORD;

  if (!envUser || !envPass) {
    console.error('SuperAdmin credentials not configured in .env');
    return null;
  }

  // Check if identifier matches the .env username (or a predefined email if you set one)
  if (identifier !== envUser) {
    return null;
  }

  // Compare plaintext password directly against .env password
  if (password !== envPass) {
    return null;
  }

  return { 
    id: 0, 
    username: envUser, 
    email: 'admin@system.local', 
    fullName: 'System Administrator' 
  };
}

export async function createSASession(sa: SuperAdminSession): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(sa)).toString('base64');
  cookieStore.set(SA_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
}

export async function getSASession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SA_COOKIE);
  if (!cookie?.value) return null;
  try {
    return JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function destroySASession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SA_COOKIE);
}
