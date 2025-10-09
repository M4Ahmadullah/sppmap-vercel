import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log(`[Login Test] Testing login for: ${email}`);
    
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password required'
      }, { status: 400 });
    }

    const sessionManager = new SessionManager();
    const result = await sessionManager.validateAndCreateSession(email, password);
    
    console.log(`[Login Test] Result:`, {
      isValid: result.isValid,
      error: result.error,
      hasUser: !!result.user
    });

    if (result.isValid && result.user) {
      // Return the token in the response body for testing
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: result.user.token,
        user: {
          email: result.user.email,
          name: result.user.name,
          isAdmin: result.user.isAdmin
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Login failed'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('[Login Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
