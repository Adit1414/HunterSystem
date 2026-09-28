/**
 * Reward Generator
 * Handles item drops, loot tables, and reward generation
 */

import { randomUUID } from 'crypto';
import { GAME_CONSTANTS } from '../config/gameConstants.js';

// Item type distribution (equal chances)
const ITEM_TYPES = ['weapon', 'armor', 'accessory', 'consumable'];

// Naming templates for different rarities and types
const ITEM_NAMES = {
  weapon: {
    common: ['Iron Dagger', 'Wooden Staff', 'Short Sword', 'Training Bow'],
    rare: ['Steel Blade', 'Mage\'s Staff', 'Hunter\'s Longbow', 'Battle Axe'],
    epic: ['Crimson Edge', 'Arcane Scepter', 'Shadow Bow', 'Frost Hammer'],
    legendary: ['Demon Fang', 'Staff of the Ancients', 'Moonlight Arrows', 'Titan\'s Maul'],
    mythic: ['Sovereign\'s Wrath', 'World Tree Staff', 'Void Reaper', 'Dragon Slayer']
  },
  armor: {
    common: ['Leather Vest', 'Cloth Robe', 'Iron Helmet', 'Worn Boots'],
    rare: ['Knight\'s Plate', 'Mage Robes', 'Steel Greaves', 'Hunter\'s Cloak'],
    epic: ['Dragonscale Mail', 'Shadowweave Robes', 'Titanium Armor', 'Phoenix Mantle'],
    legendary: ['Immortal Plate', 'Astral Vestments', 'Demon Lord Armor', 'Celestial Garb'],
    mythic: ['Monarch\'s Regalia', 'Eternal Night Armor', 'Divine Protection', 'World Breaker Plate']
  },
  accessory: {
    common: ['Simple Ring', 'Leather Band', 'Bronze Amulet', 'Glass Earring'],
    rare: ['Silver Ring', 'Enchanted Bracelet', 'Jade Necklace', 'Sapphire Earrings'],
    epic: ['Ring of Power', 'Mana Bracers', 'Amulet of Vitality', 'Shadow Earrings'],
    legendary: ['Ring of the Monarch', 'Bracelet of Time', 'Heart of the Dragon', 'Eyes of Eternity'],
    mythic: ['Absolute Being\'s Ring', 'Infinity Band', 'World Tear Pendant', 'Void Essence']
  },
  consumable: {
    common: ['Health Potion', 'Mana Potion', 'Bread', 'Water Flask'],
    rare: ['Greater Health Potion', 'Elixir of Strength', 'Mana Crystal', 'Stamina Tonic'],
    epic: ['Full Recovery Potion', 'Buff Scroll', 'Stat Reset Ticket', 'XP Boost (1hr)'],
    legendary: ['Instant Dungeon Key', 'Skill Book', 'Awakening Stone', 'Miracle Elixir'],
    mythic: ['Shadow Extract', 'Dimensional Rift Key', 'Job Change Stone', 'Monarch\'s Blessing']
  }
};

