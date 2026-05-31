import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });
  return NextResponse.json(orgs);
}
