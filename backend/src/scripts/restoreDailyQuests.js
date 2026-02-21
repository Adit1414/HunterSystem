import db from '../config/database.js';
import { checkAndResetDailyQuests } from '../services/dailyQuestService.js';

async function restore() {
    try {
        console.log("Restoring daily quests...");

        // Ensure there are 5 daily quests again
        // Easiest is to force a reset right now regardless of last reset time
        await db.run("DELETE FROM system_config WHERE key = 'last_daily_reset'");

        // This will clean up remaining daily quests and regenerate all 5
        await checkAndResetDailyQuests();

        console.log("✅ Successfully restored all 5 daily quests!");
    } catch (err) {
        console.error(err);
    }
}

restore();
