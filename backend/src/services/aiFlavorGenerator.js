/**
 * AI Flavor Text Generator
 * Optional integration with Ollama/LangChain for generating quest descriptions
 * Falls back to templates if AI is unavailable
 */

import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Template-based fallbacks (used when AI is disabled or unavailable)
const QUEST_TEMPLATES = {
  'E': [
    'A simple task that needs attention. Every journey begins with small steps.',
    'Basic preparation is key to any hunter\'s success.',
    'Even the smallest quests build experience.',
    'The System recognizes all efforts, no matter how small.'
  ],
  'D': [
    'A standard mission for an aspiring hunter.',
    'This task will test your fundamental skills.',
    'Complete this to prove your dedication.',
    'The path of a hunter requires consistent effort.'
  ],
  'C': [
    'A challenging task that demands focus and skill.',
    'Only capable hunters should attempt this quest.',
    'Your growth as a hunter accelerates with challenges like these.',
    'The System acknowledges your improving capabilities.'
  ],
  'B': [
    'A difficult mission that will push your limits.',
    'This quest separates true hunters from amateurs.',
    'Great rewards await those who overcome this challenge.',
    'Your rank reflects your willingness to face hard trials.'
  ],
  'A': [
    'A critical mission of the highest importance.',
    'Few hunters are qualified to attempt this quest.',
    'Legends are forged through quests like these.',
    'The System has marked you for greatness.'
  ],
  'S': [
    'A catastrophic threat that demands immediate attention.',
    'Only the strongest hunters survive S-rank missions.',
    'The fate of many rests on your shoulders.',
    'This is what separates National Level Hunters from the rest.'
  ]
};

const REWARD_TEMPLATES = {
  common: [
    'A useful tool for any hunter.',
    'Standard equipment, but reliable.',
    'Every hunter needs the basics.'
  ],
  rare: [
    'An uncommon find with hidden potential.',
    'This item surpasses ordinary gear.',
    'A valuable addition to your arsenal.'
  ],
  epic: [
    'Power resonates from this artifact.',
    'Forged with rare materials and ancient techniques.',
    'Only strong hunters can wield this effectively.'
  ],
  legendary: [
    'A legendary artifact of immense power.',
    'Stories will be told of those who wield this.',
    'The System itself recognizes this item\'s significance.'
  ],
  mythic: [
    'An impossible creation that defies reality.',
    'Even the System struggles to categorize this artifact.',
    'Monarchs of old would envy this treasure.'
  ]
};

let ollamaModel = null;
let aiEnabled = false;

/**
 * Initialize Ollama connection
 * Silently fails if unavailable - app continues with templates
 */
export async function initializeAI() {
  if (process.env.OLLAMA_ENABLED === 'false' || !process.env.OLLAMA_BASE_URL) {
    console.log('ℹ AI flavor text disabled (using templates)');
    return false;
  }

  try {
    ollamaModel = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL,
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      temperature: 0.8, // Higher temperature for creativity
    });

    // Test connection
    await ollamaModel.invoke([
      new SystemMessage('You are a test.'),
      new HumanMessage('Respond with OK.')
    ]);

    aiEnabled = true;
    console.log('✓ AI flavor text enabled (Ollama connected)');
    return true;
    
  } catch (error) {
    console.log('⚠ Ollama unavailable, using template fallbacks');
    aiEnabled = false;
    return false;
  }
}

/**
 * Generate quest flavor text
 * Uses AI if available, falls back to templates
 * 
 * @param {string} title - Quest title
 * @param {string} difficulty - Quest difficulty
 * @returns {Promise<string>} Flavor text
 */
export async function generateQuestFlavor(title, difficulty) {
  // Use templates if AI disabled
  if (!aiEnabled || !ollamaModel) {
    const templates = QUEST_TEMPLATES[difficulty];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  try {
    const systemPrompt = `You are the System from Solo Leveling - a mysterious game-like interface that assigns quests to hunters. Generate a single SHORT (1-2 sentences) flavor text description for a quest. 

Style guidelines:
- Mysterious and game-like tone
- Reference "the System" or "hunters" occasionally  
- Match the quest difficulty (${difficulty}-rank: ${{E: 'easy', D: 'normal', C: 'challenging', B: 'hard', A: 'critical', S: 'catastrophic'}[difficulty]})
- Be concise and atmospheric
- NO introductions like "Quest:" or "Description:"
- Just the flavor text itself`;

    const response = await ollamaModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Quest: "${title}"`)
    ], {
      timeout: 5000 // 5 second timeout
    });

    return response.content.trim();
    
  } catch (error) {
    // Silently fall back to templates on error
    const templates = QUEST_TEMPLATES[difficulty];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Generate item flavor text
 * Uses AI if available, falls back to templates
 * 
 * @param {string} itemName - Item name
 * @param {string} rarity - Item rarity
 * @param {string} type - Item type
 * @returns {Promise<string>} Flavor text
 */
export async function generateItemFlavor(itemName, rarity, type) {
  // Use templates if AI disabled
  if (!aiEnabled || !ollamaModel) {
    const templates = REWARD_TEMPLATES[rarity];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  try {
    const systemPrompt = `You are the System from Solo Leveling. Generate a single SHORT (1 sentence) atmospheric description for an item reward. 

Style guidelines:
- Mysterious and game-like tone
- Match rarity (${rarity}: ${{common: 'basic', rare: 'uncommon', epic: 'powerful', legendary: 'legendary', mythic: 'mythical'}[rarity]})
- Type: ${type}
- Be concise and evocative
- NO item name in the description
- Just the description itself`;

    const response = await ollamaModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Item: "${itemName}"`)
    ], {
      timeout: 5000
    });

    return response.content.trim();
    
  } catch (error) {
    // Silently fall back to templates
    const templates = REWARD_TEMPLATES[rarity];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Generate level-up message
 * 
 * @param {number} newLevel 
 * @param {string} rankName 
 * @returns {Promise<string>} Motivational message
 */
export async function generateLevelUpMessage(newLevel, rankName) {
  const templates = [
    `Level ${newLevel} achieved. Your power grows.`,
    `The System acknowledges your progress. Level ${newLevel}.`,
    `You have surpassed your limits. Level ${newLevel}.`,
    `${rankName} - Your journey continues.`,
    `Level Up! The path of a hunter is never-ending.`
  ];

  if (!aiEnabled || !ollamaModel) {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  try {
    const systemPrompt = `You are the System from Solo Leveling. Generate a SHORT (1 sentence) congratulatory level-up message.

Style: Mysterious, encouraging, game-like. Reference the level (${newLevel}) or rank (${rankName}) naturally.`;

    const response = await ollamaModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage('Generate level up message')
    ], {
      timeout: 5000
    });

    return response.content.trim();
    
  } catch (error) {
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Check if AI is currently enabled
 * 
 * @returns {boolean} AI status
 */
export function isAIEnabled() {
  return aiEnabled;
}