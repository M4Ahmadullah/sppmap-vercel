import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-prisma';
import { SessionTimeManager } from '@/lib/session-time-manager';
import { dbPool } from '@/lib/db-pool-prisma';

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

    // For non-admin users, check if their session is still active in the database
    if (!result.user!.isAdmin) {
      try {
        await dbPool.initialize();
        const topoUsersService = dbPool.getTopoUsersService();
        
        // Get the user's sessions from database
        const userSessions = await topoUsersService.getTopoUserSessionsByEmail(result.user!.email.toLowerCase());
        
        // Check if any session is still active (prioritize time-based check over database flag)
        const hasActiveSession = userSessions.some(session => {
          // Check time-based session status with buffer first
          const sessionTimeInfo = SessionTimeManager.getPreBufferedSessionTimeInfo(
            session.originalSessionStart,
            session.originalSessionEnd
          );
          
          // If time-based check says active, allow it regardless of database flag
          if (sessionTimeInfo.status === 'active') {
            return true;
          }
          
          // If time-based check says expired, respect database flag
          if (sessionTimeInfo.status === 'expired' && session.isActive === false) {
            return false;
          }
          
          // For waiting status, respect database flag
          return session.isActive !== false;
        });
        
        if (!hasActiveSession) {
          return NextResponse.json(
            { error: 'Session has been deactivated' },
            { status: 401 }
          );
        }
        
      } catch (error) {
        console.error('Error checking session status in database:', error);
        // On error, allow the session to continue (fail open)
      }
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
