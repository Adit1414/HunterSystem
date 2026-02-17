import db from '../config/database.js';
import { getXPForNextLevel } from '../services/progressionEngine.js';

export class User {
  /**
   * Get user by ID
   */
  static async getById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  /**
   * Get the default user (single-player app)
   */
  static async getDefault() {
    return await this.getById(1);
  }

  /**
   * Update user progress
   */
  static async update(id, data) {
    const { level, xp, total_xp_earned } = data;

    return await db.run(`
      UPDATE users 
      SET level = ?, xp = ?, total_xp_earned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [level, xp, total_xp_earned, id]);
  }

  /**
   * Add XP to user and handle leveling
   * @param {string|number} id User ID
   * @param {number} amount XP amount
   * @param {string} attribute Attribute name (strength, intelligence, etc.)
   */
  static async addXp(id, amount, attribute) {
    const user = await this.getById(id);
    if (!user) throw new Error('User not found');

    let currentLevel = user.level;
    let currentXp = user.xp;
    let totalXpEarned = user.total_xp_earned + amount;

    // Attribute XP tracking
    const attrKey = `xp_${attribute}`;
    let attrXp = (user[attrKey] || 0);

    // Track detailed changes for response
    let levelsGained = 0;
    let statChanges = {};
    const attributes = ['strength', 'creation', 'network', 'vitality', 'intelligence'];

    let remainingXpToAdd = amount;

    // Loop for multi-level gains
    while (remainingXpToAdd > 0) {
      const xpNeeded = getXPForNextLevel(currentLevel);
      const spaceInLevel = xpNeeded - currentXp;

      if (remainingXpToAdd >= spaceInLevel) {
        // Level Up!
        // 1. Fill current level buckets
        attrXp += spaceInLevel; // Add the portion that fills the level

        // 2. Calculate Stat Points for this level
        // We need to fetch current values of all attributes to calculate percentages
        // Note: In memory, we only updated the current `attribute`'s XP.
        // We should construct the full picture of this level's XP.

        const xpDistribution = {};
        let totalLevelXp = 0;

        for (const attr of attributes) {
          let val = user[`xp_${attr}`] || 0;
          if (attr === attribute) {
            // For the active attribute, we use the accumulated value (which includes previous partials + this fill)
            // Wait, `attrXp` tracks the accumulated value for the *current* attribute being processed.
            // But valid only for the first iteration? 
            // Logic check:
            // If we loop, we reset `attrXp` for the next level.
            // So `attrXp` variable holds the correct "XP for `attribute` in this level so far".
            val = attrXp;
          }
          xpDistribution[attr] = val;
          totalLevelXp += val;
        }

        // Logic Check: `totalLevelXp` should match `xpNeeded` (approximately, barring potential drift or initial seed)
        // Ideally we use `xpDistribution` percentages.

        let allocatedPoints = 0;
        const pointsToAdd = {};

        // Calculate points per 17% rule (Floor)
        for (const attr of attributes) {
          const percent = (xpDistribution[attr] / totalLevelXp) * 100;
          const points = Math.floor(percent / 17);
          pointsToAdd[attr] = points;
          allocatedPoints += points;
        }

        // Fill remaining points to reach exactly 5
        let pointsNeeded = 5 - allocatedPoints;
        if (pointsNeeded > 0) {
          // Sort by remainder of % 17
          const remainders = attributes.map(attr => {
            const percent = (xpDistribution[attr] / totalLevelXp) * 100;
            return { attr, remainder: percent % 17 };
          }).sort((a, b) => b.remainder - a.remainder);

          for (let i = 0; i < pointsNeeded; i++) {
            const target = remainders[i % remainders.length].attr; // cycled if needed (unlikely)
            pointsToAdd[target] = (pointsToAdd[target] || 0) + 1;
          }
        }

        // Apply Stats
        for (const attr of attributes) {
          if (pointsToAdd[attr] > 0) {
            const currentStat = user[attr] || 0; // Base stat from DB
            // We need to accumulate stat changes if we level up multiple times
            statChanges[attr] = (statChanges[attr] || 0) + pointsToAdd[attr];
          }
        }

        // 3. Prepare for Next Level
        remainingXpToAdd -= spaceInLevel;
        currentLevel++;
        currentXp = 0;
        levelsGained++;

        // Reset Attribute XPs for next level
        // However, the *remaining* XP (overflow) belongs to `attribute`
        for (const attr of attributes) {
          user[`xp_${attr}`] = 0; // Logical reset
        }
        attrXp = 0; // Reset local tracker

      } else {
        // Just add XP, no level up
        currentXp += remainingXpToAdd;
        attrXp += remainingXpToAdd;
        remainingXpToAdd = 0;
      }
    }

    // Prepare DB Update
    // We need to construct the SQL query dynamically based on stat changes
    let sql = `UPDATE users SET level = ?, xp = ?, total_xp_earned = ?, updated_at = CURRENT_TIMESTAMP`;
    const params = [currentLevel, currentXp, totalXpEarned];

    // Update Attribute XP columns (only the active one has non-zero value if leveled up? 
    // No, if we didn't level up, others remain. 
    // If we DID level up, others are 0, and `attribute` has `attrXp` (which is the overflow)
    // Wait, if we leveled up, step 3 reset user[`xp_${attr}`] to 0. 
    // And set `attrXp` to 0. 
    // Then the loop might continue (adding overflow). 
    // So `attrXp` will capture the overflow.
    // What about other attributes? They should be 0 (reset).
    // But `user` object in memory isn't fully updated until we save.
    // I should create a `finalAttributeXps` map.

    // Re-eval final state of attribute XPs:
    // If leveled up: All others 0. `attribute` = `attrXp` (overflow).
    // If NOT leveled up: 
    //    If we leveled up previously in loop: others are 0. `attribute` = `attrXp`.
    //    If NEVER leveled up: `attribute` = `user.xp_attr + amount`. Others unchanged.

    // Simplification:
    // We can run a partial update query.
    // But we need to know the values of others?
    // If we leveled up, we MUST set others to 0. 
    // If we didn't, we leave them alone (or set them to self, but saving query complexity).

    if (levelsGained > 0) {
      // Reset all, set target to attrXp
      for (const attr of attributes) {
        sql += `, xp_${attr} = ?`;
        params.push(attr === attribute ? attrXp : 0);
      }

      // Apply Stat Changes
      for (const [attr, gain] of Object.entries(statChanges)) {
        sql += `, ${attr} = ${attr} + ?`;
        params.push(gain);
      }

    } else {
      // No level up, just update the target attribute XP
      sql += `, xp_${attribute} = ?`;
      params.push(attrXp);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await db.run(sql, params);

    return {
      leveledUp: levelsGained > 0,
      levelsGained,
      newLevel: currentLevel,
      newXP: currentXp,
      statChanges
    };
  }

  /**
   * Reset user progress
   */
  static async reset(id) {
    return await db.run(`
      UPDATE users 
      SET level = 1, xp = 0, total_xp_earned = 0, 
          xp_strength = 0, xp_creation = 0, xp_network = 0, xp_vitality = 0, xp_intelligence = 0,
          strength = 10, creation = 10, network = 10, vitality = 10, intelligence = 10, stat_points = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }

  /**
   * Get user statistics
   */
  static async getStats(id) {
    const questStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM quests
    `);

    const itemStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `);

    return { quests: questStats, items: itemStats };
  }
}

export default User;