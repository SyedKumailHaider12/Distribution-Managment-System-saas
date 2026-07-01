import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSASession } from '@/lib/superauth';

export async function GET(request: NextRequest) {
  try {
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, branches: true }
        }
      }
    });

    return NextResponse.json(orgs);
  } catch (error) {
    console.error('Error fetching orgs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
