import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
import { promisify } from 'util';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  async query(sql, params = []) {
    if (this.type === 'postgres') {
      let pgSql = sql;
      let paramCount = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${paramCount++}`);
      }
      try {
        const res = await this.pool.query(pgSql, params);
        return res.rows;
      } catch (err) {
        console.error('PG Query Error:', err);
        throw err;
      }
    } else {
      return this.sqlite.prepare(sql).all(params);
    }
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0];
  }

  async run(sql, params = []) {
    if (this.type === 'postgres') {
      let pgSql = sql;
      let paramCount = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${paramCount++}`);
      }
      try {
        const res = await this.pool.query(pgSql, params);
        // Postgres result doesn't imply exact changes in same way, but rowCount is key
        return { changes: res.rowCount, lastInsertRowid: null };
      } catch (err) {
        console.error('PG Run Error:', err);
        throw err;
      }
    } else {
      return this.sqlite.prepare(sql).run(params);
    }
  }

  async exec(sql) {
    if (this.type === 'postgres') {
      await this.pool.query(sql);
    } else {
      this.sqlite.exec(sql);
    }
  }
}

const db = new DBAdapter();

export async function initializeDatabase() {
  console.log(`Initializing ${db.type} database...`);

  if (db.type === 'postgres') {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
  } else {
    // SQLite Schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Quests & Items (Unified simply for now, check syntax diffs if any)
  // SQLite uses TEXT for id usually if UUID, PG can use TEXT or UUID. 
  // Let's use TEXT for compatibility.

  await db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('E', 'D', 'C', 'B', 'A', 'S')),
      xp_reward INTEGER NOT NULL,
      gold_reward INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed')),
      due_date TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      rarity TEXT NOT NULL CHECK(rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
      type TEXT NOT NULL CHECK(type IN ('weapon', 'armor', 'accessory', 'consumable')),
      obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ Database initialized successfully');
}

export default db;