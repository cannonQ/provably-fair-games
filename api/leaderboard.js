/**
 * GET /api/leaderboard?game=solitaire&limit=10
 * 
 * Returns top scores for a game.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const VALID_GAMES = ['solitaire', 'garbage', 'yahtzee', 'blackjack', '2048', 'backgammon'];

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache headers (5 minutes for leaderboard data)
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');

  try {
    const { game, limit = 10, gameId } = req.query;

    // Validate game type
    if (!game || !VALID_GAMES.includes(game)) {
      return res.status(400).json({
        error: 'Invalid or missing game parameter',
        validGames: VALID_GAMES
      });
    }

    // If gameId is provided, fetch that specific entry
    if (gameId) {
      const { data, error } = await supabase
        .from('LeaderBoard')
        .select('*')
        .eq('game', game)
        .eq('game_id', gameId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({
        game,
        entries: [{ ...data, rank: null }],
        total: 1
      });
    }

    // Fetch top scores
    const { data, error } = await supabase
      .from('LeaderBoard')
      .select('*')
      .eq('game', game)
      .order('score', { ascending: false })
      .limit(parseInt(limit));

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
