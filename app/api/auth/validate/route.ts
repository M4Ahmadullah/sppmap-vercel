import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-mongodb';
import { SessionTimeManager } from '@/lib/session-time-manager';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    // Verify session token
    const result = await SessionManager.verifySessionToken(token);

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Get current session time information using pre-buffered times
    const sessionTimeInfo = SessionTimeManager.getPreBufferedSessionTimeInfo(
      result.user!.sessionStart,
      result.user!.sessionEnd
    );

    const response = NextResponse.json({
      success: true,
      user: {
        email: result.user!.email,
        name: result.user!.name,
        sessionStart: result.user!.sessionStart,
        sessionEnd: result.user!.sessionEnd,
        routes: result.user!.routes,
        sessionTimeInfo: sessionTimeInfo,
        isAdmin: result.user!.isAdmin || false
      }
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
