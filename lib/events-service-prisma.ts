import { prisma } from './prisma';

export interface Event {
  id: string;
  email: string;
  name: string;
  sessionStart: string;
  sessionEnd: string;
  eventTitle: string;
  eventDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EventsService {
  // Add event
  public async addEvent(
    email: string,
    name: string,
    sessionStart: string,
    sessionEnd: string,
    eventTitle: string,
    eventDate: string
  ): Promise<{ success: boolean; message: string; event?: Event }> {
    try {
      const event = await prisma.event.create({
        data: {
          email: email.toLowerCase(),
          name,
          sessionStart,
          sessionEnd,
          eventTitle,
          eventDate
        }
      });

      return {
        success: true,
        message: 'Event added successfully',
        event: event as Event
      };
    } catch (error) {
      console.error('Error adding event:', error);
      return {
        success: false,
        message: 'Failed to add event'
      };
    }
  }

  // Get events by email
  public async getEventsByEmail(email: string): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: 'desc' }
      });
      
      return events as Event[];
    } catch (error) {
      console.error('Error getting events by email:', error);
      return [];
    }
  }

  // Get all events
  public async getAllEvents(): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return events as Event[];
    } catch (error) {
      console.error('Error getting all events:', error);
      return [];
    }
  }

  // Get events by date range
  public async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return events as Event[];
    } catch (error) {
      console.error('Error getting events by date range:', error);
      return [];
    }
  }

  // Delete events by date range
  public async deleteEventsByDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await prisma.event.deleteMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      return result.count;
    } catch (error) {
      console.error('Error deleting events by date range:', error);
      return 0;
    }
  }

  // Clear all events
  public async clearAllEvents(): Promise<void> {
    try {
      await prisma.event.deleteMany({});
    } catch (error) {
      console.error('Error clearing all events:', error);
      throw error;
    }
  }

  // Update event
  public async updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.event.updateMany({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'Event updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'Event not found'
        };
      }
    } catch (error) {
      console.error('Error updating event:', error);
      return {
        success: false,
        message: 'Failed to update event'
      };
    }
  }

  // Delete event
  public async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.event.deleteMany({
        where: { id }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'Event deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'Event not found'
        };
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      return {
        success: false,
        message: 'Failed to delete event'
      };
    }
  }

  // Delete all events
  public async deleteAllEvents(): Promise<number> {
    try {
      const result = await prisma.event.deleteMany({});
      return result.count;
    } catch (error) {
      console.error('Error deleting all events:', error);
      return 0;
    }
  }

  // Delete old events (for compatibility)
  public async deleteOldEvents(beforeDate: string): Promise<number> {
    try {
      const result = await prisma.event.deleteMany({
        where: {
          eventDate: {
            lt: beforeDate
          }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Error deleting old events:', error);
      return 0;
    }
  }

  // Get all TOPO events (for compatibility)
  public async getAllTopoEvents(): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          eventTitle: {
            contains: 'topo',
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return events as Event[];
    } catch (error) {
      console.error('Error getting all topo events:', error);
      return [];
    }
  }

  // Get today's events (for compatibility)
  public async getTodayEvents(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const events = await prisma.event.findMany({
        where: {
          eventDate: today
        },
        orderBy: { createdAt: 'desc' }
      });
      return events as Event[];
    } catch (error) {
      console.error('Error getting today events:', error);
      return [];
    }
  }

  // Get upcoming events (for compatibility)
  public async getUpcomingEvents(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const events = await prisma.event.findMany({
        where: {
          eventDate: {
            gte: today
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return events as Event[];
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  // Save events (for compatibility)
  public async saveEvents(events: any[]): Promise<{ saved: number; skipped: number }> {
    let saved = 0;
    let skipped = 0;

    try {
      for (const event of events) {
        try {
          await prisma.event.create({
            data: {
              email: event.email?.toLowerCase() || '',
              name: event.name || '',
              sessionStart: event.start_dt || event.start || '',
              sessionEnd: event.end_dt || event.end || '',
              eventTitle: event.title || '',
              eventDate: event.eventDate || new Date(event.start_dt || event.start || '').toISOString().split('T')[0]
            }
          });
          saved++;
        } catch (error) {
          console.error('Error saving event:', error);
          skipped++;
        }
      }
    } catch (error) {
      console.error('Error in saveEvents:', error);
    }

    return { saved, skipped };
  }
}

export default EventsService;
