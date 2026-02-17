import db from '../config/database.js';
import User from '../models/User.js';
import { initializeDatabase } from '../config/database.js';

async function testLeveling() {
    console.log('🧪 Starting Leveling Logic Verification...');

    try {
        // 1. Initialize DB
        await initializeDatabase();

        // 2. Reset User
        console.log('🔄 Resetting user...');
        await User.reset(1);
        let user = await User.getById(1);
        console.log(`Initial State: Level ${user.level}, XP ${user.xp}, Stats: Str=${user.strength}, Int=${user.intelligence}`);

        // 3. Add XP (No Level Up)
        // Level 1 -> 2 needs 100 XP (floor(100 * 1^1.5) = 100)
        console.log('\n--- Test 1: Add 50 XP to Strength ---');
        await User.addXp(1, 50, 'strength');
        user = await User.getById(1);
        console.log(`Current State: Level ${user.level}, XP ${user.xp}`);
        if (user.xp !== 50 || user.xp_strength !== 50) {
            console.error('❌ Failed: XP not updated correctly');
        } else {
            console.log('✅ XP updated correctly');
        }

        // 4. Add XP (Trigger Level Up)
        // Add 60 XP to Intelligence. Total 110. Need 100. Overflow 10.
        // Level 1 distribution: 50 Str, 50 Int (used).
        // Strength: 50/100 = 50% -> 2.94 pts -> 2 pts
        // Intelligence: 50/100 = 50% -> 2.94 pts -> 2 pts
        // Total 4. Gap 1.
        // Remainder: 50% % 17 = 2.94 % 17 = 2.94. Both equal.
        // Sort might pick either. Let's say Int.
        // Result: 2 Str, 3 Int (or vice versa).
        // New Level: 2.
        // New XP: 10 (Overflow from Int).
        // xp_intelligence should be 10. xp_strength should be 0.

        console.log('\n--- Test 2: Add 60 XP to Intelligence (Level Up) ---');
        const result = await User.addXp(1, 60, 'intelligence');

        console.log('Level Up Result:', JSON.stringify(result, null, 2));

        user = await User.getById(1);
        console.log(`New State: Level ${user.level}, XP ${user.xp}`);
        console.log(`Stats: Str=${user.strength}, Int=${user.intelligence}`);
        console.log(`Attr XPs: Str=${user.xp_strength}, Int=${user.xp_intelligence}`);

        if (user.level === 2) console.log('✅ Leveled up to 2');
        else console.error('❌ Failed to level up');

        if (user.xp === 10) console.log('✅ Overflow XP correct');
        else console.error(`❌ Overflow XP incorrect: ${user.xp} (Expected 10)`);

        // Check points
        const strGain = user.strength - 10;
        const intGain = user.intelligence - 10;
        console.log(`Gains: Str +${strGain}, Int +${intGain}`);

        if (strGain + intGain === 5) console.log('✅ Total 5 points distributed');
        else console.error(`❌ Points distribution error: Total ${strGain + intGain}`);

        if (user.xp_intelligence === 10 && user.xp_strength === 0) console.log('✅ Attribute XP reset/overflow correct');
        else console.error('❌ Attribute XP verification failed');

    } catch (err) {
        console.error('❌ Test Failed:', err);
    }
}

testLeveling();
