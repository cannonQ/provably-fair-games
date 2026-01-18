/**
 * GET /api/game/[gameId]
 *
 * Returns game verification data from leaderboard by gameId.
 * Used when localStorage doesn't have the game data.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache headers (1 hour for verification data - it never changes)
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'Missing gameId parameter' });
    }

    // Fetch game data from leaderboard
    const { data, error } = await supabase
      .from('LeaderBoard')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Game not found' });
      }
      throw error;
    }

    // Return verification-relevant data
    return res.status(200).json({
      gameId: data.game_id,
      game: data.game,
      blockHeight: data.block_height,
      blockHash: data.block_hash,
      txHash: data.tx_hash,
      timestamp: data.block_timestamp,
      score: data.score,
      moves: data.moves,
      timeSeconds: data.time_seconds,
      playerName: data.player_name,
      createdAt: data.created_at
    });

  } catch (error) {
    console.error('Get game error:', error);
    return res.status(500).json({ error: 'Failed to fetch game data' });
  }
}
