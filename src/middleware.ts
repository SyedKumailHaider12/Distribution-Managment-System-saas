import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Edge runtime does not support Prisma. 
  // Tenant resolution is handled via session cookies in src/lib/auth.ts
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
