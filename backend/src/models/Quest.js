/**
 * Quest Model
 * Represents tasks/quests in the system
 */

import db from '../config/database.js';

export class Quest {
  /**
   * Get all quests
   */
  static getAll(filters = {}) {
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params);
  }

  /**
   * Get quest by ID
   */
  static getById(id) {
    return db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
  }

  /**
   * Create new quest
   */
  static create(questData) {
    const { id, title, description, difficulty, xp_reward, due_date } = questData;
    
    return db.prepare(`
      INSERT INTO quests (id, title, description, difficulty, xp_reward, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(id, title, description, difficulty, xp_reward, due_date || null);
  }

  /**
   * Update quest
   */
  static update(id, updates) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }

    params.push(id);

    return db.prepare(`
      UPDATE quests 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...params);
  }

  /**
   * Delete quest
   */
  static delete(id) {
    return db.prepare('DELETE FROM quests WHERE id = ?').run(id);
  }

  /**
   * Complete quest
   */
  static complete(id) {
    return db.prepare(`
      UPDATE quests
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  /**
   * Fail quest
   */
  static fail(id) {
    return db.prepare(`
      UPDATE quests
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  /**
   * Get recent E-rank quests (for anti-grind)
   */
  static getRecentEasyQuests() {
    return db.prepare(`
      SELECT COUNT(*) as count 
      FROM quests 
      WHERE difficulty = 'E' 
      AND status = 'completed'
      AND completed_at > datetime('now', '-24 hours')
    `).get();
  }
}

export default Quest;