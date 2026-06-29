import { NextRequest, NextResponse } from 'next/server';
import { login, createSession } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { authenticator } from 'otplib';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password, organizationId, totpCode } = await request.json();

    if (!username || !password || !organizationId) {
      return NextResponse.json(
        { error: 'Organization, username, and password are required' },
        { status: 400 }
      );
    }

    const user = await login(username, password, parseInt(organizationId));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or account disabled' },
        { status: 401 }
      );
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return NextResponse.json({ success: true, requires2FA: true });
      }

      // Verify TOTP
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser?.twoFactorSecret) {
        const isValid = authenticator.check(totpCode, dbUser.twoFactorSecret);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
        }
      }
    }

    await createSession(user);

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'LOGIN',
          details: 'User logged in successfully',
        }
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}