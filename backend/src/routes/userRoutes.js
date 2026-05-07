/**
 * User Routes
 * Handles player progress, stats, and profile
 */

import express from 'express';
import {
  getUserProgress,
  allocateStats,
  resetProgress,
  getAchievements,
  toggleDailyPenalty
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUserProgress);
router.post('/stats', allocateStats);
router.post('/reset', resetProgress);
router.get('/achievements', getAchievements);
router.post('/daily-penalty/toggle', toggleDailyPenalty);

export default router;