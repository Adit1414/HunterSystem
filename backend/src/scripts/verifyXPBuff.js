
import db from '../config/database.js';
import { calculateQuestXP } from '../services/progressionEngine.js';
import { GAME_CONSTANTS } from '../config/gameConstants.js';
import { randomUUID } from 'crypto';

async function verify() {
    console.log('🧪 Starting XP Buff Verification...');

    try {
        // 1. Create a test user
        const testUserId = 999;
        await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
        await db.run(`
            INSERT INTO users (id, username, email, password_hash, level, xp, total_xp_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [testUserId, 'testuser', 'test@example.com', 'hash', 20, 0, 5000]);

        console.log('✅ Created test user at Level 20');

        const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
        const results = [];

        for (const rank of ranks) {
            const baseXP = GAME_CONSTANTS.XP_REWARDS[rank];
            const expectedXP = Math.floor(baseXP * 1.2); // 1.2x buff at lvl 20

            // Create a quest for this rank
            const questId = randomUUID();
            await db.run(`
                INSERT INTO quests (id, user_id, title, difficulty, xp_reward, status, type)
                VALUES (?, ?, ?, ?, ?, 'active', 'normal')
            `, [questId, testUserId, `Rank ${rank} Quest`, rank, baseXP]);

            // Complete it
            // We'll simulate the completeQuest logic
            const quest = await db.get('SELECT * FROM quests WHERE id = ?', [questId]);
            const xpGained = calculateQuestXP(quest, 20, { completedOnTime: false, recentEasyQuests: 0 });
            
            results.push({
                rank,
                baseXP,
                expectedXP,
                actualXP: xpGained,
                match: xpGained === expectedXP ? '✅' : '❌'
            });

            await db.run('DELETE FROM quests WHERE id = ?', [questId]);
        }

        // Test Daily Quest
        const dailyBaseXP = 50;
        const dailyExpectedXP = 60; // 50 * 1.2
        const dailyQuestId = randomUUID();
        await db.run(`
            INSERT INTO quests (id, user_id, title, difficulty, xp_reward, status, type)
            VALUES (?, ?, ?, ?, ?, 'active', 'daily')
        `, [dailyQuestId, testUserId, 'Daily Quest', 'E', dailyBaseXP]);

        const dailyQuest = await db.get('SELECT * FROM quests WHERE id = ?', [dailyQuestId]);
        const dailyXPGained = calculateQuestXP(dailyQuest, 20, { completedOnTime: false, recentEasyQuests: 0 });

        results.push({
            rank: 'Daily (E)',
            baseXP: dailyBaseXP,
            expectedXP: dailyExpectedXP,
            actualXP: dailyXPGained,
            match: dailyXPGained === dailyExpectedXP ? '✅' : '❌'
        });

        console.table(results);

        // Cleanup
        await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
        await db.run('DELETE FROM quests WHERE user_id = ?', [testUserId]);

        const allPassed = results.every(r => r.match === '✅');
        if (allPassed) {
            console.log('\n🌟 VERIFICATION SUCCESSFUL: The 1.2x buff is correctly applied to all ranks and quest types at Level 20!');
        } else {
            console.log('\n❌ VERIFICATION FAILED: Some XP calculations are incorrect.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

verify();
