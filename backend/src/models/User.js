/**
 * User Model
 * Represents player progress and stats
 */

import db from '../config/database.js';

export class User {
  /**
   * Get user by ID
   */
  static async getById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  /**
   * Get the default user (single-player app)
   */
  static async getDefault() {
    return await this.getById(1);
  }

  /**
   * Update user progress
   */
  static async update(id, data) {
    const { level, xp, total_xp_earned } = data;

    return await db.run(`
      UPDATE users 
      SET level = ?, xp = ?, total_xp_earned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [level, xp, total_xp_earned, id]);
  }

  /**
   * Reset user progress
   */
  static async reset(id) {
    return await db.run(`
      UPDATE users 
      SET level = 1, xp = 0, total_xp_earned = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }

  /**
   * Get user statistics
   */
  static async getStats(id) {
    const questStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM quests
    `);

    const itemStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `);

    return { quests: questStats, items: itemStats };
  }
}

export default User;