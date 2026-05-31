import { NextRequest, NextResponse } from 'next/server';
import { login, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, organizationId } = await request.json();

    if (!username || !password || !organizationId) {
      return NextResponse.json(
        { error: 'Organization, username, and password are required' },
        { status: 400 }
      );
    }

    const user = await login(username, password, parseInt(organizationId));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or account disabled' },
        { status: 401 }
      );
    }

    await createSession(user);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}