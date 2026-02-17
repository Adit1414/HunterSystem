/**
 * Quest Routes
 * Handles quest CRUD operations and completion logic
 */

import express from 'express';
import { randomUUID } from 'crypto';
import db from '../config/database.js';
import Quest from '../models/Quest.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
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
router.get('/', async (req, res) => {
  try {
    const { status, difficulty } = req.query;

    // Use Quest model
    const quests = await Quest.getAll({ status, difficulty });

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
router.get('/:id', async (req, res) => {
  try {
    const quest = await Quest.getById(req.params.id);

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

    await Quest.create({
      id: questId,
      title,
      description: finalDescription,
      difficulty,
      xp_reward: xpReward,
      due_date: dueDate
    });

    const quest = await Quest.getById(questId);

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
router.put('/:id', async (req, res) => {
  try {
    const { title, description, difficulty, dueDate, status } = req.body;

    const quest = await Quest.getById(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Don't allow editing completed/failed quests
    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Cannot edit completed or failed quests' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.due_date = dueDate;

    if (difficulty !== undefined) {
      const validDifficulties = ['E', 'D', 'C', 'B', 'A', 'S'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
      }
      updates.difficulty = difficulty;
      const xpRewards = { 'E': 50, 'D': 100, 'C': 200, 'B': 400, 'A': 800, 'S': 1600 };
      updates.xp_reward = xpRewards[difficulty];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await Quest.update(req.params.id, updates);

    const updatedQuest = await Quest.getById(req.params.id);

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
router.delete('/:id', async (req, res) => {
  try {
    const quest = await Quest.getById(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await Quest.delete(req.params.id);

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
router.post('/:id/complete', async (req, res) => {
  try {
    const quest = await Quest.getById(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    // Get current user
    const user = await User.getById(1);

    // Check if completed on time
    const completedOnTime = quest.due_date
      ? new Date() <= new Date(quest.due_date)
      : false;

    // Check recent E-rank quest spam (anti-grind)
    const recentEasyQuests = await Quest.getRecentEasyQuests();
    const recentCount = recentEasyQuests ? recentEasyQuests.count : 0;

    // Calculate XP with bonuses/penalties
    const xpGained = calculateQuestXP(quest, { completedOnTime, recentEasyQuests: recentCount });

    // Update User Progress FIRST to determine level up / rewards
    // We pass the quest attribute.
    const xpResult = await User.addXp(user.id, xpGained, quest.attribute || 'strength');

    // Generate special rewards from level up
    const specialRewards = [];
    if (xpResult.leveledUp) {
      let lvl = user.level + 1;
      for (let i = 0; i < xpResult.levelsGained; i++, lvl++) {
        if (lvl % 10 === 0) specialRewards.push({ type: 'legendary_choice', message: `Level ${lvl} Milestone!` });
        else if (lvl % 5 === 0) specialRewards.push({ type: 'guaranteed_rare', message: `Level ${lvl} Milestone!` });
      }
    }

    // Generate Item Rewards (based on difficulty and if we leveled up)
    // We reconstruct a partial `levelUpResult` to pass to `generateQuestRewards` if needed, 
    // but `generateQuestRewards` mainly expects `rewards` array from levelUpResult.
    const rewards = generateQuestRewards(quest.difficulty, specialRewards);

    // Start transaction
    await db.transaction(async (tx) => {
      // Update Quest status
      await tx.run(`
        UPDATE quests
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [quest.id]);

      // Insert Items
      for (const item of rewards.items) {
        await tx.run(`
          INSERT INTO items (id, name, description, rarity, type, obtained_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [item.id, item.name, item.description, item.rarity, item.type]);
      }
    });

    // Fetch updated user for response
    const updatedUser = await User.getById(1);

    res.json({
      message: 'Quest completed!',
      xpGained,
      levelUp: xpResult.leveledUp ? {
        oldLevel: user.level,
        newLevel: xpResult.newLevel,
        levelsGained: xpResult.levelsGained,
        statPointsGained: 0, // Automated now
        statChanges: xpResult.statChanges
      } : null,
      rewards: {
        items: rewards.items,
        special: specialRewards
      },
      user: {
        level: updatedUser.level,
        xp: updatedUser.xp,
        totalXpEarned: updatedUser.total_xp_earned,
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
router.post('/:id/fail', async (req, res) => {
  try {
    const quest = await Quest.getById(req.params.id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status !== 'active') {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    await Quest.fail(quest.id);

    res.json({ message: 'Quest failed' });

  } catch (error) {
    console.error('Error failing quest:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

export default router;