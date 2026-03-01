/**
 * Item Routes
 * Handles inventory and item management
 */

import express from 'express';
import {
  getAllItems,
  getItemById,
  deleteItem,
  chooseItem,
  getItemStats
} from '../controllers/itemController.js';

const router = express.Router();

router.get('/', getAllItems);
router.get('/stats/summary', getItemStats); // Moved up to prioritize static route matching
router.get('/:id', getItemById);
router.delete('/:id', deleteItem);
router.post('/choose', chooseItem);

export default router;