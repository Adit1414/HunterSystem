/**
 * Quest Model
 * Represents tasks/quests in the system
 */

import db from '../config/database.js';

export class Quest {
  /**
   * Get all quests
   */
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM quests';
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.difficulty) {
      conditions.push('difficulty = ?');
      params.push(filters.difficulty);
    }

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    return await db.query(query, params);
  }

  /**
   * Get quest by ID
   */
  static async getById(id) {
    return await db.get('SELECT * FROM quests WHERE id = ?', [id]);
  }

  /**
   * Create new quest
   */
  static async create(questData) {
    const { id, title, description, difficulty, xp_reward, due_date, attribute } = questData;

    return await db.run(`
      INSERT INTO quests (id, title, description, difficulty, xp_reward, due_date, status, attribute)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `, [id, title, description, difficulty, xp_reward, due_date || null, attribute || 'strength']);
  }

  /**
   * Update quest
   */
  static async update(id, updates) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }

    params.push(id);

    return await db.run(`
      UPDATE quests 
      SET ${fields.join(', ')}
      WHERE id = ?
    `, params);
  }

  /**
   * Delete quest
   */
  static async delete(id) {
    return await db.run('DELETE FROM quests WHERE id = ?', [id]);
  }

  /**
   * Complete quest
   */
  static async complete(id) {
    return await db.run(`
      UPDATE quests
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }

  /**
   * Fail quest
   */
  static async fail(id) {
    return await db.run(`
      UPDATE quests
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }

  /**
   * Get recent E-rank quests (for anti-grind)
   */
  static async getRecentEasyQuests() {
    if (db.type === 'postgres') {
      return await db.get(`
        SELECT COUNT(*) as count 
        FROM quests 
        WHERE difficulty = 'E' 
        AND status = 'completed'
        AND completed_at > NOW() - INTERVAL '1 day'
      `);
    } else {
      // SQLite
      return await db.get(`
      SELECT COUNT(*) as count 
      FROM quests 
      WHERE difficulty = 'E' 
      AND status = 'completed'
      AND completed_at > datetime('now', '-24 hours')
    `);
    }
  }
}

export default Quest;