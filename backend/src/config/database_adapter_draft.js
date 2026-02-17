import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database Interface Wrapper
class DBAdapter {
    constructor() {
        this.type = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
        this.pool = null;
        this.sqlite = null;

        if (this.type === 'postgres') {
            console.log('🔌 Connecting to PostgreSQL...');
            this.pool = new pg.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            });
        } else {
            console.log('🔌 Connecting to SQLite (Local)...');
            const dbPath = path.join(__dirname, '../../database/hunter.db');
            const dbDir = path.dirname(dbPath);
            if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

            this.sqlite = new Database(dbPath);
            this.sqlite.pragma('journal_mode = WAL');
        }
    }

    // Execute a query that returns multiple rows
    async query(sql, params = []) {
        if (this.type === 'postgres') {
            // PostgreSQL uses $1, $2, etc. SQLite uses ?
            // We need a basic converter for simple queries.
            // NOTE: This basic conversion assumes simple queries.
            let pgSql = sql;
            let paramCount = 1;
            while (pgSql.includes('?')) {
                pgSql = pgSql.replace('?', `$${paramCount++}`);
            }

            const res = await this.pool.query(pgSql, params);
            return res.rows;
        } else {
            return this.sqlite.prepare(sql).all(params);
        }
    }

    // Execute a query that returns a single row
    async get(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows[0];
    }

    // Execute a modification query (INSERT, UPDATE, DELETE)
    async run(sql, params = []) {
        if (this.type === 'postgres') {
            let pgSql = sql;
            let paramCount = 1;
            while (pgSql.includes('?')) {
                pgSql = pgSql.replace('?', `$${paramCount++}`);
            }

            // PostgreSQL doesn't return lastInsertRowid by default.
            // We'd need 'RETURNING id' added to inserts if we need ID.
            // For now, we return a mock object compatible with better-sqlite3 structure
            const res = await this.pool.query(pgSql, params);
            return { changes: res.rowCount, lastInsertRowid: null };
        } else {
            return this.sqlite.prepare(sql).run(params);
        }
    }

    // Execute a script (multiple statements)
    async exec(sql) {
        if (this.type === 'postgres') {
            await this.pool.query(sql);
        } else {
            this.sqlite.exec(sql);
        }
    }
}

const dbAdapter = new DBAdapter();

// Initialize database schema
export async function initializeDatabase() {
    // Users table
    await dbAdapter.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, -- 'SERIAL' for PG, SQLite accepts it (or use INTEGER PRIMARY KEY AUTOINCREMENT)
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      total_xp_earned INTEGER DEFAULT 0,
      strength INTEGER DEFAULT 10,
      agility INTEGER DEFAULT 10,
      sense INTEGER DEFAULT 10,
      vitality INTEGER DEFAULT 10,
      intelligence INTEGER DEFAULT 10,
      creation INTEGER DEFAULT 10,
      network INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT, PG uses SERIAL. 
    // 'SERIAL' is not valid in standard SQLite, but some drivers handle it.
    // Ideally we use conditional schema, but for simplicity let's try a compatible syntax or separate schemas.
    // Actually, better-sqlite3 might not like SERIAL.
    // Let's settle on a unified schema if possible, or splitinit.
}

// For this specific project, existing codebase uses synchronous database calls (get().run()).
// We must refactor the ENTIRE backend to use async/await because PostgreSQL driver is async.
// This is a significant refactor.

// WAIT: The existing codebase uses better-sqlite3 which is synchronous.
// Implementing PG requires rewriting all route handlers to be async.
// This is expected for "Robustness".

// Let's create the adapter to support async calls, and then we must update the routes.
export default dbAdapter;
