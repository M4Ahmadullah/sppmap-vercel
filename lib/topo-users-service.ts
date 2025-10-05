import MongoDBManager, { TopoUser } from './mongodb-manager';
import { Collection } from 'mongodb';
import { dbPool } from './db-pool';

class TopoUsersService {
  private dbManager: MongoDBManager;

  constructor() {
    this.dbManager = MongoDBManager.getInstance();
  }

  private async ensureConnection(): Promise<void> {
    // Use the global database pool for better performance
    await dbPool.initialize();
    await this.dbManager.ensureConnection();
  }

  // Add a new topo user session
  public async addTopoUserSession(
    email: string, 
    name: string, 
    originalSessionStart: string, 
    originalSessionEnd: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();

    // Parse the original session times and work in London timezone
    const originalStart = new Date(originalSessionStart);
    const originalEnd = new Date(originalSessionEnd);
    
    // Calculate buffered session times (-15 minutes start, +15 minutes end)
    // Work directly with the original times since they're already in London timezone
    const sessionStart = new Date(originalStart.getTime() - (15 * 60 * 1000));
    const sessionEnd = new Date(originalEnd.getTime() + (15 * 60 * 1000));

    // Convert to London timezone format preserving the timezone
    const sessionStartLondonStr = sessionStart.toLocaleString("sv-SE", { timeZone: "Europe/London" }) + "+01:00";
    const sessionEndLondonStr = sessionEnd.toLocaleString("sv-SE", { timeZone: "Europe/London" }) + "+01:00";

    const topoUser: TopoUser = {
      email: email.toLowerCase(),
      name: name,
      sessionStart: sessionStartLondonStr,
      sessionEnd: sessionEndLondonStr,
      originalSessionStart: originalSessionStart,
      originalSessionEnd: originalSessionEnd,
      eventTitle: eventTitle,
      eventDate: eventDate,
      createdAt: new Date(),
      isActive: true
    };
    
    await collection.insertOne(topoUser);
  }

  // Add a new topo user session with upsert to prevent duplicates
  public async addTopoUserSessionUpsert(
    email: string, 
    name: string, 
    originalSessionStart: string, 
    originalSessionEnd: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();

    // Parse the original session times and work in London timezone
    const originalStart = new Date(originalSessionStart);
    const originalEnd = new Date(originalSessionEnd);
    
    // Calculate buffered session times (-15 minutes start, +15 minutes end)
    // Work directly with the original times since they're already in London timezone
    const sessionStart = new Date(originalStart.getTime() - (15 * 60 * 1000));
    const sessionEnd = new Date(originalEnd.getTime() + (15 * 60 * 1000));

    // Convert to London timezone format preserving the timezone
    const sessionStartLondonStr = sessionStart.toLocaleString("sv-SE", { timeZone: "Europe/London" }) + "+01:00";
    const sessionEndLondonStr = sessionEnd.toLocaleString("sv-SE", { timeZone: "Europe/London" }) + "+01:00";

    const topoUser: TopoUser = {
      email: email.toLowerCase(),
      name: name,
      sessionStart: sessionStartLondonStr,
      sessionEnd: sessionEndLondonStr,
      originalSessionStart: originalSessionStart,
      originalSessionEnd: originalSessionEnd,
      eventTitle: eventTitle,
      eventDate: eventDate,
      createdAt: new Date(),
      isActive: true
    };
    
    // Use upsert to prevent duplicates based on email + sessionStart + sessionEnd
    await collection.replaceOne(
      { 
        email: email.toLowerCase(),
        sessionStart: sessionStartLondonStr,
        sessionEnd: sessionEndLondonStr
      },
      topoUser,
      { upsert: true }
    );
    console.log(`Upserted topo user session: ${email} (${name}) - ${eventTitle} - ${eventDate}`);
    console.log(`Original: ${originalSessionStart} to ${originalSessionEnd}`);
    console.log(`Buffered: ${sessionStartLondonStr} to ${sessionEndLondonStr}`);
  }

