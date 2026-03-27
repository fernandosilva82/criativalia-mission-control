/**
 * Database Adapter
 * Uses in-memory storage (compatible with all environments)
 */

import MemoryDB from './memory.js';

const db = new MemoryDB();
console.log('📊 Using in-memory database');

export { db };
export default db;
