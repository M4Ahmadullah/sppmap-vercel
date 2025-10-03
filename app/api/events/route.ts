import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool';

// Cache for events data
let eventsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // Check cache first
    if (eventsCache && (now - eventsCache.timestamp) < CACHE_DURATION) {
      const response = NextResponse.json({
        success: true,
        events: eventsCache.data,
        cached: true
      });
      
      // Add caching headers
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
      
      return response;
    }
    
    // Ensure database pool is initialized
    await dbPool.initialize();
    
    const eventsService = dbPool.getEventsService();
    const events = await eventsService.getAllEvents();
    
    // Cache the result
    eventsCache = { data: events, timestamp: now };
    
    const response = NextResponse.json({
      success: true,
      events: events,
      cached: false
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
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
