import db from '../config/database.js';
import { getXPForNextLevel, getRankName } from '../services/progressionEngine.js';

// ==========================================
// 🛠️ DEV CONTROL PANEL - EDIT HERE 🛠️
// ==========================================
// INSTRUCTIONS:
// 1. Modify the values below to what you want.
// 2. Open a terminal in 'backend'.
// 3. Run: node src/scripts/DevControl.js
// 4. Restart your frontend/backend to see changes immediately.

const TARGET_USER_ID = 1;

// --- OPTION 1: UPDATE PROGRESSION ---
// Set NEW_TOTAL_XP to a number to update your Level and Rank automatically.
// Set to null to keep current XP.
const NEW_TOTAL_XP = 2800; // Example: 5000

// --- OPTION 2: UPDATE ATTRIBUTES ---
// Set specific attributes to new values. Set to null to leave unchanged.
const NEW_ATTRIBUTES = {
    strength: 19,      // Example: 50
    creation: 26,
    network: 19,       
    vitality: 18,
    intelligence: 38,
    stat_points: null    // Unspent points
};

// --- OPTION 3: DELETE SPECIFIC DATA ---
// Enter the ID (string) OR an array of IDs ["id1", "id2"] to DELETE.
// Set to null to skip.
const DELETE_ITEM_ID = []; // Example: "quest_1729123..." or ["quest_1...", "quest_2..."]
const DELETE_QUEST_ID = ["e85025f5-522a-4fef-8512-13bc939e808f"];  // Example: "item_98231..." or ["item_1...", "item_2..."]

// --- OPTION 4: LIST DATA ---
// Set to true to see a list of all Quests and Items with their IDs in the console.
const LIST_DATA = true;


// ==========================================
// 🚀 EXECUTION LOGIC (DO NOT EDIT BELOW) 🚀
// ==========================================

async function main() {
    console.log('🔧 Starting DevControl...');

    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [TARGET_USER_ID]);
        if (!user) {
            console.error(`❌ User with ID ${TARGET_USER_ID} not found.`);
            return;
        }
        console.log(`👤 Found User: Level ${user.level} | Total XP: ${user.total_xp_earned}`);

        // 0. List Data
        if (LIST_DATA) {
            console.log('\n📜 [QUESTS] ---------------------------');
            const quests = await db.query('SELECT id, title, status, difficulty FROM quests ORDER BY created_at DESC');
            if (quests.length === 0) console.log('   (No quests found)');
            else console.table(quests);

            console.log('\n🎒 [ITEMS] ----------------------------');
            const items = await db.query('SELECT id, name, rarity, type FROM items ORDER BY obtained_at DESC');
            if (items.length === 0) console.log('   (No items found)');
            else console.table(items);

            console.log('\n---------------------------------------');
        }

        // 1. Handle XP Update
        if (NEW_TOTAL_XP !== null) {
            console.log(`\n📊 Updating Total XP to ${NEW_TOTAL_XP}...`);

            // Calculate Level from Total XP
            let calculatedLevel = 1;
            let xpAccumulator = 0;

            // Iterate to find the correct level
            while (true) {
                const xpNeededForNext = getXPForNextLevel(calculatedLevel);
                if (xpAccumulator + xpNeededForNext > NEW_TOTAL_XP) {
                    break;
                }
                xpAccumulator += xpNeededForNext;
                calculatedLevel++;
            }

            const currentLevelXP = NEW_TOTAL_XP - xpAccumulator;
            const rank = getRankName(calculatedLevel);

            console.log(`   -> Calculated Level: ${calculatedLevel}`);
            console.log(`   -> Current Level XP: ${currentLevelXP}`);
            console.log(`   -> Rank: ${rank}`);

            await db.run(
                `UPDATE users SET level = ?, xp = ?, total_xp_earned = ? WHERE id = ?`,
                [calculatedLevel, currentLevelXP, NEW_TOTAL_XP, TARGET_USER_ID]
            );
            console.log('   ✅ Progression updated!');
        }

        // 2. Handle Attribute Updates
        const updates = [];
        const params = [];

        for (const [key, value] of Object.entries(NEW_ATTRIBUTES)) {
            if (value !== null) {
                updates.push(`${key} = ?`);
                params.push(value);
                console.log(`   -> Setting ${key} to ${value}`);
            }
        }

        if (updates.length > 0) {
            console.log('\n💪 Updating Attributes...');
            params.push(TARGET_USER_ID);
            await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
            console.log('   ✅ Attributes updated!');
        }

        // 3. Delete Quest
        if (DELETE_QUEST_ID) {
            const ids = Array.isArray(DELETE_QUEST_ID) ? DELETE_QUEST_ID : [DELETE_QUEST_ID];
            if (ids.length > 0) {
                console.log(`\n📜 Deleting ${ids.length} Quest(s)...`);
                for (const id of ids) {
                    const result = await db.run('DELETE FROM quests WHERE id = ?', [id]);
                    if (result.changes > 0) console.log(`   ✅ Quest deleted: ${id}`);
                    else console.log(`   ⚠️ Quest not found: ${id}`);
                }
            }
        }

        // 4. Delete Item
        if (DELETE_ITEM_ID) {
            const ids = Array.isArray(DELETE_ITEM_ID) ? DELETE_ITEM_ID : [DELETE_ITEM_ID];
            if (ids.length > 0) {
                console.log(`\n🎒 Deleting ${ids.length} Item(s)...`);
                for (const id of ids) {
                    const result = await db.run('DELETE FROM items WHERE id = ?', [id]);
                    if (result.changes > 0) console.log(`   ✅ Item deleted: ${id}`);
                    else console.log(`   ⚠️ Item not found: ${id}`);
                }
            }
        }

        console.log('\n✨ Done! Reload your app to see changes.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
