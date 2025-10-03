// Temporary in-memory database for testing when MongoDB is unavailable
interface MemoryAdmin {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

interface MemoryEvent {
  _id: string;
  title: string;
  email: string;
  sessionStart: string;
  eventEnd: string;
  createdAt: Date;
}

class MemoryDatabase {
  private admins: MemoryAdmin[] = [];
  private events: MemoryEvent[] = [];

  // Admin operations
  async createAdmin(adminData: Omit<MemoryAdmin, '_id' | 'createdAt'>): Promise<MemoryAdmin> {
    const admin: MemoryAdmin = {
      ...adminData,
      _id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    this.admins.push(admin);
    return admin;
  }

  async findAdminByEmail(email: string): Promise<MemoryAdmin | null> {
    return this.admins.find(admin => admin.email === email) || null;
  }

  async getAllAdmins(): Promise<MemoryAdmin[]> {
    return [...this.admins];
  }

  // Event operations
  async createEvent(eventData: Omit<MemoryEvent, '_id' | 'createdAt'>): Promise<MemoryEvent> {
    const event: MemoryEvent = {
      ...eventData,
      _id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    this.events.push(event);
    return event;
  }

  async findEventByEmail(email: string): Promise<MemoryEvent | null> {
    return this.events.find(event => event.email === email) || null;
  }

  async getAllEvents(): Promise<MemoryEvent[]> {
    return [...this.events];
  }

  async deleteEventsByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const initialLength = this.events.length;
    this.events = this.events.filter(event => {
      const eventDate = new Date(event.sessionStart);
      return eventDate < startDate || eventDate > endDate;
    });
    return initialLength - this.events.length;
  }

  async clearAllEvents(): Promise<void> {
    this.events = [];
  }

  // Debug methods
  getStats() {
    return {
      admins: this.admins.length,
      events: this.events.length,
      memoryUsage: process.memoryUsage()
    };
  }
}

// Singleton instance
export const memoryDb = new MemoryDatabase();
export type { MemoryAdmin, MemoryEvent };
