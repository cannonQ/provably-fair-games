/**
 * Session Cleanup Cron Job
 *
 * Runs every 6 hours to clean up old game sessions.
 * Deletes sessions older than 24 hours from the game_sessions table.
 *
 * This prevents the database from growing indefinitely with old session data.
 * Sessions are only needed until the game ends and the secret is revealed.
 *
 * Vercel Cron: configured in vercel.json
 *
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (not anon - needs delete access)
 *   CRON_SECRET (optional - for securing endpoint)
 */

import { createClient } from '@supabase/supabase-js';

// Use service key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Delete sessions older than this many hours
const SESSION_MAX_AGE_HOURS = 24;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;

/**
 * Clean up old game sessions
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupOldSessions() {
  const cutoffTime = new Date(Date.now() - SESSION_MAX_AGE_MS).toISOString();

  console.log(`Cleaning up sessions older than ${cutoffTime}`);

  try {
    // First, get count of sessions to be deleted (for logging)
    const { count: totalCount } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: oldCount } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffTime);

    // Delete old sessions
    const { data: deletedSessions, error } = await supabase
      .from('game_sessions')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id, game_type, created_at');

    if (error) {
      console.error('Error deleting old sessions:', error);
      throw error;
    }

    const deletedCount = deletedSessions?.length || 0;
    const remainingCount = totalCount - deletedCount;

    console.log(`Deleted ${deletedCount} sessions (${oldCount} found older than cutoff)`);
    console.log(`Remaining sessions: ${remainingCount}`);

    return {
      success: true,
      cutoffTime,
      totalSessionsBefore: totalCount,
      sessionsDeleted: deletedCount,
      sessionsRemaining: remainingCount,
      deletedSessions: deletedSessions?.map(s => ({
        id: s.id,
        gameType: s.game_type,
        createdAt: s.created_at
      })) || []
    };

  } catch (error) {
    console.error('Session cleanup failed:', error);
    throw error;
  }
}

/**
 * Vercel API handler
 */
export default async function handler(req, res) {
  // Only allow POST (from Vercel cron) or GET with secret (for manual testing)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('Starting session cleanup...');
    const startTime = Date.now();

    const results = await cleanupOldSessions();

    const duration = Date.now() - startTime;
    console.log(`Session cleanup completed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      results
    });

  } catch (error) {
    console.error('Session cleanup cron failed:', error);
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Vercel cron configuration
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-sessions",
 *     "schedule": "0 */6 * * *"
 *   }]
 * }
 *
 * Schedule explanation:
 * "0 */6 * * *" = Every 6 hours (at minute 0)
 *
 * Alternative schedules:
 * "0 */12 * * *" = Every 12 hours
 * "0 0 * * *" = Once daily at midnight
 * "0 */4 * * *" = Every 4 hours
 */
