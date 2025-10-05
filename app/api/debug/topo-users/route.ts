import { NextRequest, NextResponse } from 'next/server';
import TopoUsersService from '@/lib/topo-users-service';

export async function GET(request: NextRequest) {
  try {
    const topoUsersService = new TopoUsersService();
    
    // Get all topo users
    const allUsers = await topoUsersService.getAllTopoUserSessions();
    
    // Get current London time
    const now = new Date();
    const londonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    
    return NextResponse.json({
      success: true,
      currentLondonTime: londonTime.toISOString(),
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        email: user.email,
        name: user.name,
        sessionStart: user.sessionStart,
        sessionEnd: user.sessionEnd,
        originalSessionStart: user.originalSessionStart,
        originalSessionEnd: user.originalSessionEnd,
        eventDate: user.eventDate,
        eventTitle: user.eventTitle
      }))
    });
  } catch (error) {
    console.error('[Debug Topo Users] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
