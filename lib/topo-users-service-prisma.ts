import { prisma } from './prisma';

export interface TopoUser {
  id: string;
  email: string;
  name: string;
  originalSessionStart: string;
  originalSessionEnd: string;
  eventTitle: string;
  eventDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TopoUsersService {
  // Add or update TopoUser session
  public async addTopoUserSessionUpsert(
    email: string, 
    name: string, 
    originalSessionStart: string, 
    originalSessionEnd: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    try {
      await prisma.topoUser.upsert({
        where: { email: email.toLowerCase() },
        update: {
          name,
          originalSessionStart,
          originalSessionEnd,
          eventTitle,
          eventDate,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          email: email.toLowerCase(),
          name,
          originalSessionStart,
          originalSessionEnd,
          eventTitle,
          eventDate,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error upserting topo user session:', error);
      throw error;
    }
  }

  // Get TopoUser by email
  public async getTopoUserByEmail(email: string): Promise<TopoUser | null> {
    try {
      const user = await prisma.topoUser.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      return user as TopoUser | null;
    } catch (error) {
      console.error('Error getting topo user by email:', error);
      return null;
    }
  }

  // Get all TopoUsers
  public async getAllTopoUsers(): Promise<TopoUser[]> {
    try {
      const users = await prisma.topoUser.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      return users as TopoUser[];
    } catch (error) {
      console.error('Error getting all topo users:', error);
      return [];
    }
  }

  // Update TopoUser
  public async updateTopoUser(email: string, updates: Partial<Omit<TopoUser, 'id' | 'email' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.topoUser.updateMany({
        where: { email: email.toLowerCase() },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'TopoUser updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'TopoUser not found'
        };
      }
    } catch (error) {
      console.error('Error updating topo user:', error);
      return {
        success: false,
        message: 'Failed to update topo user'
      };
    }
  }

  // Deactivate TopoUser
  public async deactivateTopoUser(email: string): Promise<{ success: boolean; message: string }> {
    return this.updateTopoUser(email, { isActive: false });
  }

  // Delete TopoUser
  public async deleteTopoUser(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.topoUser.deleteMany({
        where: { email: email.toLowerCase() }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'TopoUser deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'TopoUser not found'
        };
      }
    } catch (error) {
      console.error('Error deleting topo user:', error);
      return {
        success: false,
        message: 'Failed to delete topo user'
      };
    }
  }

  // Get TopoUser sessions by email (for compatibility)
  public async getTopoUserSessionsByEmail(email: string): Promise<TopoUser[]> {
    try {
      const user = await this.getTopoUserByEmail(email);
      return user ? [user] : [];
    } catch (error) {
      console.error('Error getting topo user sessions by email:', error);
      return [];
    }
  }

  // Get all TopoUser sessions (for compatibility)
  public async getAllTopoUserSessions(): Promise<TopoUser[]> {
    return this.getAllTopoUsers();
  }

  // Deactivate TopoUser session by ID (for compatibility)
  public async deactivateTopoUserSession(sessionId: string): Promise<boolean> {
    try {
      const result = await prisma.topoUser.updateMany({
        where: { id: sessionId },
        data: { isActive: false }
      });
      return result.count > 0;
    } catch (error) {
      console.error('Error deactivating topo user session:', error);
      return false;
    }
  }

  // Clear all sessions (for compatibility)
  public async clearAllSessions(): Promise<number> {
    try {
      const result = await prisma.topoUser.deleteMany({});
      return result.count;
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      return 0;
    }
  }

  // Add TopoUser session (for compatibility)
  public async addTopoUserSession(
    email: string,
    name: string,
    sessionStart: string,
    sessionEnd: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    return this.addTopoUserSessionUpsert(email, name, sessionStart, sessionEnd, eventTitle, eventDate);
  }

  // Get topo users statistics (for compatibility)
  public async getTopoUsersStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByDate: Array<{ date: string; count: number }>;
  }> {
    try {
      const allUsers = await this.getAllTopoUsers();
      const activeUsers = allUsers.filter(user => user.isActive);
      const inactiveUsers = allUsers.filter(user => !user.isActive);

      // Group by date
      const usersByDate = allUsers.reduce((acc, user) => {
        const date = user.eventDate;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        usersByDate: Object.entries(usersByDate).map(([date, count]) => ({
          date,
          count
        }))
      };
    } catch (error) {
      console.error('Error getting topo users statistics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByDate: []
      };
    }
  }

  // Get current active session (for compatibility)
  public async getCurrentActiveSession(email: string): Promise<TopoUser | null> {
    try {
      const user = await this.getTopoUserByEmail(email);
      return user && user.isActive ? user : null;
    } catch (error) {
      console.error('Error getting current active session:', error);
      return null;
    }
  }

  // Get upcoming sessions (for compatibility)
  public async getUpcomingSessions(email: string): Promise<TopoUser[]> {
    try {
      const user = await this.getTopoUserByEmail(email);
      if (!user) return [];
      
      // Check if the session is upcoming (session start is in the future)
      const now = new Date();
      const sessionStart = new Date(user.originalSessionStart);
      
      if (sessionStart > now) {
        return [user];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return [];
    }
  }

  // Get active topo user sessions (for compatibility)
  public async getActiveTopoUserSessions(): Promise<TopoUser[]> {
    try {
      const users = await prisma.topoUser.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      return users as TopoUser[];
    } catch (error) {
      console.error('Error getting active topo user sessions:', error);
      return [];
    }
  }

  // Check if user can login (for compatibility)
  public async canUserLogin(email: string): Promise<{
    canLogin: boolean;
    reason?: string;
    session?: TopoUser;
  }> {
    try {
      const user = await this.getTopoUserByEmail(email);
      
      if (!user) {
        return {
          canLogin: false,
          reason: 'No session found for this email'
        };
      }

      if (!user.isActive) {
        return {
          canLogin: false,
          reason: 'Session has been deactivated'
        };
      }

      return {
        canLogin: true,
        session: user
      };
    } catch (error) {
      console.error('Error checking if user can login:', error);
      return {
        canLogin: false,
        reason: 'Database error occurred'
      };
    }
  }

  // Delete topo user session (for compatibility)
  public async deleteTopoUserSession(sessionId: string): Promise<boolean> {
    try {
      const result = await prisma.topoUser.deleteMany({
        where: { id: sessionId }
      });
      return result.count > 0;
    } catch (error) {
      console.error('Error deleting topo user session:', error);
      return false;
    }
  }
}

export default TopoUsersService;