// 1:1 Mapping of item names to descriptions
export const ITEM_DESCRIPTIONS = {
  // Weapons
  'Iron Dagger': 'A plain iron dagger issued to hunters who have yet to prove themselves.',
  'Wooden Staff': 'A humble staff used by novice mages to channel their first traces of mana.',
  'Short Sword': 'A reliable blade favored by hunters still learning the basics of combat.',
  'Training Bow': 'A simple bow designed to sharpen the aim of inexperienced hunters.',
  'Steel Blade': 'Forged from refined steel, this blade can withstand the claws of mid-tier monsters.',
  'Mage\'s Staff': 'A rune-etched staff that greatly improves the flow of mana through its wielder.',
  'Hunter\'s Longbow': 'A finely balanced bow built for hunters who prefer to kill from a distance.',
  'Battle Axe': 'A heavy axe capable of cleaving through both armor and monster bone.',
  'Crimson Edge': 'A blood-red blade that grows sharper with every powerful foe it strikes.',
  'Arcane Scepter': 'An ancient scepter that crackles with concentrated magical energy.',
  'Shadow Bow': 'A dark bow whose arrows seem to disappear before finding their target.',
  'Frost Hammer': 'A massive hammer that freezes whatever it strikes.',
  'Demon Fang': 'Forged from the fang of a high-ranking demon, it radiates a sinister aura.',
  'Staff of the Ancients': 'A relic said to contain the accumulated wisdom of countless forgotten mages.',
  'Moonlight Arrows': 'Arrows that glow beneath the moon and never seem to lose their mark.',
  'Titan\'s Maul': 'A colossal weapon said to have been wielded by a giant that could shatter mountains.',
  'Sovereign\'s Wrath': 'A weapon forged for beings whose power stands far beyond that of ordinary hunters.',
  'World Tree Staff': 'A sacred staff infused with the endless mana of the World Tree.',
  'Void Reaper': 'A blade that cuts through more than flesh, severing space itself.',
  'Dragon Slayer': 'A legendary weapon created for one purpose: bringing down creatures thought invincible.',

  // Armor
  'Leather Vest': 'Basic leather protection worn by hunters entering their first Gates.',
  'Cloth Robe': 'A lightweight robe offering minimal protection while allowing mana to flow freely.',
  'Iron Helmet': 'A simple iron helmet meant to keep a novice hunter\'s head intact.',
  'Worn Boots': 'Old hunter boots that have survived more Gates than their appearance suggests.',
  'Knight\'s Plate': 'Reinforced plate armor built to withstand the attacks of powerful beasts.',
  'Mage Robes': 'Mana-infused robes designed to protect a mage without restricting spellcasting.',
  'Steel Greaves': 'Heavy steel greaves capable of turning aside claws and crushing blows.',
  'Hunter\'s Cloak': 'A durable cloak prized by hunters who rely on speed, stealth, and surprise.',
  'Dragonscale Mail': 'Armor forged from the scales of a dragon, each piece harder than ordinary steel.',
  'Shadowweave Robes': 'Dark robes woven with shadow magic that seem to blur their wearer\'s presence.',
  'Titanium Armor': 'Exceptionally durable armor built to endure attacks that would crush lesser equipment.',
  'Phoenix Mantle': 'A blazing mantle that radiates warmth and slowly restores its wearer\'s strength.',
  'Immortal Plate': 'Armor so resilient that even devastating blows struggle to leave a lasting mark.',
  'Astral Vestments': 'Otherworldly garments that shimmer as though woven from the night sky itself.',
  'Demon Lord Armor': 'Armor forged from the remains of a Demon Lord, carrying a terrifying aura.',
  'Celestial Garb': 'Sacred armor said to have been blessed by beings beyond the human world.',
  'Monarch\'s Regalia': 'The ceremonial armor of a ruler whose authority transcends the laws of ordinary hunters.',
  'Eternal Night Armor': 'Armor cloaked in an endless darkness that swallows attacks before they reach the wearer.',
  'Divine Protection': 'A miraculous defense that rejects every force deemed hostile by its wearer.',
  'World Breaker Plate': 'Armor forged for one capable of standing at the center of a world-ending battle.',

  // Accessories
  'Simple Ring': 'An ordinary ring carrying a faint trace of mana.',
  'Leather Band': 'A modest band worn by hunters seeking a small boost without drawing attention.',
  'Bronze Amulet': 'A simple charm believed to bring luck inside dangerous Gates.',
  'Glass Earring': 'A fragile-looking earring that surprisingly holds a small amount of mana.',
  'Silver Ring': 'Refined silver shaped around a tiny mana crystal.',
  'Enchanted Bracelet': 'A carefully enchanted bracelet that stabilizes the flow of mana through the body.',
  'Jade Necklace': 'A jade pendant said to calm the mind in the presence of monstrous mana.',
  'Sapphire Earrings': 'Sapphire earrings that amplify the wearer\'s sensitivity to magical energy.',
  'Ring of Power': 'A powerful ring that greatly amplifies the strength of its wearer.',
  'Mana Bracers': 'Magical bracers capable of storing and releasing vast amounts of mana.',
  'Amulet of Vitality': 'A precious amulet that strengthens the body and accelerates recovery.',
  'Shadow Earrings': 'Earrings infused with shadow magic that make their wearer harder to detect.',
  'Ring of the Monarch': 'A royal ring imbued with the overwhelming authority of a Monarch.',
  'Bracelet of Time': 'An ancient bracelet said to distort the flow of time around its wearer.',
  'Heart of the Dragon': 'A gem resembling a dragon\'s heart, pulsing with immense magical power.',
  'Eyes of Eternity': 'A mysterious pair of earrings that seem capable of seeing beyond the present moment.',
  'Absolute Being\'s Ring': 'A relic of unimaginable power, said to have belonged to the creator of the world.',
  'Infinity Band': 'A ring containing a source of mana that appears to have no end.',
  'World Tear Pendant': 'A pendant born from a fracture in reality itself.',
  'Void Essence': 'A crystallized fragment of the void, containing power that defies all known laws.',

  // Consumables
  'Health Potion': 'A basic potion that closes wounds and restores a small amount of health.',
  'Mana Potion': 'A bitter blue potion that replenishes depleted mana.',
  'Bread': 'Simple hunter rations meant to keep the body going during long expeditions.',
  'Water Flask': 'A plain flask of purified water carried by hunters on extended dungeon runs.',
  'Greater Health Potion': 'A concentrated potion capable of restoring serious injuries in moments.',
  'Elixir of Strength': 'A potent elixir that temporarily fills the body with unnatural physical power.',
  'Mana Crystal': 'A crystallized source of mana that releases its energy when consumed.',
  'Stamina Tonic': 'A powerful tonic that rapidly restores a hunter\'s exhausted body.',
  'Full Recovery Potion': 'A rare potion capable of restoring the body from the brink of collapse.',
  'Buff Scroll': 'A one-use magical scroll that temporarily enhances the user\'s abilities.',
  'Stat Reset Ticket': 'A strange artifact capable of undoing the distribution of a hunter\'s growth.',
  'XP Boost (1hr)': 'A mysterious potion that dramatically accelerates the growth of a hunter for one hour.',
  'Instant Dungeon Key': 'A mysterious key capable of opening a Gate without warning.',
  'Skill Book': 'An ancient tome containing the knowledge required to awaken a new ability.',
  'Awakening Stone': 'A rare stone said to awaken dormant potential within those who possess it.',
  'Miracle Elixir': 'A legendary elixir said to restore even injuries that should have been beyond recovery.',
  'Shadow Extract': 'A concentrated essence of shadow capable of transforming mana beyond its natural limits.',
  'Dimensional Rift Key': 'A forbidden key said to unlock passages between distant dimensions.',
  'Job Change Stone': 'A mysterious stone capable of reshaping a hunter\'s very path of power.',
  'Monarch\'s Blessing': 'A fragment of a Monarch\'s power that temporarily elevates the one who consumes it.'
};

