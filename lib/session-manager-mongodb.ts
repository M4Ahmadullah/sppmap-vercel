import { SignJWT, jwtVerify } from 'jose';
import { getAllRoutes } from './routes';
import { SessionTimeManager } from './session-time-manager';
import EventsService, { DatabaseEvent } from './events-service';
import AdminService from './admin-service-fallback';
import TopoUsersService from './topo-users-service';
import { TopoUser } from './mongodb-manager';
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
  private topoUsersService: TopoUsersService;

  constructor() {
    this.eventsService = dbPool.getEventsService();
    this.adminService = dbPool.getAdminService();
    this.topoUsersService = new TopoUsersService();
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

      // For regular users, recalculate session time info to ensure it's current
      if (!user.isAdmin) {
        // Fetch the latest session times from database to ensure we have current data
        try {
          await dbPool.initialize();
          const topoUsersService = new TopoUsersService();
          const userSessions = await topoUsersService.getTopoUserSessionsByEmail(user.email.toLowerCase());
          const activeSessions = userSessions.filter(session => session.isActive !== false);
          
          if (activeSessions.length > 0) {
            // Use the most recent active session times
            const latestSession = activeSessions[0];
            user.sessionStart = latestSession.sessionStart;
            user.sessionEnd = latestSession.sessionEnd;
          }
        } catch (error) {
          console.error('[SessionManager] Error fetching latest session times:', error);
          // Continue with cached times if database fetch fails
        }
        
        const sessionTimeInfo = SessionTimeManager.getPreBufferedSessionTimeInfo(
          user.sessionStart,
          user.sessionEnd
        );
        
        // Check if session is still within time window
        if (sessionTimeInfo.status === 'expired') {
          return {
            isValid: false,
            error: 'Your session time window has expired. Please login during your scheduled session time.'
          };
        }

        if (sessionTimeInfo.status === 'waiting') {
          return {
            isValid: false,
            error: 'Your session has not started yet. Please login 15 minutes before your scheduled session time.'
          };
        }

        // Update the sessionTimeInfo with current data
        user.sessionTimeInfo = sessionTimeInfo;
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
  static async createUserSession(topoUser: TopoUser): Promise<UserSession> {
    
    const userSession: Omit<UserSession, 'token'> = {
      email: topoUser.email,
      name: topoUser.name,
      sessionStart: topoUser.sessionStart,
      sessionEnd: topoUser.sessionEnd,
      expiresAt: topoUser.sessionEnd,
      routes: SessionManager.getAvailableRoutes()
    };


    const token = await SessionManager.generateSessionToken(userSession);

    const result = {
      ...userSession,
      token
    };
    

    return result;
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
        console.log(`[SessionManager] Invalid password for regular user: ${email}`);
        return {
          isValid: false,
          error: 'Invalid password'
        };
      }

      
      // For regular users, check if they can login based on topo_users table
      const loginCheck = await this.topoUsersService.canUserLogin(email);
      

      if (!loginCheck.canLogin) {
        console.log(`[SessionManager] User cannot login: ${loginCheck.reason}`);
        return {
          isValid: false,
          error: loginCheck.reason || 'No active session found for this email'
        };
      }

      const activeSession = loginCheck.session!;

      // Get session time information (times are already buffered in topo_users table)
      const sessionTimeInfo = SessionTimeManager.getPreBufferedSessionTimeInfo(
        activeSession.sessionStart,
        activeSession.sessionEnd
      );
      

      // RESTRICT USER LOGIN TO SESSION TIME WINDOW ONLY
      // Users can only login during their session time window (±15 minutes)
      if (sessionTimeInfo.status === 'expired') {
        console.log(`[SessionManager] Session expired for: ${email}`);
        return {
          isValid: false,
          error: 'Your session time window has expired. Please login during your scheduled session time.'
        };
      }

      // Users cannot login before their session window starts (15 minutes before session)
      if (sessionTimeInfo.status === 'waiting') {
        console.log(`[SessionManager] Session not started yet for: ${email}`);
        return {
          isValid: false,
          error: 'Your session has not started yet. Please login 15 minutes before your scheduled session time.'
        };
      }

      
      // Create user session
      const userSession = await SessionManager.createUserSession(activeSession);
      
      // Add session time information to user session
      userSession.sessionTimeInfo = sessionTimeInfo;

      return {
        isValid: true,
        user: userSession
      };
    } catch (error) {
      console.error('[SessionManager] Session validation error:', error instanceof Error ? error.message : String(error));
      return {
        isValid: false,
        error: `Failed to validate session: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Export helper functions for use in other modules
export { convertToLondonTime, getCurrentLondonTime };
