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

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { subscriptionStatus: true, trialEndsAt: true, subscriptionEndsAt: true }
    });

    return NextResponse.json({ 
      user: {
        ...session,
        subscriptionStatus: org?.subscriptionStatus || 'TRIAL',
        trialEndsAt: org?.trialEndsAt,
        subscriptionEndsAt: org?.subscriptionEndsAt
      } 
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}