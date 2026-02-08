/**
 * Item Routes
 * Handles inventory and item management
 */

import express from 'express';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/items
 * Get all items in inventory with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { rarity, type, sortBy } = req.query;
    
    let query = 'SELECT * FROM items';
    const conditions = [];
    const params = [];

    if (rarity) {
      conditions.push('rarity = ?');
      params.push(rarity);
    }

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const rarityOrder = {
      'mythic': 5,
      'legendary': 4,
      'epic': 3,
      'rare': 2,
      'common': 1
    };

    if (sortBy === 'rarity') {
      // Sort by rarity (mythic first), then by obtained date
      query += ` ORDER BY 
        CASE rarity
          WHEN 'mythic' THEN 5
          WHEN 'legendary' THEN 4
          WHEN 'epic' THEN 3
          WHEN 'rare' THEN 2
          WHEN 'common' THEN 1
        END DESC,
        obtained_at DESC`;
    } else if (sortBy === 'newest') {
      query += ' ORDER BY obtained_at DESC';
    } else if (sortBy === 'oldest') {
      query += ' ORDER BY obtained_at ASC';
    } else if (sortBy === 'name') {
      query += ' ORDER BY name ASC';
    } else {
      // Default: newest first
      query += ' ORDER BY obtained_at DESC';
    }

    const items = db.prepare(query).all(...params);

    // Get statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `).get();

    res.json({ 
      items,
      stats
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/items/:id
 * Get single item by ID
 */
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });

  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * DELETE /api/items/:id
 * Delete/discard item from inventory
 */
router.delete('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);

    res.json({ message: 'Item discarded successfully' });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

/**
 * POST /api/items/choose
 * Choose an item from level-up reward choices
 * Expects: { choiceId: string, itemId: string }
 */
router.post('/choose', (req, res) => {
  try {
    const { choiceId, itemData } = req.body;

    if (!itemData) {
      return res.status(400).json({ error: 'Item data required' });
    }

    // Insert chosen item
    db.prepare(`
      INSERT INTO items (id, name, description, rarity, type, obtained_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      itemData.id,
      itemData.name,
      itemData.description,
      itemData.rarity,
      itemData.type
    );

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemData.id);

    res.json({ 
      message: 'Item claimed successfully',
      item 
    });

  } catch (error) {
    console.error('Error claiming item:', error);
    res.status(500).json({ error: 'Failed to claim item' });
  }
});

/**
 * GET /api/items/stats/summary
 * Get detailed inventory statistics
 */
router.get('/stats/summary', (req, res) => {
  try {
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT type) as uniqueTypes,
        SUM(CASE WHEN rarity = 'mythic' THEN 1 ELSE 0 END) as mythic,
        SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
        SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
        SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
        SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common
      FROM items
    `).get();

    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM items
      GROUP BY type
      ORDER BY count DESC
    `).all();

    const recentItems = db.prepare(`
      SELECT * FROM items
      ORDER BY obtained_at DESC
      LIMIT 5
    `).all();

    const rarityDistribution = {
      mythic: overall.mythic,
      legendary: overall.legendary,
      epic: overall.epic,
      rare: overall.rare,
      common: overall.common
    };

    res.json({
      overall: {
        total: overall.total,
        uniqueTypes: overall.uniqueTypes
      },
      rarityDistribution,
      byType,
      recentItems
    });

  } catch (error) {
    console.error('Error fetching item stats:', error);
    res.status(500).json({ error: 'Failed to fetch item statistics' });
  }
});

export default router;