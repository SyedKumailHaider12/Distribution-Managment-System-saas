import { NextResponse } from 'next/server';
import { getSASession, destroySASession } from '@/lib/superauth';

export async function GET() {
  const sa = await getSASession();
  if (!sa) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: sa });
}

export async function DELETE() {
  await destroySASession();
  return NextResponse.json({ success: true });
}
