import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (!token) {
      return NextResponse.json({
        error: 'No session token found',
        hasToken: false
      });
    }

    // Decode JWT token without verification to see payload
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      return NextResponse.json({
        success: true,
        hasToken: true,
        payload: {
          email: payload.email,
          name: payload.name,
          isAdmin: payload.isAdmin,
          sessionStart: payload.sessionStart,
          sessionEnd: payload.sessionEnd,
          expiresAt: payload.exp
        }
      });
    } catch (jwtError) {
      return NextResponse.json({
        error: 'Invalid JWT token',
        hasToken: true,
        jwtError: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
    }

  } catch (error) {
    console.error('Debug token error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
