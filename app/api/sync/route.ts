import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool-prisma';
import { initializeDatabase } from '@/lib/db-init';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
    
    await page.goto(`${TEAMUP_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', TEAMUP_CONFIG.email);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('input[name="_password"]', { timeout: 10000 });
    
    await page.type('input[name="_password"]', TEAMUP_CONFIG.password);
    await page.click('button[name="submit_btn"]');
    
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    } catch (navError) {
      // Continue even if navigation times out
    }
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
    
    const cookies = await page.cookies();
    const cookieString = cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ');
    
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
    }
  }
}

// Helper function to get current London time - ALWAYS London time regardless of server location
function getCurrentLondonTime(): Date {
  const now = new Date();
  // Force London timezone conversion - get the actual London date/time
  const londonTimeString = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
  // Create a new Date object from the London time string
  const londonTime = new Date(londonTimeString);
  return londonTime;
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

// Helper function to get date range from today to next 7 days - ALWAYS London time
function getExtendedWeekRange(): { startDate: string; endDate: string } {
  // Get current London time
  const now = new Date();
  const londonTimeString = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
  
  // Extract the date part directly from London time string (YYYY-MM-DD)
  const todayStr = londonTimeString.split(' ')[0]; // "2025-10-09"
  
  // Create end date by adding 7 days to today - using London time
  const todayDate = new Date(todayStr + 'T00:00:00+01:00'); // London timezone
  const endDate = new Date(todayDate);
  endDate.setDate(todayDate.getDate() + 7);
  
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`📅 London Date Range: ${todayStr} to ${endDateStr} (TODAY + 7 days only)`);
  console.log(`🕐 Current London Time: ${londonTimeString}`);
  console.log(`📅 Today's London Date: ${todayStr}`);
  
  return {
    startDate: todayStr,
    endDate: endDateStr
  };
}

// Function to extract email from notes field - improved logic with debugging
function extractEmailFromNotes(notes: string): string | null {
  if (!notes) return null;

  // Look for patterns like "Email: user@gmail.com" or "email: user@gmail.com"
  const emailPatterns = [
    /email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /e-mail:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /E-mail:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  ];

  for (const pattern of emailPatterns) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase().trim();
    }
  }

  // Handle malformed HTML where email is split across tags (e.g., "john<a href="mailto:...">@gmail.com</a>")
  const malformedEmailRegex = /email:\s*([a-zA-Z0-9._%+-]+)<a[^>]*href="mailto:[^"]*"[^>]*>@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<\/a>/i;
  const malformedMatch = notes.match(malformedEmailRegex);

  if (malformedMatch) {
    const fullEmail = malformedMatch[1] + '@' + malformedMatch[2];
    return fullEmail.toLowerCase().trim();
  }

  // Look for email in HTML link display text (not href) - PRIORITIZE THIS
  const linkTextRegex = /<a[^>]*href="mailto:[^"]*"[^>]*>([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<\/a>/i;
  const linkTextMatch = notes.match(linkTextRegex);

  if (linkTextMatch) {
    return linkTextMatch[1].toLowerCase().trim();
  }

  // Fallback: look for any email in the text (but avoid mailto hrefs)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = notes.match(emailRegex);

  if (matches && matches.length > 0) {
    // Filter out emails that are in mailto hrefs
    const filteredMatches = matches.filter(email => {
      const mailtoIndex = notes.indexOf(`mailto:${email}`);
      const emailIndex = notes.indexOf(email);
      return mailtoIndex === -1 || emailIndex < mailtoIndex;
    });

    if (filteredMatches.length > 0) {
      return filteredMatches[0].toLowerCase().trim();
    }
  }

  return null;
}

