import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log(`[Login API] Login attempt for email: ${email}`);

    if (!email || !password) {
      console.log(`[Login API] Missing credentials - email: ${!!email}, password: ${!!password}`);
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials and create session
    const sessionManager = new SessionManager();
    console.log(`[Login API] Starting session validation for: ${email}`);
    
    const result = await sessionManager.validateAndCreateSession(email, password);
    
    console.log(`[Login API] Session validation result:`, {
      isValid: result.isValid,
      error: result.error,
      userEmail: result.user?.email,
      isAdmin: result.user?.isAdmin
    });

    if (!result.isValid) {
      console.log(`[Login API] Login failed for ${email}: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    console.log(`[Login API] Login successful for ${email}, creating response...`);
    console.log(`[Login API] User token:`, result.user!.token ? 'Token exists' : 'Token is missing');
    console.log(`[Login API] Token length:`, result.user!.token?.length || 0);

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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Always secure in production
      sameSite: 'lax' as const,
      expires: new Date(result.user!.expiresAt),
      path: '/'
      // Remove domain completely - let browser handle it automatically
    };
    
    console.log(`[Login API] Setting cookie with options:`, cookieOptions);
    
    response.cookies.set('session-token', result.user!.token, cookieOptions);
    
    console.log(`[Login API] Login completed successfully for ${email}`);
    return response;
  } catch (error) {
    console.error('[Login API] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
