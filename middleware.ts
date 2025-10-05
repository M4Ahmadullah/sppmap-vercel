import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { SessionTimeManager } from '@/lib/session-time-manager';

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

  console.log(`[Middleware] Processing request to: ${pathname}`);
  console.log(`[Middleware] Session token present: ${!!sessionToken}`);

  if (sessionToken) {
    try {
      // Verify JWT token using jose (Edge Runtime compatible)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
      const { payload } = await jwtVerify(sessionToken, secret);

      console.log(`[Middleware] JWT verification successful for: ${payload.email}`);

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log(`[Middleware] Token expired for: ${payload.email}`);
        // Token expired, clear it
        const response = NextResponse.next();
        response.cookies.set('session-token', '', { expires: new Date(0) });
        return response;
      }

      isAuthenticated = true;
      userPayload = payload;

      // For regular users (non-admin), check if they're still within their session time window
      if (!payload.isAdmin && payload.sessionStart && payload.sessionEnd) {
        const sessionTimeInfo = SessionTimeManager.getSessionTimeInfo(
          payload.sessionStart as string,
          payload.sessionEnd as string
        );
        
        // If session has expired, force logout
        if (sessionTimeInfo.status === 'expired') {
          const response = NextResponse.redirect(new URL('/login', request.url));
          response.cookies.set('session-token', '', { expires: new Date(0) });
          return response;
        }
      }
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
    console.log(`[Middleware] User authenticated: ${userPayload?.email}`);
    // User is logged in
    if (pathname === '/login' || pathname === '/admin-signup') {
      console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`);
      // Redirect authenticated users away from login/signup pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    console.log(`[Middleware] Allowing access to protected route: ${pathname}`);
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
    console.log(`[Middleware] User not authenticated`);
    // User is not logged in
    const publicPaths = ['/login', '/admin-signup', '/'];
    if (publicPaths.includes(pathname)) {
      console.log(`[Middleware] Allowing access to public route: ${pathname}`);
      // Allow access to public pages
      return NextResponse.next();
    }
    
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
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
