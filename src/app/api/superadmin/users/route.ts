import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSASession } from '@/lib/superauth';

export async function GET(request: NextRequest) {
  try {
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = request.nextUrl.searchParams.get('orgId');

    const users = await prisma.user.findMany({
      where: orgId ? { organizationId: parseInt(orgId) } : undefined,
      orderBy: { id: 'desc' },
      include: {
        organization: {
          select: { name: true }
        }
      }
    });

    // Exclude password hashes
    const sanitizedUsers = users.map(u => {
      const { passwordHash, twoFactorSecret, ...rest } = u;
      return rest;
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
