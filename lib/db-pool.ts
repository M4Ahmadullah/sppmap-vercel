import MongoDBManager from './mongodb-manager';
import EventsService from './events-service';
import AdminService from './admin-service-fallback';

// Global state that persists across requests
declare global {
  var __dbPool: DatabasePool | undefined;
  var __dbPoolInitialized: boolean | undefined;
  var __dbPoolInitPromise: Promise<void> | undefined;
}

class DatabasePool {
  private mongoManager: MongoDBManager;
  private eventsService: EventsService;
  private adminService: AdminService;

  private constructor() {
    this.mongoManager = MongoDBManager.getInstance();
    this.eventsService = new EventsService();
    this.adminService = new AdminService();
  }

  public static getInstance(): DatabasePool {
    if (!global.__dbPool) {
      global.__dbPool = new DatabasePool();
    }
    return global.__dbPool;
  }

  public async initialize(): Promise<void> {
    // If already initialized globally, return immediately
    if (global.__dbPoolInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (global.__dbPoolInitPromise) {
      await global.__dbPoolInitPromise;
      return;
    }

    // Start initialization
    global.__dbPoolInitPromise = this._doInitialize();
    await global.__dbPoolInitPromise;
  }

  private async _doInitialize(): Promise<void> {
    console.log('Initializing database pool...');
    try {
      // Initialize MongoDB connection with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 30000)
      );
      
      await Promise.race([
        this.mongoManager.ensureConnection(),
        timeoutPromise
      ]);
      
      global.__dbPoolInitialized = true;
      console.log('Database pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      // Reset the promise so it can be retried
      global.__dbPoolInitPromise = undefined;
      // Don't mark as initialized if it failed
      throw error;
    }
  }

  public getEventsService(): EventsService {
    return this.eventsService;
  }

  public getAdminService(): AdminService {
    return this.adminService;
  }

  public getMongoManager(): MongoDBManager {
    return this.mongoManager;
  }

  public isInitialized(): boolean {
    return global.__dbPoolInitialized || false;
  }
}

// Global database pool instance
export const dbPool = DatabasePool.getInstance();

export default dbPool;
