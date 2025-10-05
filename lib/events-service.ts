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
    // Use email if already extracted, otherwise try to extract from notes
    const email = event.email || this.extractEmailFromNotes(event.notes || '');
    const name = event.who || 'Unknown';
    
    console.log(`Processing event: ${event.title} - Email: ${email} - Name: ${name}`);
    console.log('Event data being saved:', {
      title: event.title,
      who: event.who,
      email: email,
      name: name,
      notes: event.notes?.substring(0, 100) + '...' // Show first 100 chars
    });
    
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

    // Convert to London timezone for consistent storage
    const startTimeLondon = new Date(startTime);
    const endTimeLondon = new Date(event.end_dt || event.end || startTime);
    
    // Convert to London timezone using proper method
    const startLondonStr = startTimeLondon.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    const endLondonStr = endTimeLondon.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    
    // Parse the London time strings and create proper timezone format
    const startLondon = new Date(startLondonStr);
    const endLondon = new Date(endLondonStr);
    
    // Create London timezone strings (not UTC)
    const year = startLondon.getFullYear();
    const month = String(startLondon.getMonth() + 1).padStart(2, '0');
    const day = String(startLondon.getDate()).padStart(2, '0');
    const hours = String(startLondon.getHours()).padStart(2, '0');
    const minutes = String(startLondon.getMinutes()).padStart(2, '0');
    const seconds = String(startLondon.getSeconds()).padStart(2, '0');
    
    const endYear = endLondon.getFullYear();
    const endMonth = String(endLondon.getMonth() + 1).padStart(2, '0');
    const endDay = String(endLondon.getDate()).padStart(2, '0');
    const endHours = String(endLondon.getHours()).padStart(2, '0');
    const endMinutes = String(endLondon.getMinutes()).padStart(2, '0');
    const endSeconds = String(endLondon.getSeconds()).padStart(2, '0');
    
    const sessionStartLondon = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+01:00`;
    const sessionEndLondon = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:${endSeconds}+01:00`;
    
    const eventDate = `${year}-${month}-${day}`; // YYYY-MM-DD

    return {
      ...event,
      email: email,
      name: name,
      eventDate: eventDate,
      sessionStart: sessionStartLondon,
      sessionEnd: sessionEndLondon,
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
      console.log(`\n=== SAVING EVENT ===`);
      console.log(`Title: ${event.title}`);
      console.log(`Who: ${event.who}`);
      console.log(`Email from event: ${event.email}`);
      console.log(`Notes length: ${event.notes?.length || 0}`);
      console.log(`Notes preview: ${event.notes?.substring(0, 100)}...`);
      
      const dbEvent = this.convertToDatabaseEvent(event);
      
      if (!dbEvent) {
        console.log(`❌ Event skipped - no email found`);
        skipped++;
        continue;
      }
      
      console.log(`✅ Event converted successfully - Email: ${dbEvent.email}`);

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

  // Get events for current week (Monday to Sunday)
  async getCurrentWeekEvents(): Promise<DatabaseEvent[]> {
    await this.ensureConnection();
    const collection = this.dbManager.getEventsCollection();
    
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    // Convert dates to ISO strings for comparison with sessionStart field
    const mondayStr = monday.toISOString();
    const sundayStr = sunday.toISOString();
    
    const events = await collection.find({
      sessionStart: { $gte: mondayStr, $lte: sundayStr }
    }).toArray();
    
    return events as DatabaseEvent[];
  }

  // Delete a specific event by ID
  async deleteEvent(eventId: string): Promise<boolean> {
    await this.ensureConnection();
    const collection = this.dbManager.getEventsCollection();
    
    const result = await collection.deleteOne({ _id: eventId });
    return result.deletedCount > 0;
  }
}

export default EventsService;
