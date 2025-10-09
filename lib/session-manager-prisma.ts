import { SignJWT, jwtVerify } from 'jose';
import { getAllRoutes } from './routes';
import { SessionTimeManager } from './session-time-manager';
import { dbPool } from './db-pool-prisma';
import { TopoUser } from './topo-users-service-prisma';

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

function convertToLondonTime(dateString: string): string {
  const date = new Date(dateString);
  const londonOffset = getLondonOffset();
  const londonTime = new Date(date.getTime() + londonOffset);
  
  return londonTime.toISOString();
}

export class SessionManager {
  private adminService: any;
  private topoUsersService: any;

  constructor() {
    this.adminService = null;
    this.topoUsersService = null;
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

  // Create user session from database event
  static async createUserSession(topoUser: TopoUser): Promise<UserSession> {
    const userSession: Omit<UserSession, 'token'> = {
      email: topoUser.email,
      name: topoUser.name,
      sessionStart: topoUser.originalSessionStart,
      sessionEnd: topoUser.originalSessionEnd,
      expiresAt: topoUser.originalSessionEnd,
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

  // Verify session token
  static async verifySessionToken(token: string): Promise<SessionValidationResult> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Check if token is expired
      const now = Date.now();
      if (payload.expiresAt && typeof payload.expiresAt === 'number' && now > payload.expiresAt) {
        return {
          isValid: false,
          error: 'Session expired'
        };
      }

      // For non-admin users, verify session times from database
      if (!payload.isAdmin) {
        await dbPool.initialize();
        const topoUsersService = dbPool.getTopoUsersService();
        const topoUser = await topoUsersService.getTopoUserByEmail(payload.email as string);
        
        if (!topoUser || !topoUser.isActive) {
          return {
            isValid: false,
            error: 'User session not found or inactive'
          };
        }

        // Update session times from database
        const userSession: UserSession = {
          email: payload.email as string,
          name: payload.name as string,
          sessionStart: topoUser.originalSessionStart,
          sessionEnd: topoUser.originalSessionEnd,
          token: token,
          expiresAt: new Date(payload.expiresAt as number).toISOString(),
          routes: payload.routes as string[],
          isAdmin: payload.isAdmin as boolean
        };

        // Get session time info
        const sessionTimeInfo = SessionTimeManager.getSessionTimeInfo(
          topoUser.originalSessionStart,
          topoUser.originalSessionEnd
        );
        userSession.sessionTimeInfo = sessionTimeInfo;

        return {
          isValid: true,
          user: userSession
        };
      }

      // For admin users, use token data directly
      const userSession: UserSession = {
        email: payload.email as string,
        name: payload.name as string,
        sessionStart: payload.sessionStart as string,
        sessionEnd: payload.sessionEnd as string,
        token: token,
        expiresAt: new Date(payload.expiresAt as number).toISOString(),
        routes: payload.routes as string[],
        isAdmin: payload.isAdmin as boolean
      };

      return {
        isValid: true,
        user: userSession
      };
    } catch (error) {
      console.error('Error verifying session token:', error);
      return {
        isValid: false,
        error: 'Invalid session token'
      };
    }
  }

  // Get session time info for display
  static getSessionTimeInfo(sessionStart: string, sessionEnd: string): any {
    return SessionTimeManager.getSessionTimeInfo(sessionStart, sessionEnd);
  }

  // Check if user can access route
  static canAccessRoute(userRoutes: string[], routeId: string): boolean {
    return userRoutes.includes(routeId);
  }

  // Get all available routes
  static getAllRoutes(): string[] {
    const allRoutes = getAllRoutes();
    return allRoutes.map(route => route.id);
  }

  // Validate user credentials and create session using Prisma
  async validateAndCreateSession(email: string, password: string): Promise<SessionValidationResult> {
    try {
      // Ensure database pool is initialized
      await dbPool.initialize();
      
      // Get services
      const adminService = dbPool.getAdminService();
      const topoUsersService = dbPool.getTopoUsersService();
      
      // First, check if this is an admin user
      const adminResult = await adminService.authenticateAdmin(email, password);
      
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
      const topoUser = await topoUsersService.getTopoUserByEmail(email);
      
      if (!topoUser || !topoUser.isActive) {
        console.log(`[SessionManager] User cannot login: No active session found`);
        return {
          isValid: false,
          error: 'No active session found for this email'
        };
      }

      // Get session time information
      const sessionTimeInfo = SessionTimeManager.getPreBufferedSessionTimeInfo(
        topoUser.originalSessionStart,
        topoUser.originalSessionEnd
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
      const userSession = await SessionManager.createUserSession(topoUser);
      
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

export default SessionManager;
