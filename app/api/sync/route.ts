import { NextRequest, NextResponse } from 'next/server';
import EventsService from '@/lib/events-service';
import TopoUsersService from '@/lib/topo-users-service';
import { initializeDatabase } from '@/lib/db-init';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { ObjectId } from 'mongodb';
import { clearTopoUsersCache } from '@/lib/topo-users-cache';

// Check if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// TeamUp API configuration
const TEAMUP_CONFIG = {
  calendarId: 'o4wjfg',
  baseUrl: 'https://teamup.com',
  email: process.env.TEAMUP_EMAIL || 'ahmadullahm4masoudy@gmail.com',
  password: process.env.TEAMUP_PASSWORD || 'm416ahmadullah'
};

// Fallback function to get TeamUp data without browser automation
async function getTeamUpDataFallback(startDate: string, endDate: string): Promise<any[]> {
  console.log('Using fallback method - direct API call without authentication');
  
  // Try to get data without authentication (public calendar)
  const url = `https://teamup.com/api/v1/events/${TEAMUP_CONFIG.calendarId}?startDate=${startDate}&endDate=${endDate}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Fallback API call successful, found', data.events?.length || 0, 'events');
      return data.events || [];
    } else {
      console.log('Fallback API call failed with status:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Fallback API call error:', error);
    return [];
  }
}

// Function to get valid TeamUp cookies using Puppeteer
async function getValidTeamUpCookies(): Promise<string> {
  let browser;
  try {
    console.log('Starting Puppeteer login to TeamUp...');
    console.log('Environment:', isProduction ? 'Production (Vercel)' : 'Development');
    
    // Configure Puppeteer based on environment
    const launchOptions: any = {
      headless: true,
      timeout: 30000
    };
    
    if (isProduction) {
      // Production (Vercel) configuration
      launchOptions.args = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-animations',
        '--disable-background-timer-throttling',
        '--disable-restore-session-state',
        '--disable-web-security',
        '--single-process',
      ];
      launchOptions.executablePath = await chromium.executablePath();
    } else {
      // Development configuration - use system Chrome/Chromium
      launchOptions.args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ];
      // Try to find Chrome/Chromium on the system
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      ];
      
      for (const path of possiblePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(path)) {
            launchOptions.executablePath = path;
            console.log('Found Chrome/Chromium at:', path);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!launchOptions.executablePath) {
        console.log('No Chrome/Chromium found, trying fallback method...');
        throw new Error('No Chrome/Chromium executable found in development');
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
    
    console.log('Navigating to TeamUp login page...');
    await page.goto(`${TEAMUP_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Filling email...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', TEAMUP_CONFIG.email);
    await page.click('button[type="submit"]');
    
    console.log('Waiting for password form...');
    await page.waitForSelector('input[name="_password"]', { timeout: 10000 });
    
    console.log('Filling password...');
    await page.type('input[name="_password"]', TEAMUP_CONFIG.password);
    await page.click('button[name="submit_btn"]');
    
    console.log('Waiting for login...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
    
    console.log('Login successful! Getting cookies...');
    const cookies = await page.cookies();
    const cookieString = cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ');
    
    console.log('Successfully obtained cookies:', cookieString.substring(0, 100) + '...');
    return cookieString;
    
  } catch (error) {
    console.error('Puppeteer login error:', error);
    if (error instanceof Error && (error.message.includes('Could not find Chrome') || error.message.includes('Executable doesn\'t exist'))) {
      throw new Error(`Puppeteer browser not installed in production environment. Please ensure Chrome/Chromium is available. Original error: ${error.message}`);
    }
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
  
  console.log('Extracting email from notes:', notes);
  
  // First try to find email in the specific format: ◇ Email: email@domain.com
  const emailLabelRegex = /◇\s*Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailLabelMatch = notes.match(emailLabelRegex);
  
  if (emailLabelMatch) {
    const email = emailLabelMatch[1];
    console.log('✅ Extracted email from label:', email);
    return email;
  }
  
  // Look for email patterns in the notes HTML - handle both mailto links and plain text
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = notes.match(emailRegex);
  
  if (matches && matches.length > 0) {
    // Return the first email found (should be the user's email)
    const email = matches[0];
    console.log('✅ Extracted email:', email);
    return email;
  }
  
  // Also try to extract from mailto links specifically
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const mailtoMatches = notes.match(mailtoRegex);
  
  if (mailtoMatches && mailtoMatches.length > 0) {
    const email = mailtoMatches[0].replace('mailto:', '');
    console.log('✅ Extracted email from mailto:', email);
    return email;
  }
  
  console.log('❌ No email found in notes');
  return null;
}

// Main function to fetch TeamUp events via API
async function getTeamUpEvents(startDate: string, endDate: string): Promise<any[]> {
  const url = `${TEAMUP_CONFIG.baseUrl}/${TEAMUP_CONFIG.calendarId}/events?startDate=${startDate}&endDate=${endDate}&tz=Europe%2FLondon`;
  
  console.log('Fetching TeamUp events from:', url);
  
  try {
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
    
    // If Puppeteer fails, try fallback method
    console.log('Puppeteer method failed, trying fallback...');
    try {
      const fallbackEvents = await getTeamUpDataFallback(startDate, endDate);
      if (fallbackEvents.length > 0) {
        console.log('Fallback method successful, found', fallbackEvents.length, 'events');
        return fallbackEvents;
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
    }
    
    throw error;
  }
  } catch (error) {
    console.error('Outer try block error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Function to convert date to London timezone and keep it as London timezone
function convertToLondonTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Convert to London timezone using proper method
  const londonStr = date.toLocaleString("sv-SE", {timeZone: "Europe/London"});
  const londonTime = new Date(londonStr);
  
  // Create a new date with London timezone info
  const year = londonTime.getFullYear();
  const month = String(londonTime.getMonth() + 1).padStart(2, '0');
  const day = String(londonTime.getDate()).padStart(2, '0');
  const hours = String(londonTime.getHours()).padStart(2, '0');
  const minutes = String(londonTime.getMinutes()).padStart(2, '0');
  const seconds = String(londonTime.getSeconds()).padStart(2, '0');
  
  // Return as London timezone (BST/GMT)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+01:00`;
}

// Function to extract TOPO sessions from events
function extractTopoSessions(events: any[]): any[] {
  const topoSessions: any[] = [];
  
  events.forEach(event => {
    // Check if event title contains "topo" (case insensitive)
    if (event.title?.toLowerCase().includes('topo')) {
      console.log('=== PROCESSING EVENT ===');
      console.log('Title:', event.title);
      console.log('Who:', event.who);
      console.log('Full notes length:', event.notes?.length || 0);
      console.log('Full notes:', event.notes);
      
      // Extract email from notes field
      const email = extractEmailFromNotes(event.notes || '');
      
      if (email) {
        topoSessions.push({
          ...event,
          email: email,
          name: event.who || 'Unknown',
          // Convert dates to London timezone
          start_dt: event.start_dt ? convertToLondonTime(event.start_dt) : event.start_dt,
          end_dt: event.end_dt ? convertToLondonTime(event.end_dt) : event.end_dt,
          start: event.start ? convertToLondonTime(event.start) : event.start,
          end: event.end ? convertToLondonTime(event.end) : event.end
        });
        console.log(`✅ Extracted session: ${event.who} (${email})`);
      } else {
        console.log(`❌ No email found for event: ${event.title} - ${event.who}`);
        console.log('Notes content:', event.notes);
      }
      console.log('=== END EVENT ===\n');
    }
  });
  
  return topoSessions;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database sync...');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      TEAMUP_EMAIL: process.env.TEAMUP_EMAIL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    });
    
    const eventsService = new EventsService();
    const topoUsersService = new TopoUsersService();
    
    // Step 1: Delete events from yesterday and earlier (preserve today)
    const today = getCurrentLondonTime();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    const deletedCount = await eventsService.deleteOldEvents(yesterdayStr);
    console.log(`Deleted ${deletedCount} old events`);
    
    // Step 2: Fetch events from TeamUp for current week only
    const { startDate, endDate } = getCurrentWeek();
    console.log(`Fetching TeamUp events for current week: ${startDate} to ${endDate}`);
    
    const teamUpEvents = await getTeamUpEvents(startDate, endDate);
    const topoSessions = extractTopoSessions(teamUpEvents);
    
    console.log(`Found ${topoSessions.length} TOPO sessions from TeamUp`);
    
    // Step 3: Delete ALL events from database to ensure exact sync with TeamUp
    const allEvents = await eventsService.getAllEvents();
    let deletedAllCount = 0;
    
    if (allEvents.length > 0) {
      console.log(`Deleting ALL ${allEvents.length} events from database for complete sync`);
      for (const event of allEvents) {
        if (event._id) {
          try {
            const success = await eventsService.deleteEvent(event._id);
            if (success) {
              deletedAllCount++;
              console.log(`Deleted event: ${event.title} (${event._id})`);
            } else {
              console.log(`Failed to delete event: ${event.title} (${event._id})`);
            }
          } catch (error) {
            console.error(`Error deleting event ${event._id}:`, error);
          }
        }
      }
    }
    
    // Step 4: Clear all existing topo_users records to prevent duplicates
    console.log('Clearing all existing topo_users records...');
    const clearedTopoUsers = await topoUsersService.clearAllSessions();
    console.log(`Cleared ${clearedTopoUsers} existing topo_users records`);
    
    // Step 5: Store each session in topo_users table with ±15 minute buffer
    console.log(`Storing ${topoSessions.length} sessions in topo_users table...`);
    for (const session of topoSessions) {
      if (session.email && session.name && session.start_dt && session.end_dt) {
        await topoUsersService.addTopoUserSession(
          session.email,
          session.name,
          session.start_dt,
          session.end_dt,
          session.title,
          session.eventDate || new Date(session.start_dt).toISOString().split('T')[0]
        );
      }
    }
    
    // Step 6: Save ALL TeamUp events (complete replacement)
    console.log(`Adding all ${topoSessions.length} events from TeamUp (complete sync)`);
    
    // Debug: Log each event being saved
    topoSessions.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title} - ${event.who} - Email: ${event.email}`);
      console.log(`Notes preview: ${event.notes?.substring(0, 200)}...`);
    });
    
    const { saved, skipped } = await eventsService.saveEvents(topoSessions);
    
    // Step 7: Get final count
    const finalEvents = await eventsService.getAllEvents();
    
    // Step 8: Clear topo users cache to ensure fresh data
    clearTopoUsersCache();
    
    return NextResponse.json({
      success: true,
      message: 'Database sync completed successfully',
      summary: {
        deletedOldEvents: deletedCount,
        deletedAllEvents: deletedAllCount,
        clearedTopoUsers: clearedTopoUsers,
        fetchedFromTeamUp: topoSessions.length,
        eventsAdded: saved,
        eventsSkipped: skipped,
        totalEventsInDB: finalEvents.length
      },
      details: {
        syncDate: today.toISOString(),
        dateRange: { startDate, endDate },
        syncType: 'complete_replacement'
      }
    });
    
  } catch (error) {
    console.error('Database sync error:', error);
    
    let errorMessage = 'Database sync failed';
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out')) {
        errorMessage = 'MongoDB connection timeout. Please check your network connection and MongoDB Atlas settings.';
      } else if (error.message.includes('MONGODB_URI')) {
        errorMessage = 'MongoDB connection string not configured. Please check environment variables.';
      } else {
        errorMessage = `Sync failed: ${error.message}`;
      }
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is a request for raw TeamUp data
    const url = new URL(request.url);
    const rawTeamUp = url.searchParams.get('raw');
    
    if (rawTeamUp === 'true') {
      // Fetch raw TeamUp data without syncing to database
      const { startDate, endDate } = getCurrentWeek();
      console.log(`Fetching raw TeamUp events for: ${startDate} to ${endDate}`);
      
      const teamUpEvents = await getTeamUpEvents(startDate, endDate);
      const topoSessions = extractTopoSessions(teamUpEvents);
      
      return NextResponse.json({
        success: true,
        message: 'Raw TeamUp data fetched successfully',
        data: {
          dateRange: { startDate, endDate },
          totalEvents: teamUpEvents.length,
          topoSessions: topoSessions.length,
          rawEvents: teamUpEvents,
          processedTopoSessions: topoSessions
        }
      });
    }
    
    // Original database statistics endpoint
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
