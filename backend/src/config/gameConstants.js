/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                      ✨ SAFE TO MODIFY ✨                      ║
 * ║   You can freely adjust these values to tune the game balance.║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

export const GAME_CONSTANTS = {
  // Base XP awarded for completing quests of different difficulties
  XP_REWARDS: {
    'E': 50,
    'D': 100,
    'C': 200,
    'B': 400,
    'A': 800,
    'S': 1600
  },

  // Base Drop rates by difficulty (percentage 0-100)
  DROP_RATES: {
    'E': 30,
    'D': 50,
    'C': 70,
    'B': 90,
    'A': 100, // Guaranteed
    'S': 100  // Guaranteed
  },

  // Rarity Drop Chances for each difficulty level (must sum ~100 per rank)
  RARITY_CHANCES: {
    'E': { common: 80, rare: 15, epic: 4, legendary: 1, mythic: 0 },
    'D': { common: 60, rare: 30, epic: 8, legendary: 2, mythic: 0 },
    'C': { common: 40, rare: 40, epic: 15, legendary: 4, mythic: 1 },
    'B': { common: 20, rare: 40, epic: 25, legendary: 12, mythic: 3 },
    'A': { common: 10, rare: 30, epic: 35, legendary: 20, mythic: 5 },
    'S': { common: 0, rare: 20, epic: 40, legendary: 30, mythic: 10 }
  },

  // Leveling Curve Modifiers
  LEVELING: {
    BASE_XP_MODIFIER: 100,
    EXPONENT: 1.1
  },

  // Progression Mechanics
  PROGRESSION: {
    // XP bonus multiplier for completing a quest on or before due date (e.g., 1.2 = +20%)
    ON_TIME_BONUS_MULTIPLIER: 1.2,

    // Penalties for grinding easy quests
    ANTI_GRIND: {
      THRESHOLD_EASY_QUESTS: 10, // After this many recent E-rank quests
      PENALTY_MULTIPLIER: 0.5    // -50% XP
    },

    // Daily quest penalty
    DAILY_QUESTS: {
      REQUIRED_TO_AVOID_PENALTY: 3,
      PENALTY_DEDUCTION: 1 // Deduct 1 from all stats if failed
    },

    // Progressive XP scaling (20% boost every 10 levels starting at 20)
    MILESTONE_XP_BOOST: {
      LEVEL_INTERVAL: 10,
      START_LEVEL: 20,
      MAX_BOOST_LEVEL: 100,
      MULTIPLIER: 1.2
    }
  },

  // Default starting stats for a new user
  DEFAULT_STATS: {
    level: 1,
    strength: 10,
    creation: 10,
    network: 10,
    vitality: 10,
    intelligence: 10
  }
};
