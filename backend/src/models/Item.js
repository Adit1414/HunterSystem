/**
 * Item Model
 * Represents inventory items/loot
 */

import db from '../config/database.js';

export class Item {
  /**
   * Get all items
   */
  static async getAll(filters = {}) {
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

    return await db.query(query, params);
  }

  /**
   * Get item by ID
   */
  static async getById(id) {
    return await db.get('SELECT * FROM items WHERE id = ?', [id]);
  }

  /**
   * Create new item
   */
  static async create(itemData) {
    const { id, name, description, rarity, type } = itemData;

    return await db.run(`
      INSERT INTO items (id, name, description, rarity, type, obtained_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, name, description, rarity, type]);
  }

  /**
   * Delete item
   */
  static async delete(id) {
    return await db.run('DELETE FROM items WHERE id = ?', [id]);
  }

  /**
   * Get item statistics
   */
  static async getStats() {
    const overall = await db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT type) as uniqueTypes,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `);

    const byType = await db.query(`
      SELECT type, COUNT(*) as count
      FROM items
      GROUP BY type
      ORDER BY count DESC
    `);

    const recentItems = await db.query(`
      SELECT * FROM items
      ORDER BY obtained_at DESC
      LIMIT 5
    `);

    return { overall, byType, recentItems };
  }

  /**
   * Get items by rarity
   */
  static async getByRarity(rarity) {
    return await db.query('SELECT * FROM items WHERE rarity = ?', [rarity]);
  }

  /**
   * Get items by type
   */
  static async getByType(type) {
    return await db.query('SELECT * FROM items WHERE type = ?', [type]);
  }
}

export default Item;