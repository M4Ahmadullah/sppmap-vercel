import { NextRequest, NextResponse } from 'next/server';
import EventsService from '@/lib/events-service';
import { initializeDatabase } from '@/lib/db-init';
import puppeteer from 'puppeteer';

// TeamUp API configuration
const TEAMUP_CONFIG = {
  calendarId: 'o4wjfg',
  baseUrl: 'https://teamup.com',
  email: process.env.TEAMUP_EMAIL || 'ahmadullahm4masoudy@gmail.com',
  password: process.env.TEAMUP_PASSWORD || 'm416ahmadullah'
};

// Function to get valid TeamUp cookies using Puppeteer
async function getValidTeamUpCookies(): Promise<string> {
  let browser;
  try {
    console.log('Starting Puppeteer login to TeamUp...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
    
    console.log('Navigating to TeamUp login page...');
    
    // Navigate to login page
    await page.goto(`${TEAMUP_CONFIG.baseUrl}/login`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Login page loaded, filling email...');
    
    // Fill email field
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', TEAMUP_CONFIG.email);
    
    // Click continue button
    await page.click('button[type="submit"]');
    
    console.log('Email submitted, waiting for password form...');
    
    // Wait for password form to appear
    await page.waitForSelector('input[name="_password"]', { timeout: 10000 });
    
    console.log('Password form loaded, filling password...');
    
    // Fill password field
    await page.type('input[name="_password"]', TEAMUP_CONFIG.password);
    
    // Click login button
    await page.click('button[name="submit_btn"]');
    
    console.log('Password submitted, waiting for redirect...');
    
    // Wait for navigation to complete (should redirect to dashboard)
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check if login was successful (should be on dashboard or user area)
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
    
    console.log('Login successful! Getting cookies...');
    
    // Get cookies from the page
    const cookies = await page.cookies();
    
    // Convert cookies to string format
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    console.log('Successfully obtained cookies:', cookieString.substring(0, 100) + '...');
    
    return cookieString;
    
  } catch (error) {
    console.error('Puppeteer login error:', error);
    throw new Error(`Failed to authenticate with TeamUp using Puppeteer: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Helper function to get current London time
function getCurrentLondonTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/London"}));
}

// Helper function to format dates
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper function to get current week (Monday to Sunday)
function getCurrentWeek(): { startDate: string; endDate: string } {
  const now = getCurrentLondonTime();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday)
  };
}

// Function to extract email from notes field
function extractEmailFromNotes(notes: string): string | null {
  if (!notes) return null;
  
  // Look for email patterns in the notes HTML
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = notes.match(emailRegex);
  return match ? match[0] : null;
}

// Main function to fetch TeamUp events via API
async function getTeamUpEvents(startDate: string, endDate: string): Promise<any[]> {
  const url = `${TEAMUP_CONFIG.baseUrl}/${TEAMUP_CONFIG.calendarId}/events?startDate=${startDate}&endDate=${endDate}&tz=Europe%2FLondon`;
  
  console.log('Fetching TeamUp events from:', url);
  
  // Always get fresh cookies for each request - no reuse
  console.log('Getting fresh cookies for this request...');
  const cookies = await getValidTeamUpCookies();
  console.log('Using fresh cookies:', cookies.substring(0, 100) + '...');
  
  const headers = {
    'accept': 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'x-requested-with': 'XMLHttpRequest',
    'cookie': cookies,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'referer': `https://teamup.com/c/${TEAMUP_CONFIG.calendarId}/lessons`,
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
  };

  console.log('Request headers:', JSON.stringify(headers, null, 2));

  try {
    const response = await fetch(url, { headers });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const responseText = await response.text();
      console.log('Error response body:', responseText);
      throw new Error(`TeamUp API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('TeamUp API raw response:', JSON.stringify(data, null, 2));
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.events && Array.isArray(data.events)) {
      return data.events;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.log('Unexpected response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching TeamUp events:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Function to extract TOPO sessions from events
function extractTopoSessions(events: any[]): any[] {
  const topoSessions: any[] = [];
  
  events.forEach(event => {
    // Check if event title contains "topo" (case insensitive)
    if (event.title?.toLowerCase().includes('topo')) {
      console.log('Found TOPO event:', event.title);
      console.log('Event who field:', event.who);
      console.log('Event notes:', event.notes);
      
      // Extract email from notes field
      const email = extractEmailFromNotes(event.notes || '');
      
      if (email) {
        topoSessions.push({
          ...event,
          email: email,
          name: event.who || 'Unknown'
        });
        console.log(`Extracted session: ${event.who} (${email})`);
      } else {
        console.log('No email found for event:', event.title);
      }
    }
  });
  
  return topoSessions;
}

export async function POST(request: NextRequest) {
  try {
    const eventsService = new EventsService();
    
    console.log('Starting database sync...');
    
    // Step 1: Delete events from yesterday and earlier (preserve today)
    const today = getCurrentLondonTime();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    const deletedCount = await eventsService.deleteOldEvents(yesterdayStr);
    console.log(`Deleted ${deletedCount} old events`);
    
    // Step 2: Get today's events to preserve them
    const todayEvents = await eventsService.getTodayEvents();
    console.log(`Found ${todayEvents.length} events for today (preserved)`);
    
    // Step 3: Get upcoming events to avoid duplicates
    const upcomingEvents = await eventsService.getUpcomingEvents();
    console.log(`Found ${upcomingEvents.length} existing upcoming events`);
    
    // Step 4: Fetch new events from TeamUp for current week only
    const { startDate, endDate } = getCurrentWeek();
    console.log(`Fetching TeamUp events for current week: ${startDate} to ${endDate}`);
    
    const teamUpEvents = await getTeamUpEvents(startDate, endDate);
    const topoSessions = extractTopoSessions(teamUpEvents);
    
    console.log(`Found ${topoSessions.length} TOPO sessions from TeamUp`);
    
    // Step 5: Filter out existing events to avoid duplicates
    const existingEventKeys = new Set([
      ...todayEvents.map(e => `${e.title}-${e.eventDate}-${e.email}`),
      ...upcomingEvents.map(e => `${e.title}-${e.eventDate}-${e.email}`)
    ]);
    
    const newEvents = topoSessions.filter(event => {
      const eventDate = new Date(event.start_dt || event.start).toISOString().split('T')[0];
      const key = `${event.title}-${eventDate}-${event.email}`;
      return !existingEventKeys.has(key);
    });
    
    console.log(`Adding ${newEvents.length} new events (${topoSessions.length - newEvents.length} duplicates skipped)`);
    
    // Step 6: Save new events to database
    const { saved, skipped } = await eventsService.saveEvents(newEvents);
    
    // Step 7: Get final count
    const allEvents = await eventsService.getAllTopoEvents();
    
    return NextResponse.json({
      success: true,
      message: 'Database sync completed successfully',
      summary: {
        deletedOldEvents: deletedCount,
        preservedTodayEvents: todayEvents.length,
        existingUpcomingEvents: upcomingEvents.length,
        fetchedFromTeamUp: topoSessions.length,
        newEventsAdded: saved,
        eventsSkipped: skipped,
        totalEventsInDB: allEvents.length
      },
      details: {
        syncDate: today.toISOString(),
        dateRange: { startDate, endDate },
        duplicatesSkipped: topoSessions.length - newEvents.length
      }
    });
    
  } catch (error) {
    console.error('Database sync error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database sync failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const eventsService = new EventsService();
    
    // Get database statistics
    const allEvents = await eventsService.getAllTopoEvents();
    const todayEvents = await eventsService.getTodayEvents();
    const upcomingEvents = await eventsService.getUpcomingEvents();
    
    // Group by date
    const eventsByDate = allEvents.reduce((acc, event) => {
      const date = event.eventDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      success: true,
      statistics: {
        totalEvents: allEvents.length,
        todayEvents: todayEvents.length,
        upcomingEvents: upcomingEvents.length,
        eventsByDate: Object.keys(eventsByDate).map(date => ({
          date,
          count: eventsByDate[date].length,
          events: eventsByDate[date].map(e => ({
            title: e.title,
            email: e.email,
            name: e.name,
            time: e.sessionStart
          }))
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting sync statistics:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get sync statistics',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
