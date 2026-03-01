/**
 * Express Server Entry Point
 * Main backend server for Hunter System
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { initializeAI } from './services/aiFlavorGenerator.js';
import userRoutes from './routes/userRoutes.js';
import questRoutes from './routes/questRoutes.js';
import itemRoutes from './routes/itemRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/items', itemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hunter System API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend in Production
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 404 handler (API only, if needed, but the catch-all usually handles frontend)
// We keep this for /api/* routes that don't match, if we want to be strict, 
// but since * catches everything, we need to be careful.
// Let's rely on the * handler for non-api routes.
// For API routes that fail, they should fall through if not matched?? 
// Actually, Express matches in order. 
// So /api routes are matched first. 
// If an /api route is missing, it falls through.
// We should probably explicitly handle /api 404s before the * handler if we want JSON errors for API.
// But for simplicity in this setup, the * handler is fine. 


// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initializeDatabase();

    // Initialize AI (optional)
    console.log('Checking AI availability...');
    await initializeAI();

    // Start Daily Quests Cron
    const { startDailyQuestCron } = await import('./services/dailyQuestService.js');
    startDailyQuestCron();

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('   HUNTER SYSTEM - Backend Server     ');
      console.log('═══════════════════════════════════════');
      console.log(`   Status: Running`);
      console.log(`   Port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log('═══════════════════════════════════════');
      console.log('');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();