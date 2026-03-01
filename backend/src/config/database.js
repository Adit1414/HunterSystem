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

      // Add error handler to pool to avoid crashing on idle connection errors
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
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

  async transaction(callback) {
    if (this.type === 'postgres') {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Create a proxy adapter that uses this specific client
        const transactionAdapter = {
          query: async (sql, params = []) => {
            let pgSql = sql;
            let paramCount = 1;
            while (pgSql.includes('?')) {
              pgSql = pgSql.replace('?', `$${paramCount++}`);
            }
            const res = await client.query(pgSql, params);
            return res.rows;
          },
          get: async (sql, params = []) => {
            const rows = await transactionAdapter.query(sql, params);
            return rows[0];
          },
          run: async (sql, params = []) => {
            let pgSql = sql;
            let paramCount = 1;
            while (pgSql.includes('?')) {
              pgSql = pgSql.replace('?', `$${paramCount++}`);
            }
            const res = await client.query(pgSql, params);
            return { changes: res.rowCount, lastInsertRowid: null };
          },
          exec: async (sql) => {
            await client.query(sql);
          }
        };

        const result = await callback(transactionAdapter);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // SQLite transaction
      const txn = this.sqlite.transaction((fn) => fn(this));
      return txn(callback);
    }
  }
}

const db = new DBAdapter();

export async function initializeDatabase() {
  try {
    console.log(`Initializing ${db.type} database...`);

    if (db.type === 'postgres') {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          total_xp_earned INTEGER DEFAULT 0,
          strength INTEGER DEFAULT 10,
          creation INTEGER DEFAULT 10,
          network INTEGER DEFAULT 10,
          vitality INTEGER DEFAULT 10,
          intelligence INTEGER DEFAULT 10,
          stat_points INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Migration: Add stat_points if not exists (Postgres)
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stat_points INTEGER DEFAULT 0`);
      } catch (err) {
        console.log('Column stat_points likely exists or error adding it:', err.message);
      }

      // Migration: Add creation/network if not exists
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS creation INTEGER DEFAULT 10`);
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS network INTEGER DEFAULT 10`);
      } catch (err) {
        console.log('Columns creation/network likely exist:', err.message);
      }

    } else {
      // SQLite Schema
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          total_xp_earned INTEGER DEFAULT 0,
          strength INTEGER DEFAULT 10,
          creation INTEGER DEFAULT 10,
          network INTEGER DEFAULT 10,
          vitality INTEGER DEFAULT 10,
          intelligence INTEGER DEFAULT 10,
          stat_points INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Migration: Check and add columns (SQLite)
      try {
        const columns = await db.query("PRAGMA table_info(users)");

        if (!columns.some(col => col.name === 'stat_points')) {
          console.log('Migrating: Adding stat_points...');
          await db.exec("ALTER TABLE users ADD COLUMN stat_points INTEGER DEFAULT 0");
        }

        if (!columns.some(col => col.name === 'creation')) {
          console.log('Migrating: Adding creation...');
          await db.exec("ALTER TABLE users ADD COLUMN creation INTEGER DEFAULT 10");
        }

        if (!columns.some(col => col.name === 'network')) {
          console.log('Migrating: Adding network...');
          await db.exec("ALTER TABLE users ADD COLUMN network INTEGER DEFAULT 10");
        }

      } catch (err) {
        console.error('Migration Error (SQLite):', err.message);
      }
    }

    // Quests & Items 
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'normal' CHECK(type IN ('normal', 'daily'))
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

    // System Config / Tracking for daily resets
    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // --- SEED INITIAL USER ---
    // Check if user exists
    let userCount;
    if (db.type === 'postgres') {
      const res = await db.query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(res[0].count);
    } else {
      userCount = db.get('SELECT COUNT(*) as count FROM users').count;
    }

    if (userCount === 0) {
      console.log('🌱 Seeding initial user...');
      await db.run(`
            INSERT INTO users (level, xp, total_xp_earned, strength, creation, network, vitality, intelligence, stat_points)
            VALUES (1, 0, 0, 10, 10, 10, 10, 10, 0)
        `);
      console.log('✓ Initial user created');
    }
    // -------------------------

    // --- MIGRATIONS FOR ATTRIBUTE XP ---
    try {
      if (db.type === 'postgres') {
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_strength INTEGER DEFAULT 0`);
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_creation INTEGER DEFAULT 0`);
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_network INTEGER DEFAULT 0`);
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_vitality INTEGER DEFAULT 0`);
        await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_intelligence INTEGER DEFAULT 0`);
        await db.exec(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS attribute TEXT DEFAULT 'strength'`);
        await db.exec(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'normal'`);
      } else {
        const columns = await db.query("PRAGMA table_info(users)");
        if (!columns.some(col => col.name === 'xp_strength')) {
          console.log('Migrating: Adding xp_strength...');
          await db.exec("ALTER TABLE users ADD COLUMN xp_strength INTEGER DEFAULT 0");
        }
        if (!columns.some(col => col.name === 'xp_creation')) {
          console.log('Migrating: Adding xp_creation...');
          await db.exec("ALTER TABLE users ADD COLUMN xp_creation INTEGER DEFAULT 0");
        }
        if (!columns.some(col => col.name === 'xp_network')) {
          console.log('Migrating: Adding xp_network...');
          await db.exec("ALTER TABLE users ADD COLUMN xp_network INTEGER DEFAULT 0");
        }
        if (!columns.some(col => col.name === 'xp_vitality')) {
          console.log('Migrating: Adding xp_vitality...');
          await db.exec("ALTER TABLE users ADD COLUMN xp_vitality INTEGER DEFAULT 0");
        }
        if (!columns.some(col => col.name === 'xp_intelligence')) {
          console.log('Migrating: Adding xp_intelligence...');
          await db.exec("ALTER TABLE users ADD COLUMN xp_intelligence INTEGER DEFAULT 0");
        }

        const questColumns = await db.query("PRAGMA table_info(quests)");
        if (!questColumns.some(col => col.name === 'attribute')) {
          console.log('Migrating: Adding attribute to quests...');
          await db.exec("ALTER TABLE quests ADD COLUMN attribute TEXT DEFAULT 'strength'");
        }
        if (!questColumns.some(col => col.name === 'type')) {
          console.log('Migrating: Adding type to quests...');
          await db.exec("ALTER TABLE quests ADD COLUMN type TEXT DEFAULT 'normal'");
        }
      }
    } catch (err) {
      console.error('Migration Error (Attribute XP / Daily Type):', err.message);
    }
    // -----------------------------------

    console.log('✓ Database initialized successfully');
  }
  catch (error) {
    console.error('❌ Database Initialization Failed:', error.message);
    if (error.code === 'ENETUNREACH' && process.env.DATABASE_URL?.includes('supabase')) {
      console.error('💡 TIP: You might be using the Supabase direct connection (port 5432) which requires IPv6.');
      console.error('   Please switch to the "Transaction Mode" connection string (port 6543) which supports IPv4.');
    }
    throw error;
  }
}

export default db;