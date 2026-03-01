/**
 * Quest Routes
 * Handles quest CRUD operations and completion logic
 */

import express from 'express';
import {
  getAllQuests,
  getDailyQuests,
  getArchivedQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  completeQuest,
  failQuest
} from '../controllers/questController.js';

const router = express.Router();

router.get('/', getAllQuests);
router.get('/daily', getDailyQuests);
router.get('/archive', getArchivedQuests);
router.get('/:id', getQuestById);
router.post('/', createQuest);
router.put('/:id', updateQuest);
router.delete('/:id', deleteQuest);
router.post('/:id/complete', completeQuest);
router.post('/:id/fail', failQuest);

export default router;