/**
 * XP Calculator Utilities
 * Frontend calculations for XP and leveling
 */

/**
 * Calculate XP required for a specific level
 * Matches backend formula: 100 * level^1.1
 */
export function getXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.1));
}

/**
 * Calculate total XP from level 1 to target level
 */
export function getTotalXPForLevel(level) {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += getXPForLevel(i);
  }
  return totalXP;
}

/**
 * Calculate what level a given total XP amount would be
 */
export function getLevelFromTotalXP(totalXP) {
  let level = 1;
  let xpSoFar = 0;
  
  while (xpSoFar + getXPForLevel(level) <= totalXP) {
    xpSoFar += getXPForLevel(level);
    level++;
  }
  
  return {
    level,
    currentXP: totalXP - xpSoFar,
    xpForNextLevel: getXPForLevel(level)
  };
}

/**
 * Calculate progress percentage to next level
 */
export function getProgressPercentage(currentXP, level) {
  const xpNeeded = getXPForLevel(level);
  if (xpNeeded === 0) return 0;
  return Math.min(100, Math.floor((currentXP / xpNeeded) * 100));
}

/**
 * Estimate XP rewards for quest difficulty
 */
export function estimateQuestXP(difficulty, hasDeadline = false) {
  const baseXP = {
    'E': 50,
    'D': 100,
    'C': 200,
    'B': 400,
    'A': 800,
    'S': 1600
  };

  let xp = baseXP[difficulty] || 0;
  
  // Bonus if deadline exists (potential +20%)
  if (hasDeadline) {
    xp = Math.floor(xp * 1.2);
  }

  return xp;
}

/**
 * Calculate how many quests needed to level up
 */
export function questsNeededToLevelUp(currentXP, currentLevel, questDifficulty) {
  const xpNeeded = getXPForLevel(currentLevel) - currentXP;
  const xpPerQuest = estimateQuestXP(questDifficulty);
  
  return Math.ceil(xpNeeded / xpPerQuest);
}

/**
 * Get rank name for level
 */
export function getRankForLevel(level) {
  if (level >= 100) return 'Shadow Monarch';
  if (level >= 75) return 'National Level Hunter';
  if (level >= 50) return 'S-Rank Hunter';
  if (level >= 35) return 'A-Rank Hunter';
  if (level >= 20) return 'B-Rank Hunter';
  if (level >= 10) return 'C-Rank Hunter';
  if (level >= 5) return 'D-Rank Hunter';
  return 'E-Rank Hunter';
}

/**
 * Check if level is a milestone (rewards)
 */
export function isMilestoneLevel(level) {
  return {
    isMilestone: level % 5 === 0,
    isLegendaryChoice: level % 10 === 0,
    isRareGuaranteed: level % 5 === 0 && level % 10 !== 0,
    isRankUp: [5, 10, 20, 35, 50, 75, 100].includes(level)
  };
}

export default {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromTotalXP,
  getProgressPercentage,
  estimateQuestXP,
  questsNeededToLevelUp,
  getRankForLevel,
  isMilestoneLevel
};