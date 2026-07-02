import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SESSION_COOKIE = 'session';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  fullName: string | null;
  organizationId: number;
  permissions?: string[];
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function login(identifier: string, password: string, organizationId: number): Promise<SessionUser | null> {
  // Find user by username OR email within the org
  const user = await prisma.user.findFirst({
    where: {
      organizationId,
      OR: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });

  if (!user || !user.isActive || user.isBlocked) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  let permissions: string[] = [];
  if (user.role === 'admin') {
    permissions = ['*'];
  } else {
    const rp = await prisma.rolePermission.findUnique({
      where: {
        organizationId_role: {
          organizationId,
          role: user.role
        }
      }
    });
    if (rp && rp.modules) {
      try {
        permissions = JSON.parse(rp.modules);
      } catch (e) {
        permissions = [];
      }
    }
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    organizationId: user.organizationId,
    permissions,
    twoFactorEnabled: user.twoFactorEnabled,
    emailVerified: user.emailVerified,
    email: user.email,
  };
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();

  const sessionData = JSON.stringify(user);
  const encoded = Buffer.from(sessionData).toString('base64');

  // secure:true only on production HTTPS — on local network (192.168.x.x) HTTP needs secure:false
  const isProduction = process.env.NODE_ENV === 'production' && !process.env.ALLOW_HTTP_COOKIES;

  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as SessionUser;
    if (!parsed || typeof parsed.organizationId !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    admin: 4,
    manager: 3,
    cashier: 2,
    salesman: 1,
    viewer: 0,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
