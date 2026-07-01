import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminLogin, createSASession } from '@/lib/superauth';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    const sa = await verifySuperAdminLogin(identifier, password);
    if (!sa) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSASession(sa);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SA login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