// Main function to fetch TeamUp events via API
async function getTeamUpEvents(startDate: string, endDate: string): Promise<any[]> {
  const url = `${TEAMUP_CONFIG.baseUrl}/${TEAMUP_CONFIG.calendarId}/events?startDate=${startDate}&endDate=${endDate}&tz=Europe%2FLondon`;
  
  
  try {
    // Always get fresh cookies for each request - no reuse
    let cookies;
    try {
      cookies = await getValidTeamUpCookies();
    } catch (cookieError) {
      throw new Error('Puppeteer authentication failed');
    }
    
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


  try {
    const response = await fetch(url, { headers });
    
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`TeamUp API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
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
    try {
      const fallbackEvents = await getTeamUpDataFallback(startDate, endDate);
      if (fallbackEvents.length > 0) {
        return fallbackEvents;
      } else {
        return [];
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      return [];
    }
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
      // Extract email from notes field
      const email = extractEmailFromNotes(event.notes || '');
      
      if (email) {
        const sessionStart = event.start_dt ? convertToLondonTime(event.start_dt) : event.start_dt;
        const sessionEnd = event.end_dt ? convertToLondonTime(event.end_dt) : event.end_dt;
        const eventDate = sessionStart ? new Date(sessionStart).toISOString().split('T')[0] : undefined;
        
        topoSessions.push({
          ...event,
          email: email,
          name: event.who || 'Unknown',
          eventTitle: event.title,
          eventDate: eventDate,
          sessionStart: sessionStart,
          sessionEnd: sessionEnd,
          start_dt: sessionStart,
          end_dt: sessionEnd,
          start: event.start ? convertToLondonTime(event.start) : event.start,
          end: event.end ? convertToLondonTime(event.end) : event.end
        });
      }
    }
  });
  
  return topoSessions;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sync starting...');
    
    await dbPool.initialize();
    const eventsService = dbPool.getEventsService();
    const topoUsersService = dbPool.getTopoUsersService();
    
    // Step 1: Delete ALL events from yesterday and earlier (only keep today and future)
    const now = new Date();
    const londonTimeString = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    const todayStr = londonTimeString.split(' ')[0]; // Extract date directly
    
    const deletedCount = await eventsService.deleteOldEvents(todayStr);
    
    // Also delete any events that might have wrong dates
    const allEvents = await eventsService.getAllEvents();
    let additionalDeleted = 0;
    for (const event of allEvents) {
      const eventDate = new Date(event.eventDate);
      const todayDate = new Date(todayStr);
      if (eventDate < todayDate) {
        await eventsService.deleteEvent(event.id);
        additionalDeleted++;
      }
    }
    
    // Step 2: Clear only past topo users (keep today and future sessions)
    const allTopoUsers = await topoUsersService.getAllTopoUsers();
    let clearedPastUsers = 0;
    
    for (const user of allTopoUsers) {
      const userEventDate = new Date(user.eventDate);
      const todayDate = new Date(todayStr);
      
      // Only delete users from yesterday and earlier
      if (userEventDate < todayDate) {
        await topoUsersService.deleteTopoUserSession(user.id);
        clearedPastUsers++;
      }
    }
    
    // Step 3: Remove duplicate events before smart sync
    const allEventsForDedup = await eventsService.getAllEvents();
    const uniqueEvents = new Map();
    let duplicatesRemoved = 0;
    
    for (const event of allEventsForDedup) {
      const uniqueKey = `${event.email}-${event.eventDate}-${event.sessionStart}-${event.sessionEnd}`;
      if (uniqueEvents.has(uniqueKey)) {
        // Remove duplicate
        await eventsService.deleteEvent(event.id);
        duplicatesRemoved++;
      } else {
        uniqueEvents.set(uniqueKey, event);
      }
    }
    
    // Step 4: Fetch events from TeamUp for today and next 7 days
    const { startDate, endDate } = getExtendedWeekRange();
    
    let teamUpEvents;
    try {
      teamUpEvents = await getTeamUpEvents(startDate, endDate);
    } catch (error) {
      teamUpEvents = await getTeamUpDataFallback(startDate, endDate);
      if (teamUpEvents.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Sync completed with no events found',
          data: {
            syncDate: new Date().toISOString(),
            dateRange: { startDate, endDate },
            totalEvents: 0,
            topoSessions: 0,
            eventsSaved: 0,
            eventsSkipped: 0,
            usersCreated: 0
          }
        });
      }
    }
    
    const topoSessions = extractTopoSessions(teamUpEvents);
    
    // Pretty print of fetched data
    console.log('\n📊 FETCHED DATA SUMMARY:');
    console.log('='.repeat(50));
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log(`📋 Total TeamUp Events: ${teamUpEvents.length}`);
    console.log(`🎯 TOPO Sessions Found: ${topoSessions.length}`);
    
    if (topoSessions.length > 0) {
      console.log('\n👥 TOPO Sessions Details:');
      topoSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.name} (${session.email})`);
        console.log(`     📅 Date: ${session.eventDate}`);
        console.log(`     ⏰ Time: ${session.sessionStart} - ${session.sessionEnd}`);
        console.log(`     📝 Title: ${session.eventTitle}`);
      });
    }
    console.log('='.repeat(50));
    
    // Step 5: Smart sync - only update/add new sessions, don't disturb existing ones
    const existingTopoUsers = await topoUsersService.getAllTopoUsers();
    const existingUsersMap = new Map();
    existingTopoUsers.forEach(user => {
      existingUsersMap.set(`${user.email}-${user.eventDate}-${user.originalSessionStart}-${user.originalSessionEnd}`, user);
    });
    
    let newSessionsCount = 0;
    let updatedSessionsCount = 0;
    let skippedSessionsCount = 0;
    
    for (const session of topoSessions) {
      if (session.email && session.name && session.start_dt && session.end_dt) {
        const sessionKey = `${session.email}-${session.eventDate || new Date(session.start_dt).toISOString().split('T')[0]}-${session.start_dt}-${session.end_dt}`;
        const existingUser = existingUsersMap.get(sessionKey);
        
        if (existingUser) {
          // Check if session details have changed
          const hasChanges = 
            existingUser.originalSessionStart !== session.start_dt ||
            existingUser.originalSessionEnd !== session.end_dt ||
            existingUser.eventTitle !== session.title ||
            existingUser.name !== session.name;
            
          if (hasChanges) {
            // Update existing session
            await topoUsersService.addTopoUserSessionUpsert(
              session.email,
              session.name,
              session.start_dt,
              session.end_dt,
              session.title,
              session.eventDate || new Date(session.start_dt).toISOString().split('T')[0]
            );
            updatedSessionsCount++;
          } else {
            skippedSessionsCount++;
          }
        } else {
          // Add new session
          await topoUsersService.addTopoUserSession(
            session.email,
            session.name,
            session.start_dt,
            session.end_dt,
            session.title,
            session.eventDate || new Date(session.start_dt).toISOString().split('T')[0]
          );
          newSessionsCount++;
        }
      }
    }
    
    // Step 5.5: Remove users who no longer exist in TeamUp
    const teamUpSessionKeys = new Set(topoSessions.map(session => 
      `${session.email}-${session.eventDate || new Date(session.start_dt).toISOString().split('T')[0]}-${session.start_dt}-${session.end_dt}`
    ));
    const currentUsers = await topoUsersService.getAllTopoUsers();
    let removedUsersCount = 0;
    
    for (const user of currentUsers) {
      // Only remove users from today onwards (not past users)
      const userDate = new Date(user.eventDate);
      const todayDate = new Date(todayStr);
      
      if (userDate >= todayDate) {
        const userSessionKey = `${user.email}-${user.eventDate}-${user.originalSessionStart}-${user.originalSessionEnd}`;
        if (!teamUpSessionKeys.has(userSessionKey)) {
          await topoUsersService.deleteTopoUserSession(user.id);
          removedUsersCount++;
        }
      }
    }
    
    if (removedUsersCount > 0) {
      console.log(`✅ Removed ${removedUsersCount} users no longer in TeamUp`);
    }
    
    // Step 6: Save events (smart sync - only add new/updated events)
    const existingEvents = await eventsService.getAllEvents();
    const existingEventsMap = new Map();
    existingEvents.forEach(event => {
      existingEventsMap.set(`${event.email}-${event.eventDate}-${event.sessionStart}-${event.sessionEnd}`, event);
    });
    
    let newEventsCount = 0;
    let updatedEventsCount = 0;
    let skippedEventsCount = 0;
    
    for (const event of topoSessions) {
      if (event.email && event.title) {
        const eventKey = `${event.email}-${event.eventDate || new Date(event.start_dt).toISOString().split('T')[0]}-${event.start_dt}-${event.end_dt}`;
        const existingEvent = existingEventsMap.get(eventKey);
        
        if (!existingEvent) {
          // Add new event
          await eventsService.saveEvents([event]);
          newEventsCount++;
        } else {
          // Check if event has changes
          const hasChanges = 
            existingEvent.eventTitle !== event.title ||
            existingEvent.sessionStart !== event.start_dt ||
            existingEvent.sessionEnd !== event.end_dt;
            
          if (hasChanges) {
            // Update existing event
            await eventsService.saveEvents([event]);
            updatedEventsCount++;
          } else {
            skippedEventsCount++;
          }
        }
      }
    }
    
    // Step 6.5: Remove events that no longer exist in TeamUp
    const teamUpEventKeys = new Set(topoSessions.map(event => 
      `${event.email}-${event.eventDate || new Date(event.start_dt).toISOString().split('T')[0]}-${event.start_dt}-${event.end_dt}`
    ));
    const currentEvents = await eventsService.getAllEvents();
    let removedEventsCount = 0;
    
    for (const event of currentEvents) {
      // Only remove events from today onwards (not past events)
      const eventDate = new Date(event.eventDate);
      const todayDate = new Date(todayStr);
      
      if (eventDate >= todayDate) {
        const eventKey = `${event.email}-${event.eventDate}-${event.sessionStart}-${event.sessionEnd}`;
        if (!teamUpEventKeys.has(eventKey)) {
          await eventsService.deleteEvent(event.id);
          removedEventsCount++;
        }
      }
    }
    
    if (removedEventsCount > 0) {
      console.log(`✅ Removed ${removedEventsCount} events no longer in TeamUp`);
    }
    
    
    // Step 7: Get final count and show pretty summary
    const finalEvents = await eventsService.getAllEvents();
    const finalTopoUsers = await topoUsersService.getAllTopoUsers();
    
    // Pretty print final data
    console.log(`\n🎉 SYNC COMPLETE!`);
    console.log(`📊 Results: ${finalEvents.length} events, ${finalTopoUsers.length} users`);
    console.log(`📅 Range: ${startDate} to ${endDate}`);
    console.log(`⏰ London Time: ${londonTimeString}`);
    
    if (finalTopoUsers.length > 0) {
      console.log('\n👥 Sessions:');
      finalTopoUsers.forEach((user, index) => {
        const sessionStart = new Date(user.originalSessionStart).toLocaleString('en-GB', { 
          timeZone: 'Europe/London',
          hour: '2-digit',
          minute: '2-digit'
        });
        const sessionEnd = new Date(user.originalSessionEnd).toLocaleString('en-GB', { 
          timeZone: 'Europe/London',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${sessionStart}-${sessionEnd}`);
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Smart sync completed successfully',
      summary: {
        deletedOldEvents: deletedCount + additionalDeleted,
        clearedPastUsers: clearedPastUsers,
        duplicatesRemoved: duplicatesRemoved,
        newSessions: newSessionsCount,
        updatedSessions: updatedSessionsCount,
        skippedSessions: skippedSessionsCount,
        removedUsers: removedUsersCount,
        newEvents: newEventsCount,
        updatedEvents: updatedEventsCount,
        skippedEvents: skippedEventsCount,
        removedEvents: removedEventsCount,
        totalEventsInDB: finalEvents.length,
        totalUsersInDB: finalTopoUsers.length
      },
      details: {
        syncDate: new Date().toISOString(),
        dateRange: { startDate, endDate },
        syncType: 'smart_sync'
      }
    });
    
  } catch (error) {
    console.error('Database sync error:', error);
    
    let errorMessage = 'Database sync failed';
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out') || error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Database connection timeout. Please check your network connection and Supabase settings.';
      } else if (error.message.includes('DATABASE_URL')) {
        errorMessage = 'Database connection string not configured. Please check environment variables.';
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
      const { startDate, endDate } = getExtendedWeekRange();
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
    await dbPool.initialize();
    const eventsService = dbPool.getEventsService();
    
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

