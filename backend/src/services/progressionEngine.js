/**
 * Progression Engine
 * Handles all XP calculation, level progression, and anti-grind mechanics
 */

// Base XP rewards by difficulty rank (inspired by Solo Leveling's E-S ranking)
const BASE_XP = {
  'E': 50,   // Easy daily tasks
  'D': 100,  // Normal tasks  
  'C': 200,  // Challenging tasks
  'B': 400,  // Hard projects
  'A': 800,  // Major milestones
  'S': 1600  // "Boss" tier quests
};

// Hunter rank names (for flavor)
const RANK_NAMES = {
  1: 'E-Rank Hunter',
  5: 'D-Rank Hunter',
  10: 'C-Rank Hunter',
  20: 'B-Rank Hunter',
  35: 'A-Rank Hunter',
  50: 'S-Rank Hunter',
  75: 'National Level Hunter',
  100: 'Shadow Monarch'
};

/**
 * Calculate XP required to reach a specific level
 * @param {number} level - Target level
 * @returns {number} Total XP needed from level 1
 */
export function getTotalXPForLevel(level) {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += getXPForNextLevel(i);
  }
  return totalXP;
}

/**
 * Calculate XP needed to go from current level to next
 * 
 * @param {number} currentLevel 
 * @returns {number} XP needed for next level
 */
export function getXPForNextLevel(currentLevel) {
  return Math.floor(100 * Math.pow(currentLevel, 1.1));
}

/**
 * Calculate XP reward for completing a quest
 * Includes bonuses and anti-grind mechanics
 * 
 * @param {Object} quest - Quest object with difficulty, dueDate
 * @param {Object} context - Additional context (completedOnTime, recentEasyQuests)
 * @returns {number} Final XP amount
 */
export function calculateQuestXP(quest, context = {}) {
  const baseXP = BASE_XP[quest.difficulty];
  let multiplier = 1.0;

  // Bonus for completing before due date
  if (quest.dueDate && context.completedOnTime) {
    multiplier *= 1.2; // +20% bonus
  }

  // Anti-grind: Diminishing returns on E-rank spam
  // If more than 10 E-rank quests completed in last 24h, reduce XP
  if (quest.difficulty === 'E' && context.recentEasyQuests > 10) {
    const penalty = Math.min(0.5, (context.recentEasyQuests - 10) * 0.05);
    multiplier *= (1 - penalty);
  }

  return Math.floor(baseXP * multiplier);
}

/**
 * Process level up and determine new level
 * Returns level-up information including rewards
 * 
 * @param {number} currentLevel 
 * @param {number} currentXP 
 * @param {number} xpGained 
 * @returns {Object} { newLevel, leveledUp, levelsGained, rewards }
 */
export function processLevelUp(currentLevel, currentXP, xpGained) {
  let newLevel = currentLevel;
  let newXP = currentXP + xpGained;
  let levelsGained = 0;
  const rewards = [];

  // Keep leveling up if XP exceeds threshold
  while (true) {
    const xpNeeded = getXPForNextLevel(newLevel);

    if (newXP >= xpNeeded) {
      newXP -= xpNeeded;
      newLevel++;
      levelsGained++;

      // Special rewards at milestone levels
      if (newLevel % 10 === 0) {
        rewards.push({
          type: 'legendary_choice',
          message: `Level ${newLevel} Milestone! Choose 1 of 3 Legendary Items`
        });
      } else if (newLevel % 5 === 0) {
        rewards.push({
          type: 'guaranteed_rare',
          message: `Level ${newLevel} Milestone! Guaranteed Rare+ Item`
        });
      }

      // Check for rank-up
      if (RANK_NAMES[newLevel]) {
        rewards.push({
          type: 'rank_up',
          message: `Rank Up! You are now a ${RANK_NAMES[newLevel]}!`,
          rank: RANK_NAMES[newLevel]
        });
      }
    } else {
      break;
    }
  }

  return {
    newLevel,
    newXP,
    leveledUp: levelsGained > 0,
    levelsGained,
    rewards
  };
}

/**
 * Get current rank name based on level
 * 
 * @param {number} level 
 * @returns {string} Rank name
 */
export function getRankName(level) {
  // Find the highest rank threshold the level has passed
  const thresholds = Object.keys(RANK_NAMES)
    .map(Number)
    .sort((a, b) => b - a); // Descending order

  for (const threshold of thresholds) {
    if (level >= threshold) {
      return RANK_NAMES[threshold];
    }
  }

  return 'E-Rank Hunter';
}

/**
 * Calculate progress percentage to next level
 * 
 * @param {number} currentXP 
 * @param {number} level 
 * @returns {number} Percentage (0-100)
 */
export function getProgressToNextLevel(currentXP, level) {
  const xpNeeded = getXPForNextLevel(level);
  return Math.min(100, Math.floor((currentXP / xpNeeded) * 100));
}