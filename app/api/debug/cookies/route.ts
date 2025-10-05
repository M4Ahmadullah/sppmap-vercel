import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();
    const sessionToken = request.cookies.get('session-token');
    
    return NextResponse.json({
      success: true,
      cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
      sessionToken: sessionToken ? {
        name: sessionToken.name,
        value: sessionToken.value.substring(0, 20) + '...',
        hasValue: !!sessionToken.value
      } : null,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'host': request.headers.get('host'),
        'origin': request.headers.get('origin'),
        'referer': request.headers.get('referer')
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testCookie } = await request.json();
    
    const response = NextResponse.json({
      success: true,
      message: 'Test cookie set',
      testCookie
    });
    
    // Set a test cookie
    response.cookies.set('test-cookie', testCookie || 'test-value', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
