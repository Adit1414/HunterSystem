/**
 * User Model
 * Represents player progress and stats
 */

import db from '../config/database.js';

export class User {
  /**
   * Get user by ID
   */
  static getById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  /**
   * Get the default user (single-player app)
   */
  static getDefault() {
    return this.getById(1);
  }

  /**
   * Update user progress
   */
  static update(id, data) {
    const { level, xp, total_xp_earned } = data;
    
    return db.prepare(`
      UPDATE users 
      SET level = ?, xp = ?, total_xp_earned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(level, xp, total_xp_earned, id);
  }

  /**
   * Reset user progress
   */
  static reset(id) {
    return db.prepare(`
      UPDATE users 
      SET level = 1, xp = 0, total_xp_earned = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  /**
   * Get user statistics
   */
  static getStats(id) {
    const questStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM quests
    `).get();

    const itemStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `).get();

    return { quests: questStats, items: itemStats };
  }
}

export default User;