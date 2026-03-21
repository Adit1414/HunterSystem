/**
 * Daily Quest Service
 * Handles generating daily quests and applying penalties
 */
import cron from 'node-cron';
import db from '../config/database.js';
import { randomUUID } from 'crypto';

const DAILY_QUESTS = [
    { title: 'Brush routine', description: 'Complete your daily brush routine.', difficulty: 'E', attribute: 'vitality', xp_reward: 50 },
    { title: 'Study 1 hour', description: 'Spend at least 1 hour studying.', difficulty: 'E', attribute: 'intelligence', xp_reward: 50 },
    { title: '5 pushups or 30s plank', description: 'Do 5 pushups or a 30-second plank.', difficulty: 'E', attribute: 'strength', xp_reward: 50 },
    { title: 'Handshake with acquaintance', description: 'Greet an acquaintance with a handshake.', difficulty: 'E', attribute: 'network', xp_reward: 50 },
    { title: 'Spend 10 minutes thinking about a project', description: 'Brainstorm or think about a project for 10 minutes.', difficulty: 'E', attribute: 'creation', xp_reward: 50 }
];

function getTodayString() {
    const date = new Date();
    // Adjust to local timezone (format YYYY-MM-DD)
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
}

export async function checkAndResetDailyQuests() {
    try {
        const today = getTodayString();

        // Check last reset
        const config = await db.get('SELECT value FROM system_config WHERE key = ?', ['last_daily_reset']);
        const lastReset = config ? config.value : null;

        if (lastReset === today) {
            // Already processed today
            return;
        }

        console.log(`[DailyQuestService] Processing daily reset for ${today} (Last reset: ${lastReset})`);

        // Get all users
        const users = await db.query('SELECT id FROM users');

        await db.transaction(async (tx) => {
            // 1. If there's a previous day, evaluate penalty for each user
            if (lastReset) {
                for (const user of users) {
                    const completedCountRes = await tx.get(`
                        SELECT COUNT(*) as count 
                        FROM quests 
                        WHERE type = 'daily' AND status = 'completed' AND user_id = ?
                    `, [user.id]);
                    const completedCount = parseInt(completedCountRes.count) || 0;

                    console.log(`[DailyQuestService] User ${user.id}: ${completedCount} completed daily quests since last reset.`);

                    if (completedCount < 3) {
                        console.log(`[DailyQuestService] Penalty applied to user ${user.id}: -1 to all stats!`);

                        await tx.run(`
                            UPDATE users 
                            SET 
                              strength = CASE WHEN strength > 1 THEN strength - 1 ELSE 1 END,
                              creation = CASE WHEN creation > 1 THEN creation - 1 ELSE 1 END,
                              network = CASE WHEN network > 1 THEN network - 1 ELSE 1 END,
                              vitality = CASE WHEN vitality > 1 THEN vitality - 1 ELSE 1 END,
                              intelligence = CASE WHEN intelligence > 1 THEN intelligence - 1 ELSE 1 END
                            WHERE id = ?
                        `, [user.id]);
                    } else {
                        console.log(`[DailyQuestService] User ${user.id}: Penalty avoided!`);
                    }
                }
            }

            // 2. Clear out all existing daily quests
            await tx.run(`DELETE FROM quests WHERE type = 'daily'`);

            // 3. Create 5 new daily quests for each user
            for (const user of users) {
                for (const tpl of DAILY_QUESTS) {
                    await tx.run(`
                        INSERT INTO quests (id, user_id, title, description, difficulty, xp_reward, status, type, attribute)
                        VALUES (?, ?, ?, ?, ?, ?, 'active', 'daily', ?)
                    `, [randomUUID(), user.id, tpl.title, tpl.description, tpl.difficulty, tpl.xp_reward, tpl.attribute]);
                }
            }

            // 4. Update the tracker
            await tx.run(`
                INSERT INTO system_config (key, value) 
                VALUES ('last_daily_reset', ?) 
                ON CONFLICT(key) DO UPDATE SET value = ?
            `, [today, today]);
        });

        console.log('[DailyQuestService] Daily reset completed successfully.');
    } catch (error) {
        console.error('[DailyQuestService] Failed to reset daily quests:', error);
    }
}

export function startDailyQuestCron() {
    // Run on startup just in case server was off at midnight
    checkAndResetDailyQuests();

    // Check periodically (every minute) instead of only at midnight,
    // to handle the computer sleeping through exactly 00:00.
    // The checkAndResetDailyQuests function already prevents multiple resets
    // in the same day by checking the 'last_daily_reset' value in the DB.
    cron.schedule('* * * * *', () => {
        checkAndResetDailyQuests();
    });
    console.log('⏰ Daily quest check scheduled (runs every minute to ensure resets).');
}
