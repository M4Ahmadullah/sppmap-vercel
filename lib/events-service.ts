import MongoDBManager, { TeamUpEvent } from './mongodb-manager';

export interface DatabaseEvent extends TeamUpEvent {
  email: string;
  name: string;
  eventDate: string; // YYYY-MM-DD format
  sessionStart: string; // ISO string
  sessionEnd: string; // ISO string
}

export class EventsService {
  private dbManager: MongoDBManager;

  constructor() {
    this.dbManager = MongoDBManager.getInstance();
  }

  // Ensure MongoDB connection is established
  private async ensureConnection(): Promise<void> {
    await this.dbManager.ensureConnection();
  }

  // Extract email from notes field
  private extractEmailFromNotes(notes: string): string | null {
    if (!notes) return null;
    
    // Look for email patterns in the notes HTML
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = notes.match(emailRegex);
    return match ? match[0] : null;
  }

  // Convert TeamUp event to database event
  private convertToDatabaseEvent(event: TeamUpEvent): DatabaseEvent | null {
    const email = this.extractEmailFromNotes(event.notes || '');
    const name = event.who || 'Unknown';
    
    if (!email) {
      console.log('No email found for event:', event.title);
      return null;
    }

    // Extract date from start_dt or start
    const startTime = event.start_dt || event.start;
    if (!startTime) {
      console.log('No start time found for event:', event.title);
      return null;
    }

    const eventDate = new Date(startTime).toISOString().split('T')[0]; // YYYY-MM-DD

    return {
      ...event,
      email: email,
      name: name,
      eventDate: eventDate,
      sessionStart: event.start_dt || event.start || '',
      sessionEnd: event.end_dt || event.end || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Save events to database
  public async saveEvents(events: TeamUpEvent[]): Promise<{ saved: number; skipped: number }> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    let saved = 0;
    let skipped = 0;

    for (const event of events) {
      const dbEvent = this.convertToDatabaseEvent(event);
      
      if (!dbEvent) {
        skipped++;
        continue;
      }

      try {
        // Check if event already exists (by title and date)
        const existing = await collection.findOne({
          title: dbEvent.title,
          eventDate: dbEvent.eventDate,
          email: dbEvent.email
        });

        if (existing) {
          // Update existing event
          await collection.updateOne(
            { _id: existing._id },
            { 
              $set: {
                ...dbEvent,
                updatedAt: new Date()
              }
            }
          );
          console.log(`Updated event: ${dbEvent.title} for ${dbEvent.email}`);
        } else {
          // Insert new event
          await collection.insertOne(dbEvent);
          console.log(`Saved new event: ${dbEvent.title} for ${dbEvent.email}`);
        }
        saved++;
      } catch (error) {
        console.error(`Error saving event ${dbEvent.title}:`, error);
        skipped++;
      }
    }

    return { saved, skipped };
  }

  // Get events for a specific email
  public async getEventsForEmail(email: string): Promise<DatabaseEvent[]> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    const events = await collection.find({ email: email.toLowerCase() }).toArray();
    return events as DatabaseEvent[];
  }

  // Get events for a specific date range
  public async getEventsForDateRange(startDate: string, endDate: string): Promise<DatabaseEvent[]> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    const events = await collection.find({
      eventDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();

    return events as DatabaseEvent[];
  }

  // Get all events
  public async getAllEvents(): Promise<DatabaseEvent[]> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    const events = await collection.find({}).sort({ sessionStart: 1 }).toArray();
    return events as DatabaseEvent[];
  }

  // Get all TOPO events
  public async getAllTopoEvents(): Promise<DatabaseEvent[]> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    const events = await collection.find({
      title: { $regex: /topo/i }
    }).toArray();

    return events as DatabaseEvent[];
  }

  // Delete events older than specified date
  public async deleteOldEvents(beforeDate: string): Promise<number> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getEventsCollection();

    const result = await collection.deleteMany({
      eventDate: { $lt: beforeDate }
    });

    console.log(`Deleted ${result.deletedCount} events before ${beforeDate}`);
    return result.deletedCount;
  }

  // Get events for today (preserve current day)
  public async getTodayEvents(): Promise<DatabaseEvent[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.getEventsForDateRange(today, today);
  }

  // Get upcoming events (tomorrow onwards)
  public async getUpcomingEvents(): Promise<DatabaseEvent[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    return this.getEventsForDateRange(tomorrowStr, nextWeekStr);
  }

  // Check if user has active session - optimized with direct database query
  public async getUserActiveSession(email: string): Promise<DatabaseEvent | null> {
    await this.ensureConnection();
    const collection = this.dbManager.getEventsCollection();
    
    const now = new Date().toISOString();
    
    // Direct database query to find the earliest upcoming event
    const upcomingEvent = await collection.findOne(
      { 
        email: email.toLowerCase(),
        sessionStart: { $gt: now }
      },
      { 
        sort: { sessionStart: 1 } // Sort by sessionStart ascending
      }
    );

    return upcomingEvent as DatabaseEvent | null;
  }
}

export default EventsService;
