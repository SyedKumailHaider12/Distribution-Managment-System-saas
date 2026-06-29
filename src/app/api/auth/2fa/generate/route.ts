import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.username, 'ZafarMedicalSaaS', secret);

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Save secret temporarily in db without enabling
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret }
    });

    return NextResponse.json({ secret, qrCodeUrl: qrCodeDataUrl });
  } catch (error) {
    console.error('Error generating 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
