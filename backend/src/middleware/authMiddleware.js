/**
 * Auth Middleware
 * Verifies Supabase JWT token and resolves the internal user ID
 * 
 * After this middleware runs, the request has:
 *   req.authUserId  — Supabase auth UUID
 *   req.dbUserId    — Internal database user ID (integer)
 */

import { createClient } from '@supabase/supabase-js';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_KEY not set — auth middleware will reject all requests');
}

/**
 * Verify JWT and resolve internal user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!supabase) {
      return res.status(500).json({ error: 'Auth service not configured' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.authUserId = user.id; // Supabase UUID

    // Resolve internal DB user (create if first login, migrate orphaned data if needed)
    const dbUser = await getOrCreateUser(user.id);
    req.dbUserId = dbUser.id;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Get or create the internal user row for a Supabase auth user.
 * On first login: if there are orphaned rows (no auth_user_id), claim them.
 */
async function getOrCreateUser(authUserId) {
  // Check if user already exists
  let user = await db.get('SELECT * FROM users WHERE auth_user_id = ?', [authUserId]);
  if (user) return user;

  // First time login — check for orphaned user rows (created before auth was added)
  const orphanedUser = await db.get(
    'SELECT * FROM users WHERE auth_user_id IS NULL ORDER BY id ASC'
  );

  if (orphanedUser) {
    // Claim the orphaned user + all their unlinked quests/items
    console.log(`🔗 Migrating orphaned user id=${orphanedUser.id} to auth_user_id=${authUserId}`);

    await db.run('UPDATE users SET auth_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [authUserId, orphanedUser.id]);

    // Migrate quests and items that have no user_id (legacy data)
    await db.run('UPDATE quests SET user_id = ? WHERE user_id IS NULL', [orphanedUser.id]);
    await db.run('UPDATE items SET user_id = ? WHERE user_id IS NULL', [orphanedUser.id]);

    return { ...orphanedUser, auth_user_id: authUserId };
  }

  // No orphaned users — create a fresh user row
  console.log(`🌱 Creating new user for auth_user_id=${authUserId}`);
  await db.run(`
    INSERT INTO users (auth_user_id, level, xp, total_xp_earned, strength, creation, network, vitality, intelligence, stat_points)
    VALUES (?, 1, 0, 0, 10, 10, 10, 10, 10, 0)
  `, [authUserId]);

  user = await db.get('SELECT * FROM users WHERE auth_user_id = ?', [authUserId]);
  return user;
}

export default requireAuth;
