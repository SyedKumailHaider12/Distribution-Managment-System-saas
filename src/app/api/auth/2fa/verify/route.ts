import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import { logActivity } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not setup correctly' }, { status: 400 });
    }

    const isValid = authenticator.check(token, user.twoFactorSecret);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    await logActivity({
      action: 'ENABLE_2FA',
      details: 'User enabled Two-Factor Authentication',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
