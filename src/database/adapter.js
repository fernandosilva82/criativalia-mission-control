/**
 * Database Adapter
 * Auto-detects environment and chooses appropriate database
 */

import { MemoryDB } from './memory.js';

let db;

// Force MemoryDB on Render (no native modules) or if SQLite fails
const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID;

if (isRender) {
  console.log('📊 Running on Render - using in-memory database');
  db = new MemoryDB();
} else {
  try {
    const { SQLiteManager } = await import('./sqlite.js');
    db = new SQLiteManager();
    console.log('📊 Using SQLite database');
  } catch (error) {
    console.log('⚠️ SQLite not available, using in-memory storage:', error.message);
    db = new MemoryDB();
  }
}

export { db };
export default db;
