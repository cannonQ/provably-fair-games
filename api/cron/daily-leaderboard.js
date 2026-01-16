/**
 * Daily Leaderboard Cron Job
 * 
 * Runs at midnight UTC daily.
 * Queries top 3 scores from past 24 hours for each game.
 * Posts them to Ergo blockchain.
 * Updates Supabase records with transaction hash.
 * 
 * Vercel Cron: configured in vercel.json
 * 
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (not anon - needs write access)
 *   ERGO_SERVER_MNEMONIC
 *   ERGO_GAME_ADDRESS
 *   CRON_SECRET (optional - for securing endpoint)
 */

import { createClient } from '@supabase/supabase-js';
import { postScoresBatch } from '../../src/lib/ergo-tx.js';

// Use service key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Games to process
const GAMES = ['solitaire', 'garbage', 'yahtzee', 'blackjack', 'backgammon'];

// ===== Adding New Games ===== //
//
// To add a new game, simply add its name to the GAMES array above.
// No other changes needed - the game name becomes R4 register data.
//
// Requirements for new game:
// - Supabase LeaderBoard table has rows with game = 'newgame'
// - Game name matches exactly (case-sensitive)
//
// Score handling:
// - 0 scores in 24h → game skipped
// - 1-2 scores → posts what exists (1st only, or 1st + 2nd)
// - 3+ scores → posts top 3 (1st, 2nd, 3rd)

// Rank labels
const RANK_LABELS = ['1st', '2nd', '3rd'];

/**
 * Get top 3 scores from past 24 hours for a game
 * @param {string} game - Game type
 * @returns {Promise<Object[]>} Top 3 score records
 */
async function getTop3ForGame(game) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('LeaderBoard')
    .select('*')
    .eq('game', game)
    .gte('created_at', twentyFourHoursAgo)
    .is('tx_hash', null)  // Only scores not yet on chain
    .order('score', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error(`Error fetching top 3 for ${game}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Update Supabase records with transaction hash
 * @param {string[]} gameIds - Game IDs to update
 * @param {string} txHash - Transaction hash
 */
async function updateTxHashes(gameIds, txHash) {
  const { error } = await supabase
    .from('LeaderBoard')
    .update({ tx_hash: txHash })
    .in('game_id', gameIds);
  
  if (error) {
    console.error('Error updating tx hashes:', error);
    throw error;
  }
}

/**
 * Process daily leaderboard for all games
 */
async function processDailyLeaderboard() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const results = {
    processed: [],
    skipped: [],
    errors: []
  };
  
  for (const game of GAMES) {
    try {
      const topScores = await getTop3ForGame(game);
      
      if (topScores.length === 0) {
        results.skipped.push({ game, reason: 'No scores in past 24 hours' });
        continue;
      }
      
      // Prepare score data for chain submission
      const scoresForChain = topScores.map((record, index) => ({
        game: record.game,
        rank: RANK_LABELS[index],
        gameId: record.game_id,
        score: record.score,
        timeSeconds: record.time_seconds,
        playerName: record.player_name || 'Anonymous',
        date: today
      }));
      
      // Post batch to chain
      const txId = await postScoresBatch(scoresForChain);
      
      // Update Supabase with tx hash
      const gameIds = topScores.map(s => s.game_id);
      await updateTxHashes(gameIds, txId);
      
      results.processed.push({
        game,
        count: topScores.length,
        txId,
        scores: scoresForChain.map(s => ({
          rank: s.rank,
          player: s.playerName,
          score: s.score
        }))
      });
      
    } catch (error) {
      results.errors.push({
        game,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Vercel API handler
 */
export default async function handler(req, res) {
  // Only allow POST (from Vercel cron) or GET with secret
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
    console.log('Starting daily leaderboard processing...');
    const results = await processDailyLeaderboard();
    
    console.log('Daily leaderboard results:', JSON.stringify(results, null, 2));
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error('Daily leaderboard cron failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Vercel cron configuration
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-leaderboard",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
