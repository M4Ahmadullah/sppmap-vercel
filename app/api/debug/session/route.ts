import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (!token) {
      return NextResponse.json({
        error: 'No session token found',
        hasToken: false
      });
    }

    // Verify session token
    const result = await SessionManager.verifySessionToken(token);

    if (!result.isValid) {
      return NextResponse.json({
        error: result.error,
        hasToken: true,
        isValid: false
      });
    }

    return NextResponse.json({
      success: true,
      hasToken: true,
      isValid: true,
      user: {
        email: result.user!.email,
        name: result.user!.name,
        isAdmin: result.user!.isAdmin,
        sessionStart: result.user!.sessionStart,
        sessionEnd: result.user!.sessionEnd
      }
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