  // Get all topo user sessions
  public async getAllTopoUserSessions(): Promise<TopoUser[]> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return users as TopoUser[];
  }

  // Get active topo user sessions
  public async getActiveTopoUserSessions(): Promise<TopoUser[]> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const users = await collection.find({ isActive: true }).sort({ createdAt: -1 }).toArray();
    return users as TopoUser[];
  }

  // Get topo user sessions by email
  public async getTopoUserSessionsByEmail(email: string): Promise<TopoUser[]> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const users = await collection.find({ 
      email: email.toLowerCase() 
    }).sort({ sessionStart: 1 }).toArray();
    return users as TopoUser[];
  }

  // Get current active session for a user (if they're within their session window)
  public async getCurrentActiveSession(email: string): Promise<TopoUser | null> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    
    // Get current time in London timezone
    const now = new Date();
    const currentLondonTime = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    
    // Get all sessions for this user
    const userSessions = await collection.find({
      email: email.toLowerCase(),
      isActive: true
    }).toArray();
    
    // Check each session to see if current time falls within the session window
    for (const session of userSessions) {
      const sessionStart = session.sessionStart;
      const sessionEnd = session.sessionEnd;
      
      // Parse the stored times (remove timezone info for comparison)
      const sessionStartTime = sessionStart.replace(/\+.*$/, ''); // Remove +01:00
      const sessionEndTime = sessionEnd.replace(/\+.*$/, ''); // Remove +01:00
      
      // Compare London time strings directly
      if (currentLondonTime >= sessionStartTime && currentLondonTime <= sessionEndTime) {
        return session as TopoUser;
      }
    }
    
    return null;
  }

  // Get upcoming sessions for a user
  public async getUpcomingSessions(email: string): Promise<TopoUser[]> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    
    // Get current time in London timezone
    const now = new Date();
    const currentLondonTime = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    
    // Get all sessions for this user
    const userSessions = await collection.find({
      email: email.toLowerCase(),
      isActive: true
    }).sort({ sessionStart: 1 }).toArray();
    
    // Filter sessions that start after current time
    const upcomingSessions = userSessions.filter(session => {
      const sessionStartTime = session.sessionStart.replace(/\+.*$/, ''); // Remove +01:00
      return currentLondonTime < sessionStartTime;
    });
    
    return upcomingSessions as TopoUser[];
  }

  // Check if user can login (within their session window)
  public async canUserLogin(email: string): Promise<{ canLogin: boolean; session?: TopoUser; reason?: string }> {
    const activeSession = await this.getCurrentActiveSession(email);
    
    if (activeSession) {
      return { canLogin: true, session: activeSession };
    }
    
    // Check if there are any upcoming sessions
    const upcomingSessions = await this.getUpcomingSessions(email);
    if (upcomingSessions.length > 0) {
      const nextSession = upcomingSessions[0];
      const sessionStart = new Date(nextSession.sessionStart);
      const now = new Date();
      const timeUntilSession = sessionStart.getTime() - now.getTime();
      const minutesUntilSession = Math.floor(timeUntilSession / (1000 * 60));
      
      return { 
        canLogin: false, 
        reason: `Your next session starts in ${minutesUntilSession} minutes at ${sessionStart.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })}` 
      };
    }
    
    return { canLogin: false, reason: 'No active or upcoming sessions found' };
  }

  // Deactivate a topo user session
  public async deactivateTopoUserSession(sessionId: string): Promise<boolean> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const result = await collection.updateOne(
      { _id: sessionId },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }

  // Delete a topo user session
  public async deleteTopoUserSession(sessionId: string): Promise<boolean> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const result = await collection.deleteOne({ _id: sessionId });
    return result.deletedCount > 0;
  }

  // Get topo users statistics
  public async getTopoUsersStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    inactiveSessions: number;
    uniqueUsers: number;
    currentActiveUsers: number;
  }> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    
    // Get current time in London timezone
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/London"}));
    const nowISO = now.toISOString();
    
    const [
      totalSessions,
      activeSessions,
      inactiveSessions,
      uniqueUsers,
      currentActiveUsers
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ isActive: true }),
      collection.countDocuments({ isActive: false }),
      collection.distinct('email').then(emails => emails.length),
      collection.countDocuments({
        isActive: true,
        sessionStart: { $lte: nowISO },
        sessionEnd: { $gte: nowISO }
      })
    ]);

    return {
      totalSessions,
      activeSessions,
      inactiveSessions,
      uniqueUsers,
      currentActiveUsers
    };
  }

  // Clear all sessions (for testing or reset)
  public async clearAllSessions(): Promise<number> {
    await this.ensureConnection();
    const collection = this.dbManager.getTopoUsersCollection();
    const result = await collection.deleteMany({});
    return result.deletedCount;
  }
}

export default TopoUsersService;
