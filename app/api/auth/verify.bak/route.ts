import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({
        isValid: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    // Verify the session token
    const result = await SessionManager.verifySessionToken(token);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({
      isValid: false,
      error: 'Failed to verify session'
    }, { status: 500 });
  }
}
