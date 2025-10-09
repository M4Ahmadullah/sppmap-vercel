import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log(`[Login Debug] Testing login for: ${email}`);
    
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password required',
        debug: {
          email: !!email,
          password: !!password
        }
      }, { status: 400 });
    }

    // Test database connection
    const sessionManager = new SessionManager();
    
    console.log(`[Login Debug] Starting validation for: ${email}`);
    const result = await sessionManager.validateAndCreateSession(email, password);
    
    console.log(`[Login Debug] Validation result:`, {
      isValid: result.isValid,
      error: result.error,
      hasUser: !!result.user,
      userEmail: result.user?.email,
      isAdmin: result.user?.isAdmin
    });

    return NextResponse.json({
      success: result.isValid,
      error: result.error,
      debug: {
        isValid: result.isValid,
        hasUser: !!result.user,
        userEmail: result.user?.email,
        isAdmin: result.user?.isAdmin,
        sessionStart: result.user?.sessionStart,
        sessionEnd: result.user?.sessionEnd,
        hasToken: !!result.user?.token,
        tokenLength: result.user?.token?.length || 0
      }
    });
  } catch (error) {
    console.error('[Login Debug] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}
