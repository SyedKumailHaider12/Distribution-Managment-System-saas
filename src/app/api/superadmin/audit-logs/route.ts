import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSASession } from '@/lib/superauth';

export async function GET(request: NextRequest) {
  try {
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
      include: {
        organization: { select: { name: true } },
        user: { select: { username: true, email: true } }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
