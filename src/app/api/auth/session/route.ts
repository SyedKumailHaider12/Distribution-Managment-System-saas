import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Always fetch fresh emailVerified from DB to avoid stale cookie values
    const [org, dbUser] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { subscriptionStatus: true, trialEndsAt: true, subscriptionEndsAt: true }
      }),
      prisma.user.findUnique({
        where: { id: session.id },
        select: { emailVerified: true, email: true }
      })
    ]);

    return NextResponse.json({ 
      user: {
        ...session,
        email: dbUser?.email ?? session.email,
        emailVerified: dbUser?.emailVerified ?? session.emailVerified,
        subscriptionStatus: org?.subscriptionStatus || 'TRIAL',
        trialEndsAt: org?.trialEndsAt,
        subscriptionEndsAt: org?.subscriptionEndsAt
      } 
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}