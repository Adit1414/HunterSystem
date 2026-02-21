import db from '../config/database.js';
import User from '../models/User.js';
import { getXPForNextLevel } from '../services/progressionEngine.js';

async function verify() {
    console.log("Starting Verification...");
    const user = await User.getDefault();
    if (!user) {
        console.error("User not found!");
        return;
    }

    const initialStats = {
        strength: user.strength,
        creation: user.creation,
        network: user.network,
        vitality: user.vitality,
        intelligence: user.intelligence,
        level: user.level,
        xp: user.xp
    };
    console.log("Initial State: " + JSON.stringify(initialStats));

    // Add enough xp so they level up, testing percentage calculation.
    const xpNeeded = getXPForNextLevel(user.level) - user.xp;

    // They complete a quest using 'intelligence' that gives EXACTLY enough xp to level up
    console.log(`Adding ${xpNeeded} xp to 'intelligence'...`);

    try {
        const result = await User.addXp(1, xpNeeded, 'intelligence');
        console.log("AddXP Result: " + JSON.stringify(result));
    } catch (err) {
        console.error("Error during addXP:", err);
        process.exit(1);
    }

    const updatedUser = await User.getDefault();
    const updatedStats = {
        strength: updatedUser.strength,
        creation: updatedUser.creation,
        network: updatedUser.network,
        vitality: updatedUser.vitality,
        intelligence: updatedUser.intelligence,
        level: updatedUser.level,
        xp: updatedUser.xp
    };

    console.log("Updated State: " + JSON.stringify(updatedStats));

    // verify stat changes
    let correct = true;
    for (const attr of ['strength', 'creation', 'network', 'vitality', 'intelligence']) {
        const diff = updatedStats[attr] - initialStats[attr];
        if (attr === 'intelligence') {
            if (diff !== 6) {
                correct = false; // 1 auto + 5 percentage
                console.log(`❌ Intelligence increased by ${diff}, expected 6`);
            }
        } else {
            if (diff !== 1) {
                correct = false; // 1 auto + 0 percentage (wasn't the active attribute)
                console.log(`❌ ${attr} increased by ${diff}, expected 1`);
            }
        }
    }

    if (correct) {
        console.log("✅ Verification Passed! All systems working correctly.");
    } else {
        console.log("❌ Verification Failed!");
    }
    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
