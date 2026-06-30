import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp } = await request.json();
    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email is already verified' });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return NextResponse.json({ error: 'No OTP generated for this user. Please request a new one.' }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (user.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Verify success
    await prisma.user.update({
      where: { id: session.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiry: null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify Email Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
