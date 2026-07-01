import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSASession } from '@/lib/superauth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(rawId);
    const body = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: body.isBlocked
      }
    });

    return NextResponse.json({ success: true, isBlocked: updatedUser.isBlocked });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
