import { NextRequest, NextResponse } from 'next/server';
export async function middleware(request: NextRequest) {
  // Edge runtime does not support Prisma. 
  // Tenant resolution is handled via session cookies in src/lib/auth.ts
  return NextResponse.next();
}

/**
 * Apply the middleware to all routes.
 */
export const config = {
  matcher: '/:path*',
};
