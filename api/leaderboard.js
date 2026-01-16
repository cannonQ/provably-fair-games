/**
 * GET /api/leaderboard?game=solitaire&limit=10
 * 
 * Returns top scores for a game.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmutcncnppyzirywzozc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_K-KApBISA6IiiNE9CCnjNA_3qhuNg8k'
);

const VALID_GAMES = ['solitaire', 'garbage', 'yahtzee'];

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { game, limit = 10, gameId } = req.query;

    // Validate game type
    if (!game || !VALID_GAMES.includes(game)) {
      return res.status(400).json({
        error: 'Invalid or missing game parameter',
        validGames: VALID_GAMES
      });
    }

    // Build query
    let query = supabase
      .from('LeaderBoard')
      .select('*')
      .eq('game', game);

    // If specific gameId requested, filter by it
    if (gameId) {
      query = query.eq('game_id', gameId);
    } else {
      // Otherwise, get top scores with limit
      query = query
        .order('score', { ascending: false })
        .limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Add rank to each entry
    const entries = data.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return res.status(200).json({
      game,
      entries,
      total: entries.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
