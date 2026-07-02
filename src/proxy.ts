import { NextRequest, NextResponse } from 'next/server';

// Next.js 16+ uses "proxy" instead of "middleware"
export async function proxy(request: NextRequest) {
  // Edge runtime does not support Prisma.
  // Tenant resolution is handled via session cookies in src/lib/auth.ts
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