/**
 * Determine rarity based on drop rates and quest difficulty
 * 
 * @param {string} difficulty - Quest difficulty (E-S)
 * @returns {string} Rarity tier
 */
function rollRarity(difficulty) {
  const rates = GAME_CONSTANTS.RARITY_CHANCES[difficulty];
  const roll = Math.random() * 100;

  let cumulative = 0;
  for (const [rarity, chance] of Object.entries(rates)) {
    cumulative += chance;
    if (roll <= cumulative) {
      return rarity;
    }
  }

  return 'common'; // Fallback
}

/**
 * Generate a random item
 * 
 * @param {string} difficulty - Quest difficulty (affects rarity)
 * @param {string} forcedRarity - Force specific rarity (for milestone rewards)
 * @returns {Object} Item object
 */
export function generateItem(difficulty, forcedRarity = null) {
  const rarity = forcedRarity || rollRarity(difficulty);
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];

  // Pick random name from rarity+type combination
  const namePool = ITEM_NAMES[type][rarity];
  const name = namePool[Math.floor(Math.random() * namePool.length)];

  // Pick fixed description based on item name
  const description = ITEM_DESCRIPTIONS[name] || "An unknown item emitting strange energy.";

  return {
    id: randomUUID(),
    name,
    description,
    rarity,
    type,
    obtained_at: new Date().toISOString()
  };
}

/**
 * Generate multiple items for choice (used in level-up rewards)
 * 
 * @param {number} count - Number of items to generate
 * @param {string} rarity - Forced rarity
 * @returns {Array} Array of item objects
 */
export function generateItemChoices(count, rarity) {
  const items = [];
  const usedNames = new Set();

  while (items.length < count) {
    const item = generateItem('S', rarity); // Use S-rank to get rarity

    // Ensure unique names in the choice
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  return items;
}

/**
 * Determine if a quest should drop an item
 * Higher difficulties have guaranteed drops
 * 
 * @param {string} difficulty 
 * @returns {boolean} Whether to drop an item
 */
export function shouldDropItem(difficulty) {
  const dropChance = GAME_CONSTANTS.DROP_RATES[difficulty] / 100;
  return Math.random() < dropChance;
}

/**
 * Generate quest completion rewards
 * Returns items + any special rewards
 * 
 * @param {string} difficulty 
 * @param {Array} levelUpRewards - Special rewards from level up
 * @returns {Object} Reward package
 */
export function generateQuestRewards(difficulty, levelUpRewards = []) {
  const rewards = {
    items: [],
    special: []
  };

  // Standard item drop
  if (shouldDropItem(difficulty)) {
    rewards.items.push(generateItem(difficulty));
  }

  // Process level-up special rewards
  for (const reward of levelUpRewards) {
    if (reward.type === 'guaranteed_rare') {
      // Roll rare or better
      const rarities = ['rare', 'epic', 'legendary', 'mythic'];
      const weights = [0.6, 0.25, 0.12, 0.03];

      let roll = Math.random();
      let cumulative = 0;
      let chosenRarity = 'rare';

      for (let i = 0; i < rarities.length; i++) {
        cumulative += weights[i];
        if (roll <= cumulative) {
          chosenRarity = rarities[i];
          break;
        }
      }

      rewards.items.push(generateItem(difficulty, chosenRarity));
      rewards.special.push(reward);

    } else if (reward.type === 'legendary_choice') {
      // Generate 3 legendary items to choose from
      const choices = generateItemChoices(3, 'legendary');
      rewards.special.push({
        ...reward,
        choices
      });

    } else if (reward.type === 'streak_freeze') {
      rewards.items.push({
        id: randomUUID(),
        name: "Ice Monarch's blessing",
        description: "A legendary artifact that protects your streak for one day if you fail to reach the minimum 3 daily quest threshold. (One-time use)",
        rarity: "legendary",
        type: "armor"
      });
      rewards.special.push(reward);

    } else {
      rewards.special.push(reward);
    }
  }

  return rewards;
}

/**
 * Get rarity color (for frontend use)
 * 
 * @param {string} rarity 
 * @returns {string} Color code
 */
export function getRarityColor(rarity) {
  const colors = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444'
  };

  return colors[rarity] || colors.common;
}