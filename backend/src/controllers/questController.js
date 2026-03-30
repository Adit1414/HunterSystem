import { randomUUID } from 'crypto';
import db from '../config/database.js';
import Quest from '../models/Quest.js';
import User from '../models/User.js';
import { calculateQuestXP } from '../services/progressionEngine.js';
import { generateQuestRewards } from '../services/rewardGenerator.js';
import { generateQuestFlavor } from '../services/aiFlavorGenerator.js';
import { GAME_CONSTANTS } from '../config/gameConstants.js';

export const getAllQuests = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const { status, difficulty, type } = req.query;
        const quests = await Quest.getAll({ status, difficulty, type, user_id: userId });

        // Add calculated XP to each quest
        const enhancedQuests = quests.map(quest => ({
            ...quest,
            calculated_xp: calculateQuestXP(quest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        }));

        res.json({ quests: enhancedQuests });
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ error: 'Failed to fetch quests' });
    }
};

export const getDailyQuests = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const quests = await Quest.getAll({ type: 'daily', user_id: userId });

        // Add calculated XP to each quest
        const enhancedQuests = quests.map(quest => ({
            ...quest,
            calculated_xp: calculateQuestXP(quest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        }));

        const now = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffsetMs);
        const istMidnight = new Date(istNow);
        istMidnight.setUTCHours(24, 0, 0, 0);

        const msToMidnight = istMidnight.getTime() - istNow.getTime();
        const resetAtDate = new Date(istMidnight.getTime() - istOffsetMs);

        res.json({
            quests: enhancedQuests,
            msToMidnight,
            resetAt: resetAtDate.toISOString()
        });
    } catch (error) {
        console.error('Error fetching daily quests:', error);
        res.status(500).json({ error: 'Failed to fetch daily quests' });
    }
};

export const getArchivedQuests = async (req, res) => {
    try {
        const quests = await Quest.getArchived(10, req.dbUserId);
        res.json({ quests });
    } catch (error) {
        console.error('Error fetching archived quests:', error);
        res.status(500).json({ error: 'Failed to fetch archived quests' });
    }
};

export const getQuestById = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const quest = await Quest.getById(req.params.id, userId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });

        const enhancedQuest = {
            ...quest,
            calculated_xp: calculateQuestXP(quest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        };

        res.json({ quest: enhancedQuest });
    } catch (error) {
        console.error('Error fetching quest:', error);
        res.status(500).json({ error: 'Failed to fetch quest' });
    }
};

export const createQuest = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const { title, description, difficulty, dueDate, attribute } = req.body;
        if (!title || !difficulty) return res.status(400).json({ error: 'Title and difficulty are required' });

        const validDifficulties = Object.keys(GAME_CONSTANTS.XP_REWARDS);
        if (!validDifficulties.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty level' });

        const xpReward = GAME_CONSTANTS.XP_REWARDS[difficulty];
        let finalDescription = description;
        if (!description || description.trim() === '') {
            finalDescription = await generateQuestFlavor(title, difficulty);
        }

        const questId = randomUUID();
        await Quest.create({
            id: questId,
            user_id: userId,
            title,
            description: finalDescription,
            difficulty,
            xp_reward: xpReward,
            due_date: dueDate,
            attribute: attribute || 'strength'
        });

        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const quest = await Quest.getById(questId, userId);
        const enhancedQuest = {
            ...quest,
            calculated_xp: calculateQuestXP(quest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        };

        res.status(201).json({ quest: enhancedQuest });
    } catch (error) {
        console.error('Error creating quest:', error);
        res.status(500).json({ error: 'Failed to create quest' });
    }
};

export const updateQuest = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const { title, description, difficulty, dueDate, status } = req.body;
        const quest = await Quest.getById(req.params.id, userId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        if (quest.status !== 'active') return res.status(400).json({ error: 'Cannot edit completed or failed quests' });

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (dueDate !== undefined) updates.due_date = dueDate;

        if (difficulty !== undefined) {
            const validDifficulties = Object.keys(GAME_CONSTANTS.XP_REWARDS);
            if (!validDifficulties.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty level' });
            updates.difficulty = difficulty;
            updates.xp_reward = GAME_CONSTANTS.XP_REWARDS[difficulty];
        }

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

        await Quest.update(req.params.id, updates);

        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const updatedQuest = await Quest.getById(req.params.id, userId);
        const enhancedQuest = {
            ...updatedQuest,
            calculated_xp: calculateQuestXP(updatedQuest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        };
        res.json({ quest: enhancedQuest });
    } catch (error) {
        console.error('Error updating quest:', error);
        res.status(500).json({ error: 'Failed to update quest' });
    }
};

export const updateDailyQuest = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const { title, description } = req.body;
        const quest = await Quest.getById(req.params.id, userId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        if (quest.type !== 'daily') return res.status(400).json({ error: 'This endpoint is only for daily quests' });
        if (quest.status !== 'active') return res.status(400).json({ error: 'Cannot edit completed daily quests' });

        const updates = {};
        if (title !== undefined && title.trim() !== '') updates.title = title.trim();
        if (description !== undefined && description.trim() !== '') updates.description = description.trim();

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Provide a title or description to update' });

        await Quest.update(req.params.id, updates);

        const user = await User.getById(userId);
        const userLevel = user ? user.level : 1;

        const updatedQuest = await Quest.getById(req.params.id, userId);
        const enhancedQuest = {
            ...updatedQuest,
            calculated_xp: calculateQuestXP(updatedQuest, userLevel, { completedOnTime: false, recentEasyQuests: 0 })
        };
        res.json({ quest: enhancedQuest });
    } catch (error) {
        console.error('Error updating daily quest:', error);
        res.status(500).json({ error: 'Failed to update daily quest' });
    }
};

