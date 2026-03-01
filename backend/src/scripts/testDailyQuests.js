import db, { initializeDatabase } from '../config/database.js';
import { checkAndResetDailyQuests } from '../services/dailyQuestService.js';
import Quest from '../models/Quest.js';
import User from '../models/User.js';

async function mockYesterdayReset() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const offset = date.getTimezoneOffset();
    const yesterday = new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

    await db.run('UPDATE system_config SET value = ? WHERE key = ?', [yesterday, 'last_daily_reset']);
    console.log(`Mocked last_daily_reset to ${yesterday}`);
}

async function testDailyQuests() {
    try {
        console.log("Initializing DB for test...");
        await initializeDatabase();

        // Clear state
        console.log("Clearing existing daily quests and config...");
        await db.run("DELETE FROM quests WHERE type = 'daily'");
        await db.run("DELETE FROM system_config WHERE key = 'last_daily_reset'");

        console.log("\n--- TEST PHASE 1: Initial Quests Generation ---");
        await checkAndResetDailyQuests();
        let currentDailyQuests = await db.query("SELECT * FROM quests WHERE type = 'daily'");
        if (currentDailyQuests.length !== 5) {
            throw new Error(`Expected 5 daily quests, got ${currentDailyQuests.length}`);
        }
        console.log("✅ 5 Daily Quests Successfully Generated");

        console.log("\n--- TEST PHASE 2: Failing < 3 Quests Penalty ---");
        let initialUser = await User.getDefault();
        console.log(`Initial Stats: S:${initialUser.strength} C:${initialUser.creation} N:${initialUser.network} V:${initialUser.vitality} I:${initialUser.intelligence}`);

        // Complete only 2 quests
        await db.run("UPDATE quests SET status = 'completed' WHERE id = ?", [currentDailyQuests[0].id]);
        await db.run("UPDATE quests SET status = 'completed' WHERE id = ?", [currentDailyQuests[1].id]);
        console.log("Completed 2 quests.");

        // Fast forward to tomorrow by setting last reset to yesterday
        await mockYesterdayReset();

        // Trigger reset
        await checkAndResetDailyQuests();

        let penalizedUser = await User.getDefault();
        console.log(`Penalized Stats: S:${penalizedUser.strength} C:${penalizedUser.creation} N:${penalizedUser.network} V:${penalizedUser.vitality} I:${penalizedUser.intelligence}`);

        // Verify penalty
        const statsToCheck = ['strength', 'creation', 'network', 'vitality', 'intelligence'];
        for (let stat of statsToCheck) {
            if (penalizedUser[stat] !== initialUser[stat] - 1 && initialUser[stat] > 1) {
                throw new Error(`Penalty failed for ${stat}. Expected ${initialUser[stat] - 1}, Got ${penalizedUser[stat]}`);
            }
        }
        console.log("✅ Penalty correctly applied (-1 to all stats)");

        currentDailyQuests = await db.query("SELECT * FROM quests WHERE type = 'daily'");
        if (currentDailyQuests.length !== 5) {
            throw new Error(`Expected 5 NEW daily quests, got ${currentDailyQuests.length}`);
        }
        console.log("✅ 5 New Daily Quests Generated after reset");

        console.log("\n--- TEST PHASE 3: Avoiding Penalty (Completing >= 3) ---");
        // Complete 3 quests
        await db.run("UPDATE quests SET status = 'completed' WHERE id = ?", [currentDailyQuests[0].id]);
        await db.run("UPDATE quests SET status = 'completed' WHERE id = ?", [currentDailyQuests[1].id]);
        await db.run("UPDATE quests SET status = 'completed' WHERE id = ?", [currentDailyQuests[2].id]);
        console.log("Completed 3 quests.");

        // Fast forward
        await mockYesterdayReset();

        // Trigger reset
        await checkAndResetDailyQuests();

        let finalUser = await User.getDefault();
        console.log(`Final Stats: S:${finalUser.strength} C:${finalUser.creation} N:${finalUser.network} V:${finalUser.vitality} I:${finalUser.intelligence}`);

        for (let stat of statsToCheck) {
            if (finalUser[stat] !== penalizedUser[stat]) {
                throw new Error(`Penalty wrongly applied! Stats changed for ${stat}. Expected ${penalizedUser[stat]}, Got ${finalUser[stat]}`);
            }
        }
        console.log("✅ Penalty correctly avoided");

        console.log("\n✅ ALL TESTS PASSED!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    }
}

testDailyQuests();
