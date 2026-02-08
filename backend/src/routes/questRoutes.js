/**
 * Quest Routes
 * Handles quest CRUD operations and completion logic
 */

import express from 'express';
import { randomUUID } from 'crypto';
import db from '../config/database.js';
import {
  calculateQuestXP,
  processLevelUp
} from '../services/progressionEngine.js';
import { generateQuestRewards } from '../services/rewardGenerator.js';
import { generateQuestFlavor } from '../services/aiFlavorGenerator.js';

const router = express.Router();

/**
 * GET /api/quests
 * Get all quests with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { status, difficulty } = req.query;

    let query = 'SELECT * FROM quests';
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (difficulty) {
      conditions.push('difficulty = ?');
      params.push(difficulty);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const quests = db.prepare(query).all(...params);

    res.json({ quests });

  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

/**
 * GET /api/quests/:id
 * Get single quest by ID
 */
router.get('/:id', (req, res) => {
  try {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json({ quest });

  } catch (error) {
    console.error('Error fetching quest:', error);
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

/**
 * POST /api/quests
 * Create new quest
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, difficulty, dueDate } = req.body;

    // Validation
    if (!title || !difficulty) {
      return res.status(400).json({ error: 'Title and difficulty are required' });
    }

    const validDifficulties = ['E', 'D', 'C', 'B', 'A', 'S'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Calculate XP reward based on difficulty
    const xpRewards = { 'E': 50, 'D': 100, 'C': 200, 'B': 400, 'A': 800, 'S': 1600 };
    const xpReward = xpRewards[difficulty];

    // Generate flavor text (AI or template)
    let finalDescription = description;
    if (!description || description.trim() === '') {
      finalDescription = await generateQuestFlavor(title, difficulty);
    }

    const questId = randomUUID();

    db.prepare(`
      INSERT INTO quests (id, title, description, difficulty, xp_reward, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(questId, title, finalDescription, difficulty, xpReward, dueDate || null);

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);

    res.status(201).json({ quest });

  } catch (error) {
    console.error('Error creating quest:', error);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

/**
 * PUT /api/quests/:id
 * Update existing quest
 */
router.put('/:id', (req, res) => {
  try {
    const { title, description, difficulty, dueDate, status } = req.body;

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Don't allow editing completed/failed quests
    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Cannot edit completed or failed quests' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (difficulty !== undefined) {
      const validDifficulties = ['E', 'D', 'C', 'B', 'A', 'S'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
      }
      updates.push('difficulty = ?');
      params.push(difficulty);

      // Recalculate XP reward
      const xpRewards = { 'E': 50, 'D': 100, 'C': 200, 'B': 400, 'A': 800, 'S': 1600 };
      updates.push('xp_reward = ?');
      params.push(xpRewards[difficulty]);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(dueDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    db.prepare(`
      UPDATE quests 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    const updatedQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);

    res.json({ quest: updatedQuest });

  } catch (error) {
    console.error('Error updating quest:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

/**
 * DELETE /api/quests/:id
 * Delete quest
 */
router.delete('/:id', (req, res) => {
  try {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    db.prepare('DELETE FROM quests WHERE id = ?').run(req.params.id);

    res.json({ message: 'Quest deleted successfully' });

  } catch (error) {
    console.error('Error deleting quest:', error);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

/**
 * POST /api/quests/:id/complete
 * Complete a quest - awards XP, items, handles level ups
 */
router.post('/:id/complete', (req, res) => {
  try {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    // Get current user
    const user = db.prepare('SELECT * FROM users WHERE id = 1').get();

    // Check if completed on time
    const completedOnTime = quest.due_date
      ? new Date() <= new Date(quest.due_date)
      : false;

    // Check recent E-rank quest spam (anti-grind)
    const recentEasyQuests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM quests 
      WHERE difficulty = 'E' 
      AND status = 'completed'
      AND completed_at > datetime('now', '-24 hours')
    `).get().count;

    // Calculate XP with bonuses/penalties
    const xpGained = calculateQuestXP(quest, { completedOnTime, recentEasyQuests });

    // Process potential level up
    const levelUpResult = processLevelUp(user.level, user.xp, xpGained);

    // Generate rewards (items + special rewards from level up)
    const rewards = generateQuestRewards(quest.difficulty, levelUpResult.rewards);

    // Calculate stats increase if leveled up
    let statPointsGained = 0;
    if (levelUpResult.leveledUp) {
      statPointsGained = levelUpResult.levelsGained * 5;
    }

    // Start transaction
    const updateUser = db.prepare(`
      UPDATE users 
      SET level = ?, xp = ?, total_xp_earned = total_xp_earned + ?, 
          stat_points = stat_points + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    const updateQuest = db.prepare(`
      UPDATE quests
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertItem = db.prepare(`
      INSERT INTO items (id, name, description, rarity, type, obtained_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Execute transaction
    const transaction = db.transaction(() => {
      updateUser.run(
        levelUpResult.newLevel,
        levelUpResult.newXP,
        xpGained,
        statPointsGained
      );
      updateQuest.run(quest.id);

      // Add items to inventory
      for (const item of rewards.items) {
        insertItem.run(item.id, item.name, item.description, item.rarity, item.type);
      }
    });

    transaction();

    // Fetch updated user to return absolute values if needed, but we return relative for modal
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = 1').get();

    res.json({
      message: 'Quest completed!',
      xpGained,
      levelUp: levelUpResult.leveledUp ? {
        oldLevel: user.level,
        newLevel: levelUpResult.newLevel,
        levelsGained: levelUpResult.levelsGained,
        statPointsGained: statPointsGained // Passing points gained
      } : null,
      rewards: {
        items: rewards.items,
        special: rewards.special
      },
      user: {
        level: levelUpResult.newLevel,
        xp: levelUpResult.newXP,
        totalXpEarned: user.total_xp_earned + xpGained,
        stats: { // Return full stats for dashboard update
          strength: updatedUser.strength,
          agility: updatedUser.agility,
          sense: updatedUser.sense,
          vitality: updatedUser.vitality,
          intelligence: updatedUser.intelligence,
          statPoints: updatedUser.stat_points
        }
      }
    });

  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

/**
 * POST /api/quests/:id/fail
 * Mark quest as failed
 */
router.post('/:id/fail', (req, res) => {
  try {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    db.prepare(`
      UPDATE quests
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quest.id);

    res.json({ message: 'Quest failed' });

  } catch (error) {
    console.error('Error failing quest:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

export default router;