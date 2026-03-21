/**
 * Quest Model
 * Represents tasks/quests in the system
 */

import db from '../config/database.js';

export class Quest {
  /**
   * Get all quests (scoped by user_id)
   */
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM quests';
    const conditions = [];
    const params = [];

    if (filters.user_id) {
      conditions.push('user_id = ?');
      params.push(filters.user_id);
    }

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
   * Get quest by ID (optionally scoped by user_id for authorization)
   */
  static async getById(id, userId = null) {
    if (userId) {
      return await db.get('SELECT * FROM quests WHERE id = ? AND user_id = ?', [id, userId]);
    }
    return await db.get('SELECT * FROM quests WHERE id = ?', [id]);
  }

  /**
   * Create new quest
   */
  static async create(questData) {
    const { id, user_id, title, description, difficulty, xp_reward, due_date, attribute } = questData;

    return await db.run(`
      INSERT INTO quests (id, user_id, title, description, difficulty, xp_reward, due_date, status, attribute)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `, [id, user_id, title, description, difficulty, xp_reward, due_date || null, attribute || 'strength']);
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
   * Get recent E-rank quests (for anti-grind, scoped by user)
   */
  static async getRecentEasyQuests(userId = null) {
    const userFilter = userId ? ' AND user_id = ?' : '';
    const params = userId ? [userId] : [];

    if (db.type === 'postgres') {
      return await db.get(`
        SELECT COUNT(*) as count 
        FROM quests 
        WHERE difficulty = 'E' 
        AND status = 'completed'
        AND completed_at > NOW() - INTERVAL '1 day'${userFilter}
      `, params);
    } else {
      // SQLite
      return await db.get(`
      SELECT COUNT(*) as count 
      FROM quests 
      WHERE difficulty = 'E' 
      AND status = 'completed'
      AND completed_at > datetime('now', '-24 hours')${userFilter}
    `, params);
    }
  }

  /**
   * Get archived quests (recent completed/failed, scoped by user)
   */
  static async getArchived(limit = 10, userId = null) {
    const userFilter = userId ? ' AND user_id = ?' : '';

    if (db.type === 'postgres') {
      const params = userId ? [userId, limit] : [limit];
      return await db.query(`
          SELECT * FROM quests 
          WHERE status IN ('completed', 'failed')${userFilter}
          ORDER BY completed_at DESC
          LIMIT $${userId ? '2' : '1'}
        `, params);
    } else {
      // SQLite uses ?
      const params = userId ? [userId, limit] : [limit];
      return await db.query(`
          SELECT * FROM quests 
          WHERE status IN ('completed', 'failed')${userFilter}
          ORDER BY completed_at DESC
          LIMIT ?
        `, params);
    }
  }
}

export default Quest;