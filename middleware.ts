import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow access to API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for our custom session token
  const sessionToken = request.cookies.get('session-token')?.value;
  let isAuthenticated = false;
  let userPayload = null;

  if (sessionToken) {
    try {
      // Verify JWT token using jose (Edge Runtime compatible)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
      const { payload } = await jwtVerify(sessionToken, secret);

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token expired, clear it
        const response = NextResponse.next();
        response.cookies.set('session-token', '', { expires: new Date(0) });
        return response;
      }

      isAuthenticated = true;
      userPayload = payload;
    } catch (error) {
      console.error('Middleware JWT verification error:', error);
      // Clear invalid token
      const response = NextResponse.next();
      response.cookies.set('session-token', '', { expires: new Date(0) });
      return response;
    }
  }

  // Handle redirects based on authentication status and path
  if (isAuthenticated) {
    // User is logged in
    if (pathname === '/login' || pathname === '/admin-signup') {
      // Redirect authenticated users away from login/signup pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Add user info to headers for protected routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-email', userPayload?.email as string || '');
    requestHeaders.set('x-user-name', userPayload?.name as string || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } else {
    // User is not logged in
    const publicPaths = ['/login', '/admin-signup', '/'];
    if (publicPaths.includes(pathname)) {
      // Allow access to public pages
      return NextResponse.next();
    }
    
    // Redirect to login for protected routes
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
