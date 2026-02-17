/**
 * Item Routes
 * Handles inventory and item management
 */

import express from 'express';
import db from '../config/database.js';
import Item from '../models/Item.js';

const router = express.Router();

/**
 * GET /api/items
 * Get all items in inventory with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { rarity, type, sortBy } = req.query;

    // Use Item model for basic filtering
    // Note: Model currently supports rarity and type filtering.
    // Sorting logic in model is basic.
    // If the query is complex (sortBy), we might need custom logic or update Model.
    // The current Item.getAll implementation has specific sorting hardcoded.
    // Let's rely on Item.getAll for now or use direct query if sorting differs.

    // The previous implementation had complex sorting logic in the route.
    // To match it, we should probably keep logic here or move it to Model.
    // Item.getAll has: ORDER BY custom_rarity, obtained_at DESC

    // If sortBy matches default, use model.
    // If not, use custom query here (async).

    if (!sortBy || sortBy === 'rarity') {
      const items = await Item.getAll({ rarity, type });
      const stats = await Item.getStats();
      res.json({ items, stats: stats.overall }); // aligning response structure
    } else {
      // Custom sorting logic re-implemented async
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

      if (sortBy === 'newest') {
        query += ' ORDER BY obtained_at DESC';
      } else if (sortBy === 'oldest') {
        query += ' ORDER BY obtained_at ASC';
      } else if (sortBy === 'name') {
        query += ' ORDER BY name ASC';
      } else {
        query += ' ORDER BY obtained_at DESC';
      }

      const items = await db.query(query, params);
      const stats = await Item.getStats(); // async call

      res.json({ items, stats: stats.overall });
    }

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/items/:id
 * Get single item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.getById(req.params.id);

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
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.getById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await Item.delete(req.params.id);

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
router.post('/choose', async (req, res) => {
  try {
    const { choiceId, itemData } = req.body;

    if (!itemData) {
      return res.status(400).json({ error: 'Item data required' });
    }

    // Insert chosen item
    await Item.create(itemData);

    const item = await Item.getById(itemData.id);

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
router.get('/stats/summary', async (req, res) => {
  try {
    // Item.getStats() returns { overall, byType, recentItems }
    const stats = await Item.getStats();

    const rarityDistribution = {
      mythic: stats.overall.mythic,
      legendary: stats.overall.legendary,
      epic: stats.overall.epic,
      rare: stats.overall.rare,
      common: stats.overall.common
    };

    res.json({
      overall: {
        total: stats.overall.total,
        uniqueTypes: stats.overall.uniqueTypes
      },
      rarityDistribution,
      byType: stats.byType,
      recentItems: stats.recentItems
    });

  } catch (error) {
    console.error('Error fetching item stats:', error);
    res.status(500).json({ error: 'Failed to fetch item statistics' });
  }
});

export default router;