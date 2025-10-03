import { MongoClient, Db, Collection } from 'mongodb';

export interface AdminUser {
  _id?: string;
  email: string;
  password: string; // Will be hashed
  name: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TeamUpEvent {
  _id?: string;
  id: string;
  title: string;
  start?: string;
  end?: string;
  start_dt?: string;
  end_dt?: string;
  who?: string;
  notes?: string;
  location?: string;
  attendees?: Array<{
    name: string;
    email: string;
  }>;
  description?: string;
  email?: string; // Extracted from notes
  name?: string; // Extracted from who field
  eventDate?: string; // Date of the event (YYYY-MM-DD)
  createdAt?: Date;
  updatedAt?: Date;
}

// Global state that persists across requests
declare global {
  var __mongoIndexesCreated: boolean | undefined;
}

class MongoDBManager {
  private static instance: MongoDBManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private eventsCollection: Collection<TeamUpEvent> | null = null;
  private adminCollection: Collection<AdminUser> | null = null;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): MongoDBManager {
    if (!MongoDBManager.instance) {
      MongoDBManager.instance = new MongoDBManager();
    }
    return MongoDBManager.instance;
  }

  public async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.client && this.db) {
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    // Start new connection
    this.connectionPromise = this._connect();
    await this.connectionPromise;
    this.connectionPromise = null;
  }

  private async _connect(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'sppmap_db';

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        minPoolSize: 1, // Maintain at least 1 connection
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.eventsCollection = this.db.collection<TeamUpEvent>('events');
      this.adminCollection = this.db.collection<AdminUser>('admin_users');
      
      // Create indexes for better performance (only once)
      if (!global.__mongoIndexesCreated) {
        await this.createIndexes();
        global.__mongoIndexesCreated = true;
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      // Reset connection state on error
      this.client = null;
      this.db = null;
      this.eventsCollection = null;
      this.adminCollection = null;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.eventsCollection = null;
      this.adminCollection = null;
      console.log('Disconnected from MongoDB');
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.eventsCollection || !this.adminCollection) return;

    try {
      // Create indexes for events collection
      await this.eventsCollection.createIndex({ email: 1 });
      await this.eventsCollection.createIndex({ eventDate: 1 });
      await this.eventsCollection.createIndex({ start_dt: 1 });
      await this.eventsCollection.createIndex({ title: 1 });
      // Optimized index for getUserActiveSession query
      await this.eventsCollection.createIndex({ email: 1, sessionStart: 1 });
      
      // Create indexes for admin collection
      await this.adminCollection.createIndex({ email: 1 }, { unique: true });
      await this.adminCollection.createIndex({ role: 1 });
      
      console.log('MongoDB indexes created successfully');
    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }

  public getEventsCollection(): Collection<TeamUpEvent> {
    if (!this.eventsCollection) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.eventsCollection;
  }

  public getAdminCollection(): Collection<AdminUser> {
    if (!this.adminCollection) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.adminCollection;
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  // Helper method to ensure connection
  public async ensureConnection(): Promise<void> {
    // If already connected, return immediately
    if (this.client && this.db && this.eventsCollection && this.adminCollection) {
      return;
    }
    
    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }
    
    // Start new connection
    await this.connect();
  }
}

export default MongoDBManager;