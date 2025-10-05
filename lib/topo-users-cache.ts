// Simple in-memory cache for topo users data
let topoUsersCache: { data: any[]; timestamp: number } | null = null;

// Function to clear cache (can be called from other endpoints)
export function clearTopoUsersCache() {
  topoUsersCache = null;
}

// Function to get cache
export function getTopoUsersCache() {
  return topoUsersCache;
}

// Function to set cache
export function setTopoUsersCache(data: any[], timestamp: number) {
  topoUsersCache = { data, timestamp };
}
