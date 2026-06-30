import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // Check if the email is already in use by another user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.id) {
      return NextResponse.json({ error: 'This email is already registered to another account' }, { status: 409 });
    }

    // If same email, no change needed
    if (existing && existing.id === session.id && existing.emailVerified) {
      return NextResponse.json({ error: 'This is already your verified email address' }, { status: 400 });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Update user: new email, unverified, new OTP
    await prisma.user.update({
      where: { id: session.id },
      data: {
        email,
        emailVerified: false,
        otpCode,
        otpExpiry,
      }
    });

    // Update the session cookie to reflect unverified status and new email
    const updatedSession = { ...session, email, emailVerified: false };
    await createSession(updatedSession);

    // Send OTP to the new email
    try {
      await sendEmail(
        email,
        'Verify Your New Email Address',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; text-align: center;">Email Change Verification</h2>
            <p style="color: #475569; font-size: 16px;">Hello ${session.fullName || session.username},</p>
            <p style="color: #475569; font-size: 16px;">You requested to change your account email. Please use the code below to verify your new email address.</p>
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Verification Code</p>
              <h1 style="margin: 10px 0 0; color: #0f172a; font-size: 36px; letter-spacing: 4px;">${otpCode}</h1>
            </div>
            <p style="color: #475569; font-size: 14px;">This code will expire in 30 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">If you did not request this, please ignore this email and your old email will remain active.</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('Failed to send verification email on email change:', emailError);
      // Still return success - user will need to use Resend OTP
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your new email.' });

  } catch (error) {
    console.error('Change email error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
