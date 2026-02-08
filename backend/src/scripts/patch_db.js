import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database/hunter.db');

const db = new Database(dbPath);

console.log('Checking database schema...');

try {
    const columns = db.pragma('table_info(users)');
    const columnNames = columns.map(c => c.name);
    console.log('Current columns:', columnNames);

    if (!columnNames.includes('stat_points')) {
        console.log('Adding stat_points column...');
        db.prepare('ALTER TABLE users ADD COLUMN stat_points INTEGER DEFAULT 0').run();
        console.log('stat_points column added successfully.');
    } else {
        console.log('stat_points column already exists.');
    }
} catch (error) {
    console.error('Error patching database:', error);
}

console.log('Patch complete.');
