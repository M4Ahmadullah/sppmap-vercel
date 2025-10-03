import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

        // Validate credentials and create session
        const sessionManager = new SessionManager();
        const result = await sessionManager.validateAndCreateSession(email, password);

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Create response with session token
    const response = NextResponse.json({
      success: true,
      user: {
        email: result.user!.email,
        name: result.user!.name,
        sessionStart: result.user!.sessionStart,
        sessionEnd: result.user!.sessionEnd,
        routes: result.user!.routes,
        sessionTimeInfo: result.user!.sessionTimeInfo,
        isAdmin: result.user!.isAdmin || false
      }
    });

    // Set HTTP-only cookie with session token
    response.cookies.set('session-token', result.user!.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(result.user!.expiresAt)
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
