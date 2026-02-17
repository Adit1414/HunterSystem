/**
 * User Routes
 * Handles player progress, stats, and profile
 */

import express from 'express';
import db from '../config/database.js';
import User from '../models/User.js';
import {
  getXPForNextLevel,
  getRankName,
  getProgressToNextLevel
} from '../services/progressionEngine.js';

const router = express.Router();

/**
 * GET /api/user
 * Get current user progress and stats
 */
router.get('/', async (req, res) => {
  try {
    // Use User model
    const user = await User.getById(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate additional stats
    const xpForNextLevel = getXPForNextLevel(user.level);
    const progressPercentage = getProgressToNextLevel(user.xp, user.level);
    const rankName = getRankName(user.level);

    // Get stats from User model
    const stats = await User.getStats(1);

    res.json({
      user: {
        id: user.id,
        level: user.level,
        xp: user.xp,
        totalXpEarned: user.total_xp_earned,
        xpForNextLevel,
        progressPercentage,
        rankName,
        createdAt: user.created_at,
        stats: {
          strength: user.strength || 10,
          creation: user.creation || 10,
          network: user.network || 10,
          vitality: user.vitality || 10,
          intelligence: user.intelligence || 10,
          statPoints: user.stat_points || 0
        }
      },
      stats: {
        quests: stats.quests,
        items: stats.items
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * POST /api/user/stats
 * Allocate stat points
 */
router.post('/stats', async (req, res) => {
  try {
    const { strength, creation, network, vitality, intelligence } = req.body;

    // Calculate total points to spend
    const pointsToSpend = (strength || 0) + (creation || 0) + (network || 0) + (vitality || 0) + (intelligence || 0);

    if (pointsToSpend <= 0) {
      return res.status(400).json({ error: 'No points specified' });
    }

    const user = await User.getById(1);

    if (user.stat_points < pointsToSpend) {
      return res.status(400).json({ error: 'Not enough stat points' });
    }

    // Update stats using transaction pattern
    await db.transaction(async (tx) => {
      await tx.run(`
        UPDATE users
        SET strength = strength + ?,
            creation = creation + ?,
            network = network + ?,
            vitality = vitality + ?,
            intelligence = intelligence + ?,
            stat_points = stat_points - ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [
        strength || 0,
        creation || 0,
        network || 0,
        vitality || 0,
        intelligence || 0,
        pointsToSpend
      ]);
    });

    const updatedUser = await User.getById(1);

    res.json({
      message: 'Stats updated',
      user: {
        stats: {
          strength: updatedUser.strength,
          creation: updatedUser.creation,
          network: updatedUser.network,
          vitality: updatedUser.vitality,
          intelligence: updatedUser.intelligence,
          statPoints: updatedUser.stat_points
        }
      }
    });

  } catch (error) {
    console.error('Error allocating stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

/**
 * POST /api/user/reset
 * Reset all progress (for testing or fresh start)
 */
router.post('/reset', async (req, res) => {
  try {
    await db.transaction(async (tx) => {
      // Reset user progress (We use direct SQL here as User.reset uses db which is global)
      // Actually User.reset uses 'db', which is the global adapter.
      // To participate in transaction, we should use 'tx' directly here or pass tx to model.
      // For simplicity, let's use SQL here directly or assuming non-interleaved logic?
      // No, we must use tx.

      await tx.run(`
        UPDATE users 
        SET level = 1, xp = 0, total_xp_earned = 0,
            strength = 10, creation = 10, network = 10, vitality = 10, intelligence = 10,
            stat_points = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);

      // Delete all quests
      await tx.run('DELETE FROM quests');

      // Delete all items
      await tx.run('DELETE FROM items');
    });

    res.json({
      message: 'Progress reset successfully',
      user: {
        level: 1,
        xp: 0,
        totalXpEarned: 0
      }
    });

  } catch (error) {
    console.error('Error resetting progress:', error);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

/**
 * GET /api/user/achievements
 * Get achievement progress
 */
router.get('/achievements', async (req, res) => {
  try {
    const user = await User.getById(1);

    // Custom counts not in User model yet
    const questCount = await db.get('SELECT COUNT(*) as count FROM quests WHERE status = ?', ['completed']);
    const itemCount = await db.get('SELECT COUNT(*) as count FROM items');
    // For IN clause or OR, we can use simple SQL
    const legendaryCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE rarity = 'legendary' OR rarity = 'mythic'
    `);

    // Define achievements
    const achievements = [
      {
        id: 'first_quest',
        name: 'First Steps',
        description: 'Complete your first quest',
        unlocked: questCount.count >= 1,
        progress: Math.min(1, questCount.count),
        max: 1
      },
      {
        id: 'quest_master',
        name: 'Quest Master',
        description: 'Complete 100 quests',
        unlocked: questCount.count >= 100,
        progress: questCount.count,
        max: 100
      },
      {
        id: 'level_10',
        name: 'Rising Hunter',
        description: 'Reach level 10',
        unlocked: user.level >= 10,
        progress: user.level,
        max: 10
      },
      {
        id: 'level_50',
        name: 'S-Rank Hunter',
        description: 'Reach level 50',
        unlocked: user.level >= 50,
        progress: user.level,
        max: 50
      },
      {
        id: 'collector',
        name: 'Collector',
        description: 'Obtain 50 items',
        unlocked: itemCount.count >= 50,
        progress: itemCount.count,
        max: 50
      },
      {
        id: 'legendary_hunter',
        name: 'Legendary Hunter',
        description: 'Obtain 10 legendary or mythic items',
        unlocked: legendaryCount.count >= 10,
        progress: legendaryCount.count,
        max: 10
      }
    ];

    res.json({ achievements });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;