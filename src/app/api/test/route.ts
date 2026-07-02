import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify API routes work from network IP
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const userAgent = request.headers.get('user-agent');

  return NextResponse.json({
    success: true,
    message: 'API routes are working from network IP!',
    origin,
    host,
    userAgent: userAgent?.substring(0, 100),
    timestamp: new Date().toISOString(),
  });
}
