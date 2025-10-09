import EventsService from './events-service-prisma';
import AdminService from './admin-service-prisma';
import TopoUsersService from './topo-users-service-prisma';

// Global state that persists across requests
declare global {
  var __dbPoolPrisma: DatabasePool | undefined;
  var __dbPoolPrismaInitialized: boolean | undefined;
  var __dbPoolPrismaInitPromise: Promise<void> | undefined;
}

class DatabasePool {
  private eventsService: EventsService;
  private adminService: AdminService;
  private topoUsersService: TopoUsersService;

  private constructor() {
    this.eventsService = new EventsService();
    this.adminService = new AdminService();
    this.topoUsersService = new TopoUsersService();
  }

  public static getInstance(): DatabasePool {
    if (!global.__dbPoolPrisma) {
      global.__dbPoolPrisma = new DatabasePool();
    }
    return global.__dbPoolPrisma;
  }

  public async initialize(): Promise<void> {
    // If already initialized globally, return immediately
    if (global.__dbPoolPrismaInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (global.__dbPoolPrismaInitPromise) {
      await global.__dbPoolPrismaInitPromise;
      return;
    }

    // Start initialization
    global.__dbPoolPrismaInitPromise = this._doInitialize();
    await global.__dbPoolPrismaInitPromise;
  }

  private async _doInitialize(): Promise<void> {
    console.log('Initializing database pool with Prisma...');
    try {
      // Test Prisma connection
      await this.adminService.getAllAdmins();
      
      global.__dbPoolPrismaInitialized = true;
      console.log('Database pool initialized successfully with Prisma');
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      // Reset the promise so it can be retried
      global.__dbPoolPrismaInitPromise = undefined;
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

  public getTopoUsersService(): TopoUsersService {
    return this.topoUsersService;
  }

  public isInitialized(): boolean {
    return global.__dbPoolPrismaInitialized || false;
  }
}

// Global database pool instance
export const dbPool = DatabasePool.getInstance();

export default dbPool;
