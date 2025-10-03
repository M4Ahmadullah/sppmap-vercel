import MongoDBManager from './mongodb-manager';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    await initPromise;
    return;
  }

  // Start initialization
  initPromise = _initializeDatabase();
  await initPromise;
  initPromise = null;
}

async function _initializeDatabase(): Promise<void> {
  try {
    const dbManager = MongoDBManager.getInstance();
    await dbManager.connect();
    isInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    isInitialized = false;
    throw error;
  }
}

export function isDatabaseInitialized(): boolean {
  return isInitialized;
}
