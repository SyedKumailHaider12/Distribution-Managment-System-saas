import { NextRequest, NextResponse } from 'next/server';
import { login, createSession } from '@/lib/auth';
import { authenticator } from 'otplib';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, organizationId, totpCode } = await request.json();

    if (!identifier || !password || !organizationId) {
      return NextResponse.json(
        { error: 'Organization, username/email, and password are required' },
        { status: 400 }
      );
    }

    // Hard subscription check — block login if trial/subscription expired
    const org = await prisma.organization.findUnique({
      where: { id: parseInt(organizationId) },
      select: { subscriptionStatus: true, trialEndsAt: true, subscriptionEndsAt: true }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();
    if (org.subscriptionStatus === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Your subscription has expired. Please contact your administrator.' },
        { status: 403 }
      );
    }
    if (org.subscriptionStatus === 'TRIAL' && org.trialEndsAt && now > org.trialEndsAt) {
      return NextResponse.json(
        { error: 'Your free trial has ended. Please upgrade your plan to continue.' },
        { status: 403 }
      );
    }
    if (org.subscriptionStatus === 'ACTIVE' && org.subscriptionEndsAt && now > org.subscriptionEndsAt) {
      return NextResponse.json(
        { error: 'Your subscription has ended. Please renew to continue.' },
        { status: 403 }
      );
    }

    const user = await login(identifier, password, parseInt(organizationId));

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