import db from '../config/database.js';
import Item from '../models/Item.js';

export const getAllItems = async (req, res) => {
    try {
        const userId = req.dbUserId;
        const { rarity, type, sortBy } = req.query;

        if (!sortBy || sortBy === 'rarity') {
            const items = await Item.getAll({ rarity, type, user_id: userId });
            const stats = await Item.getStats(userId);
            res.json({ items, stats: stats.overall });
        } else {
            let query = 'SELECT * FROM items WHERE user_id = ?';
            const params = [userId];

            if (rarity) {
                query += ' AND rarity = ?';
                params.push(rarity);
            }
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            if (sortBy === 'newest') query += ' ORDER BY obtained_at DESC';
            else if (sortBy === 'oldest') query += ' ORDER BY obtained_at ASC';
            else if (sortBy === 'name') query += ' ORDER BY name ASC';
            else query += ' ORDER BY obtained_at DESC';

            const items = await db.query(query, params);
            const stats = await Item.getStats(userId);
            res.json({ items, stats: stats.overall });
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
};

export const getItemById = async (req, res) => {
    try {
        const item = await Item.getById(req.params.id, req.dbUserId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ item });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
};

export const deleteItem = async (req, res) => {
    try {
        const item = await Item.getById(req.params.id, req.dbUserId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        await Item.delete(req.params.id);
        res.json({ message: 'Item discarded successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

export const chooseItem = async (req, res) => {
    try {
        const { choiceId, itemData } = req.body;
        if (!itemData) return res.status(400).json({ error: 'Item data required' });

        await Item.create({ ...itemData, user_id: req.dbUserId });
        const item = await Item.getById(itemData.id, req.dbUserId);
        res.json({ message: 'Item claimed successfully', item });
    } catch (error) {
        console.error('Error claiming item:', error);
        res.status(500).json({ error: 'Failed to claim item' });
    }
};

export const getItemStats = async (req, res) => {
    try {
        const stats = await Item.getStats(req.dbUserId);
        res.json({
            overall: { total: stats.overall.total, uniqueTypes: stats.overall.uniqueTypes },
            rarityDistribution: {
                mythic: stats.overall.mythic,
                legendary: stats.overall.legendary,
                epic: stats.overall.epic,
                rare: stats.overall.rare,
                common: stats.overall.common
            },
            byType: stats.byType,
            recentItems: stats.recentItems
        });
    } catch (error) {
        console.error('Error fetching item stats:', error);
        res.status(500).json({ error: 'Failed to fetch item statistics' });
    }
};
