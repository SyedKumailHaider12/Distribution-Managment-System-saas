import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const orgs = await prisma.organization.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' }
    },
    select: { id: true, name: true },
    take: 6,
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(orgs);
}
