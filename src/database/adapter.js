/**
 * Database Adapter - Seleciona o banco apropriado
 * PostgreSQL se DATABASE_URL existir, senão MemoryDB
 */

import MemoryDB from './memory.js';
import { db as PostgresDB } from './postgres.js';

// Detecta se tem PostgreSQL configurado
const hasPostgres = !!process.env.DATABASE_URL;

console.log(`📊 Database: ${hasPostgres ? 'PostgreSQL' : 'MemoryDB'}`);

// Exporta o banco apropriado
export const db = hasPostgres ? PostgresDB : new MemoryDB();
export default db;
