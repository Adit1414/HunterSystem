import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database/hunter.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better performance for concurrent reads

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
export function initializeDatabase() {
  // Users table - stores player progress
  db.exec(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add columns if they don't exist (for existing databases)
  try {
    const columns = db.pragma('table_info(users)');
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('strength')) db.prepare('ALTER TABLE users ADD COLUMN strength INTEGER DEFAULT 10').run();
    if (!columnNames.includes('agility')) db.prepare('ALTER TABLE users ADD COLUMN agility INTEGER DEFAULT 10').run();
    if (!columnNames.includes('sense')) db.prepare('ALTER TABLE users ADD COLUMN sense INTEGER DEFAULT 10').run();
    if (!columnNames.includes('vitality')) db.prepare('ALTER TABLE users ADD COLUMN vitality INTEGER DEFAULT 10').run();
    if (!columnNames.includes('intelligence')) db.prepare('ALTER TABLE users ADD COLUMN intelligence INTEGER DEFAULT 10').run();
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Quests table - stores all quests (active, completed, failed)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('E', 'D', 'C', 'B', 'A', 'S')),
      xp_reward INTEGER NOT NULL,
      gold_reward INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed')),
      due_date DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Items table - stores inventory items
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      rarity TEXT NOT NULL CHECK(rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
      type TEXT NOT NULL CHECK(type IN ('weapon', 'armor', 'accessory', 'consumable')),
      obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
    CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests(difficulty);
    CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
  `);

  // Initialize default user if none exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO users (level, xp, total_xp_earned) 
      VALUES (1, 0, 0)
    `).run();
    console.log('✓ Default user created');
  }

  console.log('✓ Database initialized successfully');
}

export default db;