import { calculateQuestXP } from '../services/progressionEngine.js';
import { GAME_CONSTANTS } from '../config/gameConstants.js';

const mockQuest = {
  difficulty: 'C',
  dueDate: null
};

const baseXP = GAME_CONSTANTS.XP_REWARDS['C']; // 200

console.log('--- XP Progression Cap Test ---');
console.log(`Base XP for C-rank: ${baseXP}`);
console.log(`Boost starts at: ${GAME_CONSTANTS.PROGRESSION.MILESTONE_XP_BOOST.START_LEVEL}`);
console.log(`Boost caps at: ${GAME_CONSTANTS.PROGRESSION.MILESTONE_XP_BOOST.MAX_BOOST_LEVEL}`);

const testLevels = [1, 20, 50, 90, 100, 110, 150];

testLevels.forEach(level => {
  const xp = calculateQuestXP(mockQuest, level);
  const multiplier = (xp / baseXP).toFixed(3);
  console.log(`Level ${level.toString().padEnd(3)}: XP Awarded = ${xp.toString().padEnd(4)} (Multiplier: ${multiplier}x)`);
});

// Expected results:
// Level 1: 200 (1.0x)
// Level 20: 240 (1.2x)
// Level 100: 200 * 1.2^9 = 1,031
// Level 110: Should be same as Level 100 (capped)
// Level 150: Should be same as Level 100 (capped)
