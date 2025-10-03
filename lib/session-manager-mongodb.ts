import { SignJWT, jwtVerify } from 'jose';
import { getAllRoutes } from './routes';
import { SessionTimeManager } from './session-time-manager';
import EventsService, { DatabaseEvent } from './events-service';
import AdminService from './admin-service-fallback';
import { dbPool } from './db-pool';

export interface UserSession {
  email: string;
  name: string;
  sessionStart: string;
  sessionEnd: string;
  token: string;
  expiresAt: string;
  routes: string[];
  sessionTimeInfo?: any; // Session time status and display info
  isAdmin?: boolean; // Admin flag
}

export interface SessionValidationResult {
  isValid: boolean;
  user?: UserSession;
  error?: string;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'london2025-secret-key-change-in-production');

// Helper function to convert any time to London timezone
// Cache for timezone offset to avoid repeated calculations
let londonOffsetCache: { offset: number; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

function getLondonOffset(): number {
  const now = Date.now();
  
  // Return cached offset if still valid
  if (londonOffsetCache && (now - londonOffsetCache.timestamp) < CACHE_DURATION) {
    return londonOffsetCache.offset;
  }
  
  // Calculate current London offset
  const utc = new Date(now);
  const london = new Date(utc.toLocaleString("en-US", {timeZone: "Europe/London"}));
  const offset = london.getTime() - utc.getTime();
  
  // Cache the result
  londonOffsetCache = { offset, timestamp: now };
  
  return offset;
}

function convertToLondonTime(dateString: string): Date {
  const date = new Date(dateString);
  const offset = getLondonOffset();
  return new Date(date.getTime() + offset);
}

// Helper function to get current London time
function getCurrentLondonTime(): Date {
  const now = new Date();
  const offset = getLondonOffset();
  return new Date(now.getTime() + offset);
}

export class SessionManager {
  private eventsService: EventsService;
  private adminService: AdminService;

  constructor() {
    this.eventsService = dbPool.getEventsService();
    this.adminService = dbPool.getAdminService();
  }

  // Generate JWT token for user session
  static async generateSessionToken(userSession: Omit<UserSession, 'token'>): Promise<string> {
    const token = await new SignJWT({
      email: userSession.email,
      name: userSession.name,
      sessionStart: userSession.sessionStart,
      sessionEnd: userSession.sessionEnd,
      expiresAt: userSession.expiresAt,
      routes: userSession.routes,
      sessionTimeInfo: userSession.sessionTimeInfo,
      isAdmin: userSession.isAdmin || false
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(new Date(userSession.expiresAt))
      .sign(JWT_SECRET);

    return token;
  }

  // Verify JWT token
  static async verifySessionToken(token: string): Promise<SessionValidationResult> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const user: UserSession = {
        email: payload.email as string,
        name: payload.name as string,
        sessionStart: payload.sessionStart as string,
        sessionEnd: payload.sessionEnd as string,
        token,
        expiresAt: payload.expiresAt as string,
        routes: payload.routes as string[],
        sessionTimeInfo: payload.sessionTimeInfo as any,
        isAdmin: payload.isAdmin as boolean || false
      };

      // Check if session is still within time window (using London time)
      const now = getCurrentLondonTime();
      const sessionStart = convertToLondonTime(user.sessionStart);
      const sessionEnd = convertToLondonTime(user.sessionEnd);

      // For regular users (non-admin), enforce session time window
      if (!user.isAdmin && (now < sessionStart || now > sessionEnd)) {
        return {
          isValid: false,
          error: 'Session time window has expired'
        };
      }

      return {
        isValid: true,
        user
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid or expired token'
      };
    }
  }

  // Create user session from database event
  static async createUserSession(dbEvent: DatabaseEvent): Promise<UserSession> {
    const bufferMinutes = 60; // 1 hour buffer for testing
    const sessionStart = convertToLondonTime(dbEvent.sessionStart);
    const sessionEnd = convertToLondonTime(dbEvent.sessionEnd);

    // Add buffer time
    sessionStart.setMinutes(sessionStart.getMinutes() - bufferMinutes);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + bufferMinutes);

    const userSession: Omit<UserSession, 'token'> = {
      email: dbEvent.email,
      name: dbEvent.name,
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEnd.toISOString(),
      expiresAt: sessionEnd.toISOString(),
      routes: SessionManager.getAvailableRoutes()
    };

    const token = await SessionManager.generateSessionToken(userSession);

    return {
      ...userSession,
      token
    };
  }

  // Get available routes based on session type - only newtopo routes
  static getAvailableRoutes(): string[] {
    // Get all routes from the routes configuration
    const allRoutes = getAllRoutes();
    // Return only the route IDs for newtopo (not prevtopo)
    return allRoutes.map(route => route.id);
  }

  // Validate user credentials and create session using MongoDB
  async validateAndCreateSession(email: string, password: string): Promise<SessionValidationResult> {
    try {
      // Ensure database pool is initialized
      await dbPool.initialize();
      
      // First, check if this is an admin user
      const adminResult = await this.adminService.authenticateAdmin(email, password);
      
      if (adminResult.success && adminResult.admin) {
        // Create admin session
        const adminSession: Omit<UserSession, 'token'> = {
          email: adminResult.admin.email,
          name: adminResult.admin.name,
          sessionStart: new Date().toISOString(),
          sessionEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          routes: SessionManager.getAvailableRoutes(),
          isAdmin: true
        };

        const token = await SessionManager.generateSessionToken(adminSession);
        const userSession = { ...adminSession, token };

        return {
          isValid: true,
          user: userSession
        };
      }

      // If not admin, check for regular user with london2025 password
      if (password !== 'london2025') {
        return {
          isValid: false,
          error: 'Invalid password'
        };
      }

      // For regular users, get their active session from MongoDB
      const activeEvent = await this.eventsService.getUserActiveSession(email);

      if (!activeEvent) {
        return {
          isValid: false,
          error: 'No active session found for this email'
        };
      }

      // Get session time information (with proper 15-minute buffer)
      const sessionTimeInfo = SessionTimeManager.getSessionTimeInfo(
        activeEvent.sessionStart,
        activeEvent.sessionEnd
      );
      
      console.log('Session time validation:', {
        status: sessionTimeInfo.status,
        hasMapAccess: sessionTimeInfo.hasMapAccess,
        message: sessionTimeInfo.display.message
      });

      // RESTRICT USER LOGIN TO SESSION TIME WINDOW ONLY
      // Users can only login during their session time window (±15 minutes)
      if (sessionTimeInfo.status === 'expired') {
        return {
          isValid: false,
          error: 'Your session time window has expired. Please login during your scheduled session time.'
        };
      }

      // Users cannot login before their session window starts (15 minutes before session)
      if (sessionTimeInfo.status === 'waiting') {
        return {
          isValid: false,
          error: 'Your session has not started yet. Please login 15 minutes before your scheduled session time.'
        };
      }

      // Create user session
      const userSession = await SessionManager.createUserSession(activeEvent);
      
      // Add session time information to user session
      userSession.sessionTimeInfo = sessionTimeInfo;

      return {
        isValid: true,
        user: userSession
      };
    } catch (error) {
      console.error('Session validation error:', error instanceof Error ? error.message : String(error));
      return {
        isValid: false,
        error: `Failed to validate session: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Export helper functions for use in other modules
export { convertToLondonTime, getCurrentLondonTime };
