import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSASession } from '@/lib/superauth';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sa = await getSASession();
    if (!sa) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get permissions for this user role
    let permissions: string[] = [];
    if (user.role === 'admin') {
      permissions = ['*'];
    } else {
      const rp = await prisma.rolePermission.findUnique({
        where: {
          organizationId_role: {
            organizationId: user.organizationId,
            role: user.role
          }
        }
      });
      if (rp && rp.modules) {
        try {
          permissions = JSON.parse(rp.modules);
        } catch (e) {
          permissions = [];
        }
      }
    }

    // Create standard tenant session (impersonation)
    await createSession({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      organizationId: user.organizationId,
      permissions,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      email: user.email,
    });

    // We can also track that this is an impersonated session if we want to add a flag to the standard session,
    // but for now, they are just logged in as that user.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error impersonating:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
