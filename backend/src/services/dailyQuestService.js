/**
 * Daily Quest Service
 * Handles generating daily quests and applying penalties
 */
import cron from 'node-cron';
import db from '../config/database.js';
import { randomUUID } from 'crypto';

export const DAILY_QUESTS = [
    { title: 'Brush routine', description: 'Complete your daily brush routine.', difficulty: 'E', attribute: 'vitality', xp_reward: 50 },
    { title: 'Study 1 hour', description: 'Spend at least 1 hour studying.', difficulty: 'E', attribute: 'intelligence', xp_reward: 50 },
    { title: '5 pushups or 30s plank', description: 'Do 5 pushups or a 30-second plank.', difficulty: 'E', attribute: 'strength', xp_reward: 50 },
    { title: 'Handshake with acquaintance', description: 'Greet an acquaintance with a handshake.', difficulty: 'E', attribute: 'network', xp_reward: 50 },
    { title: 'Spend 10 minutes thinking about a project', description: 'Brainstorm or think about a project for 10 minutes.', difficulty: 'E', attribute: 'creation', xp_reward: 50 }
];

function getTodayString() {
    const date = new Date();
    // Use IST date (UTC+5:30) to match local midnight schedule
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffsetMs);
    return istDate.toISOString().split('T')[0];
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
        const users = await db.query('SELECT id, consecutive_failed_dailies FROM users');

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
                    const consecutiveFailed = user.consecutive_failed_dailies || 0;

                    console.log(`[DailyQuestService] User ${user.id}: ${completedCount} completed daily quests since last reset.`);

                    if (completedCount < 3) {
                        if (consecutiveFailed < 5) {
                            console.log(`[DailyQuestService] Penalty applied to user ${user.id}: -1 to all stats!`);

                            await tx.run(`
                                UPDATE users 
                                SET 
                                  strength = CASE WHEN strength > 10 THEN strength - 1 ELSE 10 END,
                                  creation = CASE WHEN creation > 10 THEN creation - 1 ELSE 10 END,
                                  network = CASE WHEN network > 10 THEN network - 1 ELSE 10 END,
                                  vitality = CASE WHEN vitality > 10 THEN vitality - 1 ELSE 10 END,
                                  intelligence = CASE WHEN intelligence > 10 THEN intelligence - 1 ELSE 10 END,
                                  consecutive_failed_dailies = consecutive_failed_dailies + 1
                                WHERE id = ?
                            `, [user.id]);
                        } else {
                            console.log(`[DailyQuestService] User ${user.id}: Penalty paused (5+ consecutive failed days).`);
                            // We cap it at 5 so it won't keep growing infinitely.
                            await tx.run(`
                                UPDATE users 
                                SET consecutive_failed_dailies = 5 
                                WHERE id = ?
                            `, [user.id]);
                        }
                    } else {
                        console.log(`[DailyQuestService] User ${user.id}: Penalty avoided!`);
                        if (consecutiveFailed > 0) {
                            await tx.run(`
                                UPDATE users 
                                SET consecutive_failed_dailies = 0 
                                WHERE id = ?
                            `, [user.id]);
                        }
                    }
                }
            }

            // 2. For each user: reset existing daily quests OR create presets for new users
            for (const user of users) {
                const existingCount = await tx.get(
                    `SELECT COUNT(*) as count FROM quests WHERE type = 'daily' AND user_id = ?`, [user.id]
                );

                if (parseInt(existingCount.count) === 0) {
                    // First-ever login: create from preset templates
                    for (const tpl of DAILY_QUESTS) {
                        await tx.run(`
                            INSERT INTO quests (id, user_id, title, description, difficulty, xp_reward, status, type, attribute)
                            VALUES (?, ?, ?, ?, ?, ?, 'active', 'daily', ?)
                        `, [randomUUID(), user.id, tpl.title, tpl.description, tpl.difficulty, tpl.xp_reward, tpl.attribute]);
                    }
                } else {
                    // Returning user: reset status to active, preserving their custom title/description
                    await tx.run(
                        `UPDATE quests SET status = 'active', completed_at = NULL WHERE type = 'daily' AND user_id = ?`,
                        [user.id]
                    );
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
    // Run on startup just in case server was off during reset window
    checkAndResetDailyQuests();

    // Run at 00:00, 00:10, 00:20, and 00:30 IST
    // IST is UTC+5:30, so 00:00 IST = 18:30 UTC.
    // We schedule it at 18:30, 18:40, 18:50, 19:00 UTC (runs exactly at midnight IST)
    cron.schedule('30,40,50 18 * * *', () => {
        checkAndResetDailyQuests();
    }, { timezone: 'UTC' });
    cron.schedule('0 19 * * *', () => {
        checkAndResetDailyQuests();
    }, { timezone: 'UTC' });
    console.log('⏰ Daily quest check scheduled (runs at midnight IST).');
}
