/**
 * User Routes
 * Handles player progress, stats, and profile
 */

import express from 'express';
import {
  getUserProgress,
  allocateStats,
  resetProgress,
  getAchievements
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUserProgress);
router.post('/stats', allocateStats);
router.post('/reset', resetProgress);
router.get('/achievements', getAchievements);

export default router;