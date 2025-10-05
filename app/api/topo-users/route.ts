import { NextRequest, NextResponse } from 'next/server';
import TopoUsersService from '@/lib/topo-users-service';
import { clearTopoUsersCache, getTopoUsersCache, setTopoUsersCache } from '@/lib/topo-users-cache';

const CACHE_DURATION = 30000; // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    const topoUsersService = new TopoUsersService();
    
    // Get query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const activeOnly = url.searchParams.get('active') === 'true';
    const statistics = url.searchParams.get('stats') === 'true';
    const upcoming = url.searchParams.get('upcoming') === 'true';
    const current = url.searchParams.get('current') === 'true';
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (statistics) {
      // Return topo users statistics
      const stats = await topoUsersService.getTopoUsersStatistics();
      return NextResponse.json({
        success: true,
        statistics: stats
      });
    }
    
    if (email) {
      if (current) {
        // Get current active session for user
        const currentSession = await topoUsersService.getCurrentActiveSession(email);
        return NextResponse.json({
          success: true,
          currentSession: currentSession,
          canLogin: !!currentSession
        });
      }
      
      if (upcoming) {
        // Get upcoming sessions for user
        const upcomingSessions = await topoUsersService.getUpcomingSessions(email);
        return NextResponse.json({
          success: true,
          upcomingSessions: upcomingSessions,
          count: upcomingSessions.length
        });
      }
      
      // Get all sessions for specific user
      const userSessions = await topoUsersService.getTopoUserSessionsByEmail(email);
      return NextResponse.json({
        success: true,
        userSessions: userSessions,
        count: userSessions.length
      });
    }
    
    // Check cache for all sessions (only if no email specified and not forcing refresh)
    const cached = getTopoUsersCache();
    if (!email && !forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      const cachedSessions = activeOnly 
        ? cached.data.filter((session: any) => session.isActive)
        : cached.data;
      
      return NextResponse.json({
        success: true,
        sessions: cachedSessions,
        count: cachedSessions.length,
        activeOnly: activeOnly,
        cached: true
      });
    }
    
    // Fetch fresh data from database
    const sessions = activeOnly 
      ? await topoUsersService.getActiveTopoUserSessions()
      : await topoUsersService.getAllTopoUserSessions();
    
    // Update cache
    setTopoUsersCache(sessions, Date.now());
    
    return NextResponse.json({
      success: true,
      sessions: sessions,
      count: sessions.length,
      activeOnly: activeOnly,
      cached: false
    });
    
  } catch (error) {
    console.error('Error fetching topo users:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch topo users',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const topoUsersService = new TopoUsersService();
    const loginCheck = await topoUsersService.canUserLogin(email);
    
    return NextResponse.json({
      success: true,
      ...loginCheck
    });
    
  } catch (error) {
    console.error('Error checking user login:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check user login',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId, clearAll } = await request.json();
    
    const topoUsersService = new TopoUsersService();
    
    if (clearAll) {
      // Clear all sessions (for testing/reset)
      const deletedCount = await topoUsersService.clearAllSessions();
      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount} sessions`,
        deletedCount
      });
    }
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const success = await topoUsersService.deleteTopoUserSession(sessionId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Topo user session deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Topo user session not found' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error deleting topo user session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete topo user session',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, isActive } = await request.json();
    
    if (!sessionId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Session ID and isActive status are required' },
        { status: 400 }
      );
    }
    
    const topoUsersService = new TopoUsersService();
    
    if (isActive) {
      // Reactivate session
      const success = await topoUsersService.deactivateTopoUserSession(sessionId);
      return NextResponse.json({
        success: true,
        message: 'Topo user session reactivated successfully'
      });
    } else {
      // Deactivate session
      const success = await topoUsersService.deactivateTopoUserSession(sessionId);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Topo user session deactivated successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Topo user session not found' },
          { status: 404 }
        );
      }
    }
    
  } catch (error) {
    console.error('Error updating topo user session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update topo user session',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
