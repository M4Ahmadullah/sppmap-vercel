import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool-prisma';

export async function GET(request: NextRequest) {
  try {
    await dbPool.initialize();
    const topoUsersService = dbPool.getTopoUsersService();
    
    // Get all topo users
    const allUsers = await topoUsersService.getAllTopoUsers();
    
    // Get current London time
    const now = new Date();
    const londonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    
    return NextResponse.json({
      success: true,
      currentLondonTime: londonTime.toISOString(),
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        sessionStart: user.originalSessionStart,
        sessionEnd: user.originalSessionEnd,
        originalSessionStart: user.originalSessionStart,
        originalSessionEnd: user.originalSessionEnd,
        eventDate: user.eventDate,
        eventTitle: user.eventTitle,
        isActive: user.isActive
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
