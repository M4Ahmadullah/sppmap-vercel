import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool-prisma';

export async function POST(request: NextRequest) {
  try {
    // Validate request content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { email } = body;
    
    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Ensure database pool is initialized
    await dbPool.initialize();
    const topoUsersService = dbPool.getTopoUsersService();
    
    // Get the user's current sessions
    const userSessions = await topoUsersService.getTopoUserSessionsByEmail(email.toLowerCase());
    
    console.log(`[Expire Session] Found ${userSessions.length} sessions for ${email}`);
    console.log(`[Expire Session] Sessions:`, userSessions.map(s => ({ 
      id: s.id, 
      email: s.email, 
      isActive: s.isActive,
      sessionStart: s.originalSessionStart,
      sessionEnd: s.originalSessionEnd
    })));
    
    if (userSessions.length === 0) {
      return NextResponse.json({ 
        error: 'No sessions found for user',
        email: email 
      }, { status: 404 });
    }

    // Find the most recent active session
    const activeSessions = userSessions.filter(session => session.isActive !== false);
    
    if (activeSessions.length === 0) {
      return NextResponse.json({ 
        error: 'No active sessions found for user',
        email: email,
        totalSessions: userSessions.length
      }, { status: 404 });
    }

    // Deactivate the most recent active session
    const mostRecentSession = activeSessions[0];
    
    if (!mostRecentSession.id) {
      return NextResponse.json({ 
        error: 'Session ID not found',
        sessionData: { email: mostRecentSession.email, isActive: mostRecentSession.isActive }
      }, { status: 400 });
    }
    
    console.log(`[Expire Session] Deactivating session ${mostRecentSession.id} for ${email}`);
    const success = await topoUsersService.deactivateTopoUserSession(mostRecentSession.id);
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to deactivate session',
        sessionId: mostRecentSession.id,
        email: email
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Session expired for ${email}`,
      sessionId: mostRecentSession.id,
      email: email,
      sessionDetails: {
        sessionStart: mostRecentSession.originalSessionStart,
        sessionEnd: mostRecentSession.originalSessionEnd,
        eventTitle: mostRecentSession.eventTitle
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error expiring session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', errorMessage);
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { error: 'Failed to expire session', details: errorMessage },
      { status: 500 }
    );
  }
}
