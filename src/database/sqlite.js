// MemoryDB adapter - no SQLite dependency for Render compatibility

class MemoryDB {
  constructor() {
    this.data = new Map();
    this.idCounter = 1;
  }

  prepare(sql) {
    return {
      run: (params) => {
        if (sql.includes('INSERT')) {
          const id = this.idCounter++;
          this.data.set(id, { ...params, id });
          return { lastInsertRowid: id, changes: 1 };
        }
        return { changes: 0 };
      },
      get: (params) => {
        return null; // Simplified
      },
      all: () => {
        return Array.from(this.data.values());
      }
    };
  }

  exec(sql) {
    // No-op for CREATE TABLE
  }
}

export default MemoryDB;
