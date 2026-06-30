import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await prisma.user.update({
      where: { id: session.id },
      data: { otpCode, otpExpiry }
    });

    // Send the email
    try {
      await sendEmail(
        user.email,
        'Verify Your Email Address - AzanTech Solutions',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; text-align: center;">Welcome to AzanTech Solutions!</h2>
            <p style="color: #475569; font-size: 16px;">Hello ${user.fullName || 'User'},</p>
            <p style="color: #475569; font-size: 16px;">Thank you for registering. Please verify your email address to continue.</p>
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Your Verification Code</p>
              <h1 style="margin: 10px 0 0; color: #0f172a; font-size: 36px; letter-spacing: 4px;">${otpCode}</h1>
            </div>
            <p style="color: #475569; font-size: 14px;">This code will expire in 30 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">If you did not request this, please ignore this email.</p>
          </div>
        `
      );
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (emailError: any) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json({ error: 'Failed to send email. Check your SMTP settings.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
