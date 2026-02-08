/**
 * Item Model
 * Represents inventory items/loot
 */

import db from '../config/database.js';

export class Item {
  /**
   * Get all items
   */
  static getAll(filters = {}) {
    let query = 'SELECT * FROM items';
    const conditions = [];
    const params = [];

    if (filters.rarity) {
      conditions.push('rarity = ?');
      params.push(filters.rarity);
    }

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Default sorting by rarity (mythic first), then by obtained date
    query += ` ORDER BY 
      CASE rarity
        WHEN 'mythic' THEN 5
        WHEN 'legendary' THEN 4
        WHEN 'epic' THEN 3
        WHEN 'rare' THEN 2
        WHEN 'common' THEN 1
      END DESC,
      obtained_at DESC`;

    return db.prepare(query).all(...params);
  }

  /**
   * Get item by ID
   */
  static getById(id) {
    return db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  }

  /**
   * Create new item
   */
  static create(itemData) {
    const { id, name, description, rarity, type } = itemData;
    
    return db.prepare(`
      INSERT INTO items (id, name, description, rarity, type, obtained_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, name, description, rarity, type);
  }

  /**
   * Delete item
   */
  static delete(id) {
    return db.prepare('DELETE FROM items WHERE id = ?').run(id);
  }

  /**
   * Get item statistics
   */
  static getStats() {
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT type) as uniqueTypes,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `).get();

    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM items
      GROUP BY type
      ORDER BY count DESC
    `).all();

    const recentItems = db.prepare(`
      SELECT * FROM items
      ORDER BY obtained_at DESC
      LIMIT 5
    `).all();

    return { overall, byType, recentItems };
  }

  /**
   * Get items by rarity
   */
  static getByRarity(rarity) {
    return db.prepare('SELECT * FROM items WHERE rarity = ?').all(rarity);
  }

  /**
   * Get items by type
   */
  static getByType(type) {
    return db.prepare('SELECT * FROM items WHERE type = ?').all(type);
  }
}

export default Item;