export const deleteQuest = async (req, res) => {
    try {
        const quest = await Quest.getById(req.params.id, req.dbUserId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });

        await Quest.delete(req.params.id);
        res.json({ message: 'Quest deleted successfully' });
    } catch (error) {
        console.error('Error deleting quest:', error);
        res.status(500).json({ error: 'Failed to delete quest' });
    }
};

export const completeQuest = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const quest = await Quest.getById(req.params.id, userId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        if (quest.status !== 'active') return res.status(400).json({ error: 'Quest is not active' });

        const user = await User.getById(userId);
        const completedOnTime = quest.due_date ? new Date() <= new Date(quest.due_date) : false;
        const recentEasyQuests = await Quest.getRecentEasyQuests(userId);
        const recentCount = recentEasyQuests ? recentEasyQuests.count : 0;

        const xpGained = calculateQuestXP(quest, user.level, { completedOnTime, recentEasyQuests: recentCount });
        const xpResult = await User.addXp(user.id, xpGained, quest.attribute || 'strength');

        const specialRewards = [];
        if (xpResult.leveledUp) {
            let lvl = user.level + 1;
            for (let i = 0; i < xpResult.levelsGained; i++, lvl++) {
                if (lvl % 10 === 0) specialRewards.push({ type: 'legendary_choice', message: `Level ${lvl} Milestone!` });
                else if (lvl % 5 === 0) specialRewards.push({ type: 'guaranteed_rare', message: `Level ${lvl} Milestone!` });
            }
        }

        const rewards = generateQuestRewards(quest.difficulty, specialRewards);

        await db.transaction(async (tx) => {
            const nowIso = new Date().toISOString();
            await tx.run(`UPDATE quests SET status = 'completed', completed_at = ? WHERE id = ?`, [nowIso, quest.id]);
            await tx.run(`INSERT INTO quest_history (user_id, quest_id, type, completed_at) VALUES (?, ?, ?, ?)`, [userId, quest.id, quest.type, nowIso]);
            for (const item of rewards.items) {
                await tx.run(`INSERT INTO items (id, user_id, name, description, rarity, type, obtained_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [item.id, userId, item.name, item.description, item.rarity, item.type]);
            }
        });

        const updatedUser = await User.getById(userId);

        res.json({
            message: 'Quest completed!',
            xpGained,
            levelUp: xpResult.leveledUp ? {
                oldLevel: user.level,
                newLevel: xpResult.newLevel,
                levelsGained: xpResult.levelsGained,
                statPointsGained: 0,
                statChanges: xpResult.statChanges
            } : null,
            rewards: { items: rewards.items, special: specialRewards },
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
    } catch (error) {
        console.error('Error completing quest:', error);
        res.status(500).json({ error: 'Failed to complete quest' });
    }
};

export const failQuest = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const quest = await Quest.getById(req.params.id, userId);
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        if (quest.status !== 'active') return res.status(400).json({ error: 'Quest is not active' });

        await Quest.fail(quest.id);

        // 50% chance to deduct an attribute point
        const penaltyApplied = Math.random() < 0.5;
        let attributeTarget = quest.attribute ? quest.attribute.toLowerCase() : 'strength';
        let newValue = 0;

        if (penaltyApplied) {
            const user = await User.getById(userId);
            newValue = Math.max(0, (user[attributeTarget] || 0) - 1);

            await db.run(`
          UPDATE users 
          SET ${attributeTarget} = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newValue, userId]);
        }

        const updatedUser = await User.getById(userId);

        res.json({
            message: 'Quest failed',
            penaltyApplied,
            attributePenalized: penaltyApplied ? attributeTarget : null,
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
    } catch (error) {
        console.error('Error failing quest:', error);
        res.status(500).json({ error: 'Failed to fail quest' });
    }
};
