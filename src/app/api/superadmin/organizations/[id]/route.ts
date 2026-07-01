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

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        subscriptionStatus: body.subscriptionStatus,
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : null,
        subscriptionEndsAt: body.subscriptionEndsAt ? new Date(body.subscriptionEndsAt) : null,
        subscriptionFee: body.subscriptionFee ? parseFloat(body.subscriptionFee) : null,
        paymentStatus: body.paymentStatus,
      }
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('Error updating org:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(rawId);
    await prisma.organization.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting org:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
