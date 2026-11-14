/**
 * HostelHub Database Connection & Query Helper
 * Part 2: Database (3 tables and queries)
 * Supports both standard 'sqlite3' package and Node.js built-in 'node:sqlite'
 */

const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'hostelhub.db');

let dbDriver = null;
let nativeDb = null;

// Determine available SQLite engine
try {
  const sqlite3 = require('sqlite3').verbose();
  const dbInstance = new sqlite3.Database(DB_PATH);
  dbDriver = 'sqlite3';
  nativeDb = dbInstance;
} catch (e) {
  // Fallback to Node.js built-in DatabaseSync (available in Node 22+)
  const { DatabaseSync } = require('node:sqlite');
  nativeDb = new DatabaseSync(DB_PATH);
  dbDriver = 'node:sqlite';
}

/**
 * Run a query that returns multiple rows
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      if (dbDriver === 'sqlite3') {
        nativeDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      } else {
        const stmt = nativeDb.prepare(sql);
        const rows = stmt.all(...params);
        resolve(rows || []);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Run a query that returns a single row
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Object|null>}
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      if (dbDriver === 'sqlite3') {
        nativeDb.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        });
      } else {
        const stmt = nativeDb.prepare(sql);
        const row = stmt.get(...params);
        resolve(row || null);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      if (dbDriver === 'sqlite3') {
        nativeDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      } else {
        const stmt = nativeDb.prepare(sql);
        const result = stmt.run(...params);
        resolve({
          lastID: Number(result.lastInsertRowid),
          changes: Number(result.changes)
        });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Execute raw multi-statement SQL (DDL / schema creation)
 * @param {string} sql 
 * @returns {Promise<void>}
 */
function exec(sql) {
  return new Promise((resolve, reject) => {
    try {
      if (dbDriver === 'sqlite3') {
        nativeDb.exec(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      } else {
        nativeDb.exec(sql);
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Initialize schema tables
 */
async function initSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      block TEXT NOT NULL,
      capacity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS allotments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      allotment_date TEXT NOT NULL,
      return_date TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `;
  await exec(schemaSql);
}

module.exports = {
  dbDriver,
  all,
  get,
  run,
  exec,
  initSchema,
  DB_PATH
};
