import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool-prisma';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Ensure database pool is initialized
    await dbPool.initialize();
    
    const eventsService = dbPool.getEventsService();
    const events = await eventsService.getAllEvents();
    
    const response = NextResponse.json({
      success: true,
      events: events,
      cached: false
    });
    
    // Add no-cache headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch events',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Ensure database pool is initialized
    await dbPool.initialize();
    
    const eventsService = dbPool.getEventsService();
    
    // Delete all events directly using Prisma
    const result = await prisma.event.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} events`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting events:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete events',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
