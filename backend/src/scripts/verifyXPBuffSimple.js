
import { calculateQuestXP } from '../services/progressionEngine.js';
import { GAME_CONSTANTS } from '../config/gameConstants.js';

async function verify() {
    console.log('🧪 XP Buff Logic Verification (In-Memory)');

    const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
    const results = [];

    // Level 20 should have 1.2x multiplier
    // Calculation: Math.floor(20/10) - 1 = 1 milestone. 1.2^1 = 1.2x
    
    // Level 19 should have 1.0x multiplier
    // Calculation: Math.floor(19/10) - 1 = 0 milestones. 1.2^0 = 1.0x

    const testLevels = [1, 10, 19, 20, 21, 29, 30, 40, 100, 110];

    for (const level of testLevels) {
        const row = { level };
        for (const rank of ranks) {
            const mockQuest = { difficulty: rank, type: 'normal' };
            const xp = calculateQuestXP(mockQuest, level);
            const base = GAME_CONSTANTS.XP_REWARDS[rank];
            const mult = (xp / base).toFixed(2);
            row[rank] = `${xp} (${mult}x)`;
        }
        
        // Add a daily quest check too (always E-rank)
        const dailyQuest = { difficulty: 'E', type: 'daily' };
        const dailyXp = calculateQuestXP(dailyQuest, level);
        row['Daily(E)'] = `${dailyXp} (${(dailyXp/50).toFixed(2)}x)`;
        
        results.push(row);
    }

    console.table(results);
    
    console.log('\n--- Conclusion ---');
    console.log('Level 1-19: 1.0x multiplier');
    console.log('Level 20-29: 1.2x multiplier');
    console.log('Level 30-39: 1.44x multiplier (1.2 * 1.2)');
    console.log('Level 40-49: 1.73x multiplier (1.2 * 1.2 * 1.2)');
    console.log('Level 100+: Capped multiplier (1.2^9)');
}

verify();
