/**
 * Reward Generator
 * Handles item drops, loot tables, and reward generation
 */

import { randomUUID } from 'crypto';

// Drop rates by quest difficulty
// Each difficulty has different chances for each rarity tier
const DROP_RATES = {
  'E': { common: 0.80, rare: 0.15, epic: 0.04, legendary: 0.01, mythic: 0 },
  'D': { common: 0.60, rare: 0.30, epic: 0.08, legendary: 0.02, mythic: 0 },
  'C': { common: 0.40, rare: 0.40, epic: 0.15, legendary: 0.04, mythic: 0.01 },
  'B': { common: 0.20, rare: 0.40, epic: 0.25, legendary: 0.12, mythic: 0.03 },
  'A': { common: 0.10, rare: 0.30, epic: 0.35, legendary: 0.20, mythic: 0.05 },
  'S': { common: 0, rare: 0.20, epic: 0.40, legendary: 0.30, mythic: 0.10 }
};

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

// Description templates by Type and Rarity
const DESCRIPTION_TEMPLATES = {
  weapon: {
    common: [
      'A standard issue weapon, mass-produced for city guards.',
      'Simple but reliable throughout the early stages of hunting.',
      'Shows signs of wear, but the edge is still keen enough.',
      'A beginner\'s weapon. better than fighting with bare hands.'
    ],
    rare: [
      'Forged with superior steel, it hums slightly when swung.',
      'A weapon of fine craftsmanship, balanced perfectly for combat.',
      'Etched with minor runes to enhance its durability.',
      'Preferred by B-rank hunters for its reliability.'
    ],
    epic: [
      'Radiates a faint magical aura visible to those with high Intelligence.',
      'Crafted from monster bones and reinforced with magic.',
      'A weapon that has tasted the blood of high-ranking beasts.',
      'Vibrates with energy, longing for battle.'
    ],
    legendary: [
      'A masterpiece that seems to move on its own accord.',
      'Forged in the breath of a dragon, it sears the air around it.',
      'Legends say this weapon once felled a Titan.',
      'Its power is so great it requires a strong will to wield.'
    ],
    mythic: [
      'A weapon that defies the laws of physics. It cuts through reality itself.',
      'Contains the soul of a vanquished Monarch.',
      'Merely looking at it strikes fear into the hearts of monsters.',
      'The pinnacle of destruction, created by the Absolute Being.'
    ]
  },
  armor: {
    common: [
      'Basic protection against minor scratches and bites.',
      'Made of treated leather and iron scraps.',
      'Lightweight, but don\'t expect it to stop a heavy blow.',
      'Standard hunter gear found in local shops.'
    ],
    rare: [
      'Reinforced with mana-hardened steel plates.',
      'Offers decent protection without sacrificing mobility.',
      'A sturdy set of armor that has seen many battles.',
      'Designed to deflect claws and fangs of mid-tier beasts.'
    ],
    epic: [
      'Scales of a dungeon boss make up the core of this armor.',
      'Enchanted to reduce the weight while increasing defense.',
      'Glows softly when attacked, absorbing impact energy.',
      'Worn by elite assault team members.'
    ],
    legendary: [
      'Impervious to normal steel. Only magic can scratch it.',
      'Forged from the hide of an Ancient Dragon.',
      'Seems to regenerate minor damage properly over time.',
      'A legendary defense that turns its wearer into a fortress.'
    ],
    mythic: [
      'Armor woven from shadows and void energy.',
      'Physical attacks seem to phase right through it.',
      'The ultimate defense, rejecting all malice directed at it.',
      'You feel invincible while wearing this divine vestment.'
    ]
  },
  accessory: {
    common: [
      'A simple charm sold for good luck.',
      'Made of polished stone. It looks nice.',
      'A small trinket that offers a tiny boost.',
      'Common jewelry modified to hold a little mana.'
    ],
    rare: [
      'Contains a small mana crystal that pulses correctly.',
      'Helps stabilize the flow of magic in the body.',
      'A silver piece enhanced by an enchanter.',
      'Found in the hoard of a Goblin Champion.'
    ],
    epic: [
      'An ancient artifact recovered from a Red Gate.',
      'Significantly amplifies the wearer\'s magical presence.',
      'Warm to the touch, it wards off mental fatigue.',
      'A jeweled accessory that shines with inner light.'
    ],
    legendary: [
      'Allows the user to store immense amounts of mana.',
      'A royal heirloom from a fallen kingdom inside a Gate.',
      'Time seems to move slower for the wearer.',
      'Grants power usually reserved for National Level Hunters.'
    ],
    mythic: [
      'A fragment of the World Tree, endless energy flows from it.',
      'Connects the wearer directly to the mana stream.',
      'An artifact that can rewrite the laws of luck.',
      'The cosmos seems to align for whoever wears this.'
    ]
  },
  consumable: {
    common: [
      'Tastes like stale bread, but restores health.',
      'A bitter liquid that numbs pain.',
      'Standard rations for dungeon raids.',
      'Basic first-aid supplies.'
    ],
    rare: [
      'A glowing blue liquid that refreshes the mind.',
      'Potent herbs compressed into a pill.',
      'Instantly closes minor wounds.',
      'A drink that revitalizes stamina immediately.'
    ],
    epic: [
      'Golden elixir that cures all ailments.',
      'A scroll containing a powerful one-time spell.',
      'Restores a large amount of mana in seconds.',
      'Can regrow lost limbs if used immediately.'
    ],
    legendary: [
      'The "Elixir of Life" sought by many.',
      'Unlocks dormant potential within the body.',
      'A crystal that grants a permanent stat boost.',
      'Can resurrect a hunter if they died recently (Theoretically).'
    ],
    mythic: [
      'Essence of a god. Consuming this transcends humanity.',
      'A drop of the Shadow Monarch\'s blood.',
      'Grants knowledge of the universe.',
      'Transforms the body into a vessel of pure mana.'
    ]
  }
};

/**
 * Determine rarity based on drop rates and quest difficulty
 * 
 * @param {string} difficulty - Quest difficulty (E-S)
 * @returns {string} Rarity tier
 */
function rollRarity(difficulty) {
  const rates = DROP_RATES[difficulty];
  const roll = Math.random();

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

  // Pick random description from type+rarity combination
  const descPool = DESCRIPTION_TEMPLATES[type][rarity];
  const description = descPool[Math.floor(Math.random() * descPool.length)];

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
  const dropChances = {
    'E': 0.3,  // 30% chance
    'D': 0.5,  // 50% chance
    'C': 0.7,  // 70% chance
    'B': 0.9,  // 90% chance
    'A': 1.0,  // Guaranteed
    'S': 1.0   // Guaranteed
  };

  return Math.random() < dropChances[difficulty];
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