/**
 * Database Adapter
 * 
 * Uses SQLite for local development, falls back to in-memory for serverless.
 * Future: Add Redis/Postgres adapter for production serverless.
 */

let db;

// Try to use SQLite
try {
  const { default: DatabaseManager } = await import('./manager.js');
  db = new DatabaseManager();
  console.log('📊 Using SQLite database');
} catch (error) {
  console.log('⚠️ SQLite not available, using in-memory storage');
  const { default: MemoryDB } = await import('./memory.js');
  db = new MemoryDB();
}

export { db };
export default db;
