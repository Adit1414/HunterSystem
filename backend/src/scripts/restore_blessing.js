import db from '../config/database.js';
import { randomUUID } from 'crypto';

async function restoreBlessing() {
    try {
        const userId = 1; // Default user ID
        const itemData = {
            id: randomUUID(),
            user_id: userId,
            name: "Ice Monarch's blessing",
            description: "A legendary artifact that protects your streak for one day if you fail to reach the minimum 3 daily quest threshold. (One-time use)",
            rarity: "legendary",
            type: "armor"
        };
        
        await db.run(`INSERT INTO items (id, user_id, name, description, rarity, type, obtained_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
            [itemData.id, itemData.user_id, itemData.name, itemData.description, itemData.rarity, itemData.type]);
            
        console.log("✅ Successfully restored 1 Ice Monarch's blessing to your inventory!");
        console.log("Please refresh the web page to see it.");
    } catch (error) {
        console.error("❌ Failed to restore blessing:", error);
    }
}

restoreBlessing();